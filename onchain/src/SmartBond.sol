// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./BondAssetToken.sol";
import { FHE, euint64, euint128, InEuint64, ebool } from "@fhenixprotocol/cofhe-contracts/FHE.sol";

error NotIssuerAdmin();

/// @notice Confidential bond lifecycle with FHE-encrypted balances and payouts.
/// @dev Uses Fhenix FHE handles for notional, coupon and payout math; plaintext funds remain ERC20.
contract SmartBond is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public issuerAdminAddr;

    IERC20 public paymentToken;
    BondAssetToken public assetToken;

    uint64 public issueDate;
    euint64 public maturityDate;
    uint64 public subscriptionEndDate;
    euint64 public priceAtIssue;
    euint64 public couponRatePerYear;

    bool public issuanceClosed;
    bool public funded;
    bool public closed;

    euint64 public soldNotional;
    euint64 public interestAtMaturity;
    euint64 public interestPerToken;
    euint64 public totalPayoutRequired;

    uint256 public payoutEscrowBalance;

    mapping(address => euint64) private _pendingPayout;
    mapping(address => euint64) private _pendingToken;
    mapping(address => euint64) private _pendingPrincipal;
    mapping(address => euint64) private _pendingInterest;
    mapping(address => bool)   private _payoutDecryptRequested;

    uint64 public constant SUBSCRIPTION_PERIOD = 7 days;
    uint256 public constant DUST_THRESHOLD = 1;
    euint64 private ENCRYPTED_ZERO;

    event BondActivated(uint64 issueDate, uint64 subscriptionEndDate, euint64 maturityDate, euint64 priceAtIssue);
    event Purchased(address indexed buyer, uint256 paymentAmount, euint64 tokenAmount, euint64 price);
    event IssuanceClosed(euint64 soldNotional);
    event InterestSet(euint64 interestAtMaturity, euint64 interestPerToken, euint64 totalPayoutRequired);
    event PayoutFunded(euint64 totalPayoutRequired, euint64 soldNotional);
    event RedeemedPayout(address indexed holder, uint256 payoutTotalPlain);
    event Redeemed(address indexed holder, euint64 tokenAmount, euint64 payoutPrincipal, euint64 payoutInterest);
    event RedeemRequested(address indexed holder, euint64 tokenAmount, euint64 payoutPrincipal, euint64 payoutInterest, euint64 payoutTotal);
    event PayoutDecryptionRequested(address indexed holder, euint64 payoutTotal);
    event BondClosed();

    modifier onlyIssuerAdmin() {
        if (msg.sender != issuerAdminAddr) revert NotIssuerAdmin();
        _;
    }

    /// @notice Expose the encrypted payout handle for off-chain/decrypt orchestration.
    function pendingPayoutHandle(address holder) external view returns (euint64) {
        return _pendingPayout[holder];
    }

    /// @notice Helper for dApps: query decrypt status and plaintext result (if ready) per holder.
    function payoutDecryptStatus(address holder) external view returns (bool ready, uint64 payoutPlain) {
        euint64 handle = _pendingPayout[holder];
        (uint64 plain, bool isReady) = FHE.getDecryptResultSafe(handle);
        return (isReady, plain);
    }

    /// @notice Create a bond with fixed coupon set at issuance.
    /// @param couponRatePerYear_ Encrypted annual rate in 18-decimal format (e.g. 5% => 5e16).
    constructor(
        address paymentToken_,
        address assetToken_,
        euint64 maturityDate_,
        euint64 priceAtIssue_,
        euint64 couponRatePerYear_,
        address issuerAdmin
    ) {
        require(paymentToken_ != address(0) && assetToken_ != address(0), "Zero addr");
        require(issuerAdmin != address(0), "Issuer=0");

        issuerAdminAddr = issuerAdmin;

        ENCRYPTED_ZERO = FHE.asEuint64(0);
        FHE.allowThis(ENCRYPTED_ZERO);

        paymentToken = IERC20(paymentToken_);
        assetToken = BondAssetToken(assetToken_);
        issuerAdminAddr = issuerAdmin;

        issueDate = uint64(block.timestamp);

        maturityDate = maturityDate_;

        subscriptionEndDate = issueDate + SUBSCRIPTION_PERIOD;

        priceAtIssue = priceAtIssue_;
        couponRatePerYear = couponRatePerYear_;

        emit BondActivated(issueDate, subscriptionEndDate, maturityDate, priceAtIssue);
    }

    /// @notice Buy bond tokens with payment currency; mint confidential notional to buyer.
    /// @dev Token amount is computed under FHE using encrypted price and capped in 64-bit.
    function buy(uint256 paymentAmount) external {
        require(!issuanceClosed, "Issuance closed");
        require(block.timestamp <= subscriptionEndDate, "After subscription end");
        require(assetToken.whitelist(msg.sender), "Not whitelisted");
        require(paymentAmount > 0, "Amount=0");

        paymentToken.safeTransferFrom(msg.sender, address(this), paymentAmount);

        // tokenAmount = (paymentAmount * 1e6) / priceAtIssue
        euint128 payment128     = FHE.asEuint128(paymentAmount);
        euint128 price128       = FHE.asEuint128(priceAtIssue);
        euint128 numerator128   = FHE.mul(payment128, FHE.asEuint128(1e6));
        euint128 tokenAmount128 = FHE.div(numerator128, price128);

        euint128 max64          = FHE.asEuint128(type(uint64).max);
        euint128 clamp128       = FHE.select(FHE.gt(tokenAmount128, max64), max64, tokenAmount128);
        euint64 tokenAmount     = FHE.asEuint64(clamp128);

        FHE.allowSender(tokenAmount);
        FHE.allowSender(priceAtIssue);

        FHE.allow(tokenAmount, address(assetToken));

        assetToken.confidentialMintTo(msg.sender, tokenAmount);
        emit Purchased(msg.sender, paymentAmount, tokenAmount, priceAtIssue);
    }

    /// @notice Close issuance and derive interest/payout parameters from final sold notional.
    /// @dev Interest is computed under FHE from coupon, duration and sold notional.
    function closeIssuance() external onlyIssuerAdmin {
        require(!issuanceClosed, "Already closed");
        soldNotional = assetToken.confidentialTotalSupply();
        FHE.allowThis(soldNotional);
        FHE.allow(soldNotional, issuerAdminAddr);

        euint64 issueDateEnc = FHE.asEuint64(issueDate);
        FHE.allowThis(issueDateEnc);

        euint64 durationEnc = FHE.sub(maturityDate, issueDateEnc);

        euint128 sold128 = FHE.asEuint128(soldNotional);
        euint128 rate128 = FHE.asEuint128(couponRatePerYear);
        euint128 duration128 = FHE.asEuint128(durationEnc);

        euint128 numer = FHE.mul(FHE.mul(sold128, rate128), duration128);
        euint128 denom = FHE.asEuint128(365 days * 1e18);
        euint128 interest128 = FHE.div(numer, denom);

        euint128 max64 = FHE.asEuint128(type(uint64).max);
        interestAtMaturity = FHE.asEuint64(FHE.select(FHE.gt(interest128, max64), max64, interest128));
        FHE.allowThis(interestAtMaturity);
        FHE.allow(interestAtMaturity, issuerAdminAddr);

        euint128 ip128 = FHE.div(FHE.mul(interest128, FHE.asEuint128(1e6)), sold128);
        interestPerToken = FHE.asEuint64(FHE.select(FHE.gt(ip128, max64), max64, ip128));
        FHE.allowThis(interestPerToken);
        FHE.allow(interestPerToken, issuerAdminAddr);

        totalPayoutRequired = FHE.add(soldNotional, interestAtMaturity);
        FHE.allowThis(totalPayoutRequired);
        FHE.allow(totalPayoutRequired, issuerAdminAddr);
        issuanceClosed = true;

        emit IssuanceClosed(soldNotional);
        emit InterestSet(interestAtMaturity, interestPerToken, totalPayoutRequired);
    }

    /// @notice Fund payout escrow in plaintext ERC20; required before redemption.
    function fundUpfront(uint256 amount) external onlyIssuerAdmin {
        require(issuanceClosed, "Issuance open");
        require(!funded, "Already funded");

        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        payoutEscrowBalance += amount;
        funded = true;

        emit PayoutFunded(totalPayoutRequired, soldNotional);
    }

    /// @notice Redeem using encrypted amount; triggers decrypt request then claim flow.
    /// @dev Two-step flow: request decrypt of encrypted payout, then claim when ready.
    function redeem(InEuint64 calldata tokenAmountEnc) external {
        euint64 tokenAmount = FHE.asEuint64(tokenAmountEnc);

        if (!_payoutDecryptRequested[msg.sender]) {
            _requestRedeem(msg.sender, tokenAmount);
            return;
        }

        _claimRedeem(msg.sender);
    }

    /// @notice Finalize bond and sweep dust back to issuer once escrow is empty.
    function finalize(address issuerAdmin) external onlyIssuerAdmin {
        require(!closed, "Already closed");
        require(payoutEscrowBalance <= DUST_THRESHOLD, "Escrow not empty");

        if (payoutEscrowBalance > 0) {
            paymentToken.safeTransfer(issuerAdmin, payoutEscrowBalance);
            payoutEscrowBalance = 0;
        }

        closed = true;
        emit BondClosed();
    }

    /// @notice Explicitly request decrypt for a redemption.
    function requestRedeemEnc(euint64 tokenAmount) external {
        require(!_payoutDecryptRequested[msg.sender], "Decrypt already requested");
        _requestRedeem(msg.sender, tokenAmount);
    }

    /// @notice Claim payout after decrypt is ready.
    function claimRedeem() external nonReentrant {
        require(_payoutDecryptRequested[msg.sender], "No pending redeem");
        _claimRedeem(msg.sender);
    }

    /// @dev Compute encrypted payout, burn confidential tokens and start decrypt.
    function _requestRedeem(address holder, euint64 tokenAmount) internal {
        require(funded, "Not funded");

        ebool isMature          = FHE.gte(FHE.asEuint64(block.timestamp), maturityDate);
        euint64 effectiveAmount = FHE.select(isMature, tokenAmount, ENCRYPTED_ZERO);

        FHE.allow(effectiveAmount, address(assetToken));

        assetToken.confidentialBurnFrom(holder, effectiveAmount);

        euint128 eff128       = FHE.asEuint128(effectiveAmount);
        euint128 ip128        = FHE.asEuint128(interestPerToken);
        euint128 interest128  = FHE.div(FHE.mul(eff128, ip128), FHE.asEuint128(1e6));
        euint128 principal128 = eff128;
        euint128 total128     = FHE.add(principal128, interest128);

        euint128 max64        = FHE.asEuint128(type(uint64).max);
        euint64 payoutInterest  = FHE.asEuint64(FHE.select(FHE.gt(interest128, max64), max64, interest128));
        euint64 payoutPrincipal = effectiveAmount;
        euint64 payoutTotalEnc  = FHE.asEuint64(FHE.select(FHE.gt(total128, max64), max64, total128));

        FHE.allow(payoutTotalEnc, issuerAdminAddr);

        _pendingPayout[holder]    = payoutTotalEnc;
        _pendingToken[holder]     = tokenAmount;
        _pendingPrincipal[holder] = payoutPrincipal;
        _pendingInterest[holder]  = payoutInterest;

        FHE.allowThis(payoutTotalEnc);
        FHE.decrypt(payoutTotalEnc);
        _payoutDecryptRequested[holder] = true;

        emit RedeemRequested(holder, tokenAmount, payoutPrincipal, payoutInterest, payoutTotalEnc);
        emit PayoutDecryptionRequested(holder, payoutTotalEnc);
    }

    /// @dev Read decrypt result and transfer plaintext payout.
    function _claimRedeem(address holder) internal {
        (uint64 payoutPlain, bool ready) = FHE.getDecryptResultSafe(_pendingPayout[holder]);
        require(ready, "Payout decryption pending");

        require(payoutEscrowBalance >= payoutPlain, "Escrow shortfall");
        payoutEscrowBalance -= payoutPlain;
        paymentToken.safeTransfer(holder, payoutPlain);

        _payoutDecryptRequested[holder] = false;

        emit RedeemedPayout(holder, payoutPlain);
        emit Redeemed(holder, _pendingToken[holder], _pendingPrincipal[holder], _pendingInterest[holder]);
    }
}
