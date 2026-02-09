// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "test/testContracts/public/PublicSmartBondRegistry.sol";
import "test/testContracts/public/PublicSmartBond.sol";
import "test/testContracts/public/PublicBondAssetToken.sol";

/// @notice Factory for issuing public bonds and their asset tokens.
contract PublicSmartBondFactory {
    address public issuerAdminAddr;
    PublicSmartBondRegistry public registry;

    event BondCreated(address indexed bond, address indexed assetToken, address indexed issuer);

    modifier onlyIssuerAdmin() {
        if (msg.sender != issuerAdminAddr) revert NotIssuerAdmin();
        _;
    }

    constructor(address admin, address registry_) {
        issuerAdminAddr = admin;
        registry = PublicSmartBondRegistry(registry_);
    }

    /// @notice Create a new Bond and its AssetToken; subscriptionEndDate is derived inside the Bond.
    function createBond(
        address paymentToken,
        uint64 cap,
        uint64 maturityDate,
        uint64 priceAtIssue,
        uint64 couponRatePerYear,
        string calldata isin
    ) external onlyIssuerAdmin returns (address bondAddr, address assetAddr) {
        require(paymentToken != address(0), "Payment=0");

        address issuer = msg.sender;

        // Deploy asset token
        PublicBondAssetToken assetToken = new PublicBondAssetToken(cap, issuer);
        assetAddr = address(assetToken);

        // Deploy bond
        PublicSmartBond bond = new PublicSmartBond(
            paymentToken,
            assetAddr,
            maturityDate,
            priceAtIssue,
            couponRatePerYear,
            issuer
        );
        bondAddr = address(bond);

        // Link asset to bond
        assetToken.setBond(bondAddr);

        // Read derived values
        uint64 issueDate = bond.issueDate();
        uint64 subscriptionEndDate = bond.subscriptionEndDate();

        // Register bond in registry
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
