// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./BondAssetToken.sol";
import { FHE, euint64, euint128, InEuint64, ebool } from "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract SmartBond is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ISSUER_ADMIN_ROLE = keccak256("ISSUER_ADMIN_ROLE");

    IERC20 public paymentToken;
    BondAssetToken public assetToken;

    uint64 public issueDate;
    euint64 public maturityDate;
    uint64 public subscriptionEndDate;
    euint64 public priceAtIssue;

    bool public issuanceClosed;
    bool public funded;
    bool public closed;

    address public issuerAdminAddr;

    euint64 public soldNotional;
    euint64 public interestAtMaturity;
    euint64 public interestPerToken;
    euint64 public totalPayoutRequired;

    uint256 public payoutEscrowBalance;

    mapping(address => euint64) private _pendingPayout;
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
    event BondClosed();

    constructor(
        address paymentToken_,
        address assetToken_,
        euint64 maturityDate_,
        euint64 priceAtIssue_,
        address issuerAdmin
    ) {
        require(paymentToken_ != address(0) && assetToken_ != address(0), "Zero addr");
        require(issuerAdmin != address(0), "Issuer=0");

        ENCRYPTED_ZERO = FHE.asEuint64(0);
        FHE.allowThis(ENCRYPTED_ZERO);

        paymentToken = IERC20(paymentToken_);
        assetToken = BondAssetToken(assetToken_);
        issuerAdminAddr = issuerAdmin;

        issueDate = uint64(block.timestamp);

        maturityDate = maturityDate_;

        subscriptionEndDate = issueDate + SUBSCRIPTION_PERIOD;

        priceAtIssue = priceAtIssue_;

        _grantRole(DEFAULT_ADMIN_ROLE, issuerAdmin);
        _grantRole(ISSUER_ADMIN_ROLE, issuerAdmin);

        emit BondActivated(issueDate, subscriptionEndDate, maturityDate, priceAtIssue);
    }

    // paymentAmount, priceAtIssue und alle übrigen Werte werden in Ether (18 Decimals) übergeben/verwaltet
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

    function closeIssuance() external onlyRole(ISSUER_ADMIN_ROLE) {
        require(!issuanceClosed, "Already closed");
        soldNotional = assetToken.confidentialTotalSupply();
        FHE.allowThis(soldNotional);
        FHE.allow(soldNotional, issuerAdminAddr);
        issuanceClosed = true;

        emit IssuanceClosed(soldNotional);
    }

    // interestEnc ist der Gesamtzins in Ether
    function setComputedInterest(InEuint64 calldata interestEnc) external onlyRole(ISSUER_ADMIN_ROLE) {
        require(issuanceClosed, "Issuance open");
        require(!funded, "Already funded");

        interestAtMaturity = FHE.asEuint64(interestEnc);
        FHE.allowThis(interestAtMaturity);
        FHE.allow(interestAtMaturity, issuerAdminAddr);

        // interestPerToken = (interestAtMaturity * 1e6) / soldNotional
        euint128 interest128 = FHE.asEuint128(interestAtMaturity);
        euint128 notional128 = FHE.asEuint128(soldNotional);
        euint128 ip128       = FHE.div(FHE.mul(interest128, FHE.asEuint128(1e6)), notional128);

        euint128 max64       = FHE.asEuint128(type(uint64).max);
        interestPerToken     = FHE.asEuint64(FHE.select(FHE.gt(ip128, max64), max64, ip128));
        FHE.allowThis(interestPerToken);
        FHE.allow(interestPerToken, issuerAdminAddr);

        totalPayoutRequired = FHE.add(soldNotional, interestAtMaturity);
        FHE.allowThis(totalPayoutRequired);
        FHE.allow(totalPayoutRequired, issuerAdminAddr);

        emit InterestSet(interestAtMaturity, interestPerToken, totalPayoutRequired);
    }

    function fundUpfront(uint256 amount) external onlyRole(ISSUER_ADMIN_ROLE) {
        require(issuanceClosed, "Issuance open");
        require(!funded, "Already funded");

        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        payoutEscrowBalance += amount;
        funded = true;

        emit PayoutFunded(totalPayoutRequired, soldNotional);
    }

    // Der finale Auszahlbetrag wird im 2‑Tx‑Pattern entschlüsselt offengelegt
    function redeem(InEuint64 calldata tokenAmountEnc) external nonReentrant {
        require(funded, "Not funded");

        euint64 tokenAmount = FHE.asEuint64(tokenAmountEnc);

        // Encrypted Maturity-Check; falls nicht fällig → 0
        ebool isMature          = FHE.gte(FHE.asEuint64(block.timestamp), maturityDate);
        euint64 effectiveAmount = FHE.select(isMature, tokenAmount, ENCRYPTED_ZERO);

        assetToken.confidentialBurnFrom(msg.sender, effectiveAmount);

        // interest = (effectiveAmount * interestPerToken) / 1e6
        euint128 eff128      = FHE.asEuint128(effectiveAmount);
        euint128 ip128       = FHE.asEuint128(interestPerToken);
        euint128 interest128 = FHE.div(FHE.mul(eff128, ip128), FHE.asEuint128(1e6));
        euint128 principal128= eff128;
        euint128 total128    = FHE.add(principal128, interest128);

        euint128 max64       = FHE.asEuint128(type(uint64).max);
        euint64 payoutInterest  = FHE.asEuint64(FHE.select(FHE.gt(interest128, max64), max64, interest128));
        euint64 payoutPrincipal = effectiveAmount;
        euint64 payoutTotalEnc  = FHE.asEuint64(FHE.select(FHE.gt(total128, max64), max64, total128));

        FHE.allow(payoutTotalEnc, issuerAdminAddr);

        if (!_payoutDecryptRequested[msg.sender]) {
            _pendingPayout[msg.sender] = payoutTotalEnc;
            FHE.allowThis(payoutTotalEnc);
            FHE.decrypt(payoutTotalEnc);
            _payoutDecryptRequested[msg.sender] = true;
            revert("Payout decryption started, retry redeem");
        } else {
            (uint64 payoutTotalPlain, bool ready) = FHE.getDecryptResultSafe(_pendingPayout[msg.sender]);
            require(ready, "Payout decryption pending");

            require(payoutEscrowBalance >= payoutTotalPlain, "Escrow shortfall");
            payoutEscrowBalance -= payoutTotalPlain;
            paymentToken.safeTransfer(msg.sender, payoutTotalPlain);

            _payoutDecryptRequested[msg.sender] = false;

            emit RedeemedPayout(msg.sender, payoutTotalPlain);
            emit Redeemed(msg.sender, tokenAmount, payoutPrincipal, payoutInterest);
        }
    }

    function finalize(address issuerAdmin) external onlyRole(ISSUER_ADMIN_ROLE) {
        require(!closed, "Already closed");
        require(payoutEscrowBalance <= DUST_THRESHOLD, "Escrow not empty");

        if (payoutEscrowBalance > 0) {
            paymentToken.safeTransfer(issuerAdmin, payoutEscrowBalance);
            payoutEscrowBalance = 0;
        }

        closed = true;
        emit BondClosed();
    }

    // Test-Helper (Foundry kann InEuint64 nicht direkt erzeugen)
    function setComputedInterestEnc(euint64 interestEnc) external onlyRole(ISSUER_ADMIN_ROLE) {
        require(issuanceClosed, "Issuance open");
        require(!funded, "Already funded");

        interestAtMaturity = interestEnc;
        FHE.allowThis(interestAtMaturity);
        FHE.allow(interestAtMaturity, issuerAdminAddr);

        euint128 interest128 = FHE.asEuint128(interestAtMaturity);
        euint128 notional128 = FHE.asEuint128(soldNotional);
        euint128 ip128       = FHE.div(FHE.mul(interest128, FHE.asEuint128(1e6)), notional128);

        euint128 max64       = FHE.asEuint128(type(uint64).max);
        interestPerToken     = FHE.asEuint64(FHE.select(FHE.gt(ip128, max64), max64, ip128));
        FHE.allowThis(interestPerToken);
        FHE.allow(interestPerToken, issuerAdminAddr);

        totalPayoutRequired = FHE.add(soldNotional, interestAtMaturity);
        FHE.allowThis(totalPayoutRequired);
        FHE.allow(totalPayoutRequired, issuerAdminAddr);

        emit InterestSet(interestAtMaturity, interestPerToken, totalPayoutRequired);
    }

    function redeemEnc(euint64 tokenAmount) external nonReentrant {
        require(funded, "Not funded");

        ebool isMature          = FHE.gte(FHE.asEuint64(block.timestamp), maturityDate);
        euint64 effectiveAmount = FHE.select(isMature, tokenAmount, ENCRYPTED_ZERO);

        assetToken.confidentialBurnFrom(msg.sender, effectiveAmount);

        euint128 eff128      = FHE.asEuint128(effectiveAmount);
        euint128 ip128       = FHE.asEuint128(interestPerToken);
        euint128 interest128 = FHE.div(FHE.mul(eff128, ip128), FHE.asEuint128(1e6));
        euint128 principal128= eff128;
        euint128 total128    = FHE.add(principal128, interest128);

        euint128 max64       = FHE.asEuint128(type(uint64).max);
        euint64 payoutInterest  = FHE.asEuint64(FHE.select(FHE.gt(interest128, max64), max64, interest128));
        euint64 payoutPrincipal = effectiveAmount;
        euint64 payoutTotalEnc  = FHE.asEuint64(FHE.select(FHE.gt(total128, max64), max64, total128));

        FHE.allow(payoutTotalEnc, issuerAdminAddr);

        if (!_payoutDecryptRequested[msg.sender]) {
            _pendingPayout[msg.sender] = payoutTotalEnc;
            FHE.allowThis(payoutTotalEnc);
            FHE.decrypt(payoutTotalEnc);
            _payoutDecryptRequested[msg.sender] = true;
            revert("Payout decryption started, retry redeem");
        } else {
            (uint64 payoutTotalPlain, bool ready) = FHE.getDecryptResultSafe(_pendingPayout[msg.sender]);
            require(ready, "Payout decryption pending");

            require(payoutEscrowBalance >= payoutTotalPlain, "Escrow shortfall");
            payoutEscrowBalance -= payoutTotalPlain;
            paymentToken.safeTransfer(msg.sender, payoutTotalPlain);

            _payoutDecryptRequested[msg.sender] = false;

            emit RedeemedPayout(msg.sender, payoutTotalPlain);
            emit Redeemed(msg.sender, tokenAmount, payoutPrincipal, payoutInterest);
        }
    }
}
