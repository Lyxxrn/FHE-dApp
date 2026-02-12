// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./SmartBondRegistry.sol";
import "./SmartBond.sol";
import "./BondAssetToken.sol";
import { FHE, euint64, InEuint64 } from "@fhenixprotocol/cofhe-contracts/FHE.sol";

/// @notice Factory for issuing bonds and their confidential asset tokens.
/// @dev Converts encrypted inputs to handles and wires FHE access grants.
contract SmartBondFactory {
    address public issuerAdminAddr;
    SmartBondRegistry public registry;

    event BondCreated(address indexed bond, address indexed assetToken, address indexed issuer);

    modifier onlyIssuerAdmin() {
        if (msg.sender != issuerAdminAddr) revert NotIssuerAdmin();
        _;
    }

    constructor(address admin, address registry_) {
        issuerAdminAddr = admin;
        registry = SmartBondRegistry(registry_);
    }

    /// @notice Create a new Bond and its AssetToken; subscriptionEndDate is derived inside the Bond.
    function createBond(
        address paymentToken,
        InEuint64 calldata cap_,
        InEuint64 calldata maturityDate_,
        InEuint64 calldata priceAtIssue_,
        InEuint64 calldata couponRatePerYear_,
        string calldata isin
    ) external onlyIssuerAdmin  returns (address bondAddr, address assetAddr) {
        require(paymentToken != address(0), "Payment=0");

        address issuer = msg.sender;

        // Convert confidential inputs to on-chain handles
        euint64 cap = FHE.asEuint64(cap_);
        euint64 maturityDate = FHE.asEuint64(maturityDate_);
        euint64 priceAtIssue = FHE.asEuint64(priceAtIssue_);
        euint64 couponRatePerYear = FHE.asEuint64(couponRatePerYear_);

        // Deploy asset token
        BondAssetToken assetToken = new BondAssetToken(cap, issuer);
        assetAddr = address(assetToken);

        // Grant AssetToken access to its cap handle
        FHE.allow(cap, assetAddr);

        // Deploy bond
        SmartBond bond = new SmartBond(
            paymentToken,
            assetAddr,
            maturityDate,
            priceAtIssue,
            couponRatePerYear,
            issuer
        );
        bondAddr = address(bond);

        // Grant Bond access to maturity/price handles
        FHE.allow(maturityDate, bondAddr);
        FHE.allow(priceAtIssue, bondAddr);
        FHE.allow(couponRatePerYear, bondAddr);

        // Link asset to bond
        assetToken.setBond(bondAddr);

        // Read derived values
        uint64 issueDate = bond.issueDate();
        uint64 subscriptionEndDate = bond.subscriptionEndDate();

        // Grant Registry access to maturity/cap handles
        FHE.allow(maturityDate, address(registry));
        FHE.allow(cap, address(registry));

        // Register bond in registry (expects euint64 handles)
        registry.registerBond(
            bondAddr,
            issuer,
            issueDate,
            maturityDate,
            subscriptionEndDate,
            cap,
            paymentToken,
            isin
        );

        emit BondCreated(bondAddr, assetAddr, issuer);
    }
}
