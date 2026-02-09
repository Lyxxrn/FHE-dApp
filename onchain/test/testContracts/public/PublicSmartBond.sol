// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "test/testContracts/public/PublicBondAssetToken.sol";

error NotIssuerAdmin();

/// @notice Public (non-FHE) bond lifecycle with plaintext balances and payouts.
/// @dev Mirrors the FHE contract API and logic using uints.
contract PublicSmartBond {
    using SafeERC20 for IERC20;

    address public issuerAdminAddr;

    IERC20 public paymentToken;
    PublicBondAssetToken public assetToken;

    uint64 public issueDate;
    uint64 public maturityDate;
    uint64 public subscriptionEndDate;
    uint64 public priceAtIssue;
    uint64 public couponRatePerYear;

    bool public issuanceClosed;
    bool public funded;
    bool public closed;

    uint64 public soldNotional;
    uint64 public interestAtMaturity;
    uint64 public interestPerToken;
    uint64 public totalPayoutRequired;

    uint256 public payoutEscrowBalance;

    mapping(address => uint256) private _pendingPayout;
    mapping(address => uint64) private _pendingToken;
    mapping(address => uint64) private _pendingPrincipal;
    mapping(address => uint64) private _pendingInterest;
    mapping(address => bool)   private _payoutRequested;

    uint64 public constant SUBSCRIPTION_PERIOD = 7 days;
    uint256 public constant DUST_THRESHOLD = 1;

    event BondActivated(uint64 issueDate, uint64 subscriptionEndDate, uint64 maturityDate, uint64 priceAtIssue);
    event Purchased(address indexed buyer, uint256 paymentAmount, uint64 tokenAmount, uint64 price);
    event IssuanceClosed(uint64 soldNotional);
    event InterestSet(uint64 interestAtMaturity, uint64 interestPerToken, uint64 totalPayoutRequired);
    event PayoutFunded(uint64 totalPayoutRequired, uint64 soldNotional);
    event RedeemedPayout(address indexed holder, uint256 payoutTotalPlain);
    event Redeemed(address indexed holder, uint64 tokenAmount, uint64 payoutPrincipal, uint64 payoutInterest);
    event RedeemRequested(address indexed holder, uint64 tokenAmount, uint64 payoutPrincipal, uint64 payoutInterest, uint256 payoutTotal);
    event BondClosed();

    modifier onlyIssuerAdmin() {
        if (msg.sender != issuerAdminAddr) revert NotIssuerAdmin();
        _;
    }

    /// @notice Create a bond with fixed coupon set at issuance.
    /// @param couponRatePerYear_ Annual rate in 18-decimal format (e.g. 5% => 5e16).
    constructor(
        address paymentToken_,
        address assetToken_,
        uint64 maturityDate_,
        uint64 priceAtIssue_,
        uint64 couponRatePerYear_,
        address issuerAdmin
    ) {
        require(paymentToken_ != address(0) && assetToken_ != address(0), "Zero addr");
        require(issuerAdmin != address(0), "Issuer=0");

        issuerAdminAddr = issuerAdmin;

        paymentToken = IERC20(paymentToken_);
        assetToken = PublicBondAssetToken(assetToken_);

        issueDate = uint64(block.timestamp);
        maturityDate = maturityDate_;
        subscriptionEndDate = issueDate + SUBSCRIPTION_PERIOD;
        priceAtIssue = priceAtIssue_;
        couponRatePerYear = couponRatePerYear_;

        emit BondActivated(issueDate, subscriptionEndDate, maturityDate, priceAtIssue);
    }

    /// @notice Buy bond tokens with payment currency; mint notional to buyer.
    /// @dev Token amount = (paymentAmount * 1e6) / priceAtIssue, clamped to uint64.
    function buy(uint256 paymentAmount) external {
        require(!issuanceClosed, "Issuance closed");
        require(block.timestamp <= subscriptionEndDate, "After subscription end");
        require(assetToken.whitelist(msg.sender), "Not whitelisted");
        require(paymentAmount > 0, "Amount=0");

        paymentToken.safeTransferFrom(msg.sender, address(this), paymentAmount);

        uint256 tokenAmount = (paymentAmount * 1e6) / priceAtIssue;
        if (tokenAmount > type(uint64).max) {
            tokenAmount = type(uint64).max;
        }

        uint64 minted = assetToken.confidentialMintTo(msg.sender, uint64(tokenAmount));
        emit Purchased(msg.sender, paymentAmount, minted, priceAtIssue);
    }

    /// @notice Close issuance and derive interest/payout parameters from final sold notional.
    /// @dev Interest is computed from coupon, duration and sold notional.
    function closeIssuance() external onlyIssuerAdmin {
        require(!issuanceClosed, "Already closed");
        soldNotional = assetToken.confidentialTotalSupply();

        uint256 duration = uint256(maturityDate) - uint256(issueDate);
        uint256 interest;
        if (soldNotional > 0) {
            interest = (uint256(soldNotional) * uint256(couponRatePerYear) * duration) / (365 days * 1e18);
        }

        if (interest > type(uint64).max) {
            interest = type(uint64).max;
        }

        interestAtMaturity = uint64(interest);

        uint256 ip;
        if (soldNotional > 0) {
            ip = (interest * 1e6) / uint256(soldNotional);
        }
        if (ip > type(uint64).max) {
            ip = type(uint64).max;
        }

        interestPerToken = uint64(ip);

        uint256 total = uint256(soldNotional) + interestAtMaturity;
        if (total > type(uint64).max) {
            total = type(uint64).max;
        }
        totalPayoutRequired = uint64(total);

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

    /// @notice Request redeem; payout is computed and stored.
    function requestRedeem(uint64 tokenAmount) external {
        require(!_payoutRequested[msg.sender], "Redeem already requested");
        _requestRedeem(msg.sender, tokenAmount);
    }

    /// @notice Claim payout after request.
    function claimRedeem() external {
        require(_payoutRequested[msg.sender], "No pending redeem");
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

    /// @dev Compute payout, burn tokens and store pending redemption.
    function _requestRedeem(address holder, uint64 tokenAmount) internal {
        require(funded, "Not funded");

        uint64 effectiveAmount = block.timestamp >= maturityDate ? tokenAmount : 0;

        assetToken.confidentialBurnFrom(holder, effectiveAmount);

        uint256 interest = (uint256(effectiveAmount) * uint256(interestPerToken)) / 1e6;
        uint256 total = uint256(effectiveAmount) + interest;

        _pendingPayout[holder] = total;
        _pendingToken[holder] = tokenAmount;
        _pendingPrincipal[holder] = effectiveAmount;
        _pendingInterest[holder] = uint64(interest > type(uint64).max ? type(uint64).max : interest);
        _payoutRequested[holder] = true;

        emit RedeemRequested(holder, tokenAmount, _pendingPrincipal[holder], _pendingInterest[holder], total);
    }

    /// @dev Transfer payout from escrow.
    function _claimRedeem(address holder) internal {
        uint256 payoutTotalPlain = _pendingPayout[holder];
        require(payoutEscrowBalance >= payoutTotalPlain, "Escrow shortfall");

        payoutEscrowBalance -= payoutTotalPlain;
        paymentToken.safeTransfer(holder, payoutTotalPlain);

        _payoutRequested[holder] = false;

        emit RedeemedPayout(holder, payoutTotalPlain);
        emit Redeemed(holder, _pendingToken[holder], _pendingPrincipal[holder], _pendingInterest[holder]);
    }
}
