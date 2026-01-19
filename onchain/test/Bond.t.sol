// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {FHE, euint64} from "@fhenixprotocol/cofhe-contracts/FHE.sol";

import {MockLURC} from "../src/MockLURC.sol";
import {BondAssetToken} from "../src/BondAssetToken.sol";
import {SmartBond} from "../src/SmartBond.sol";
import {SmartBondRegistry} from "../src/SmartBondRegistry.sol";

contract BondLifecycleFheTest is Test {
    address issuer    = address(0xA11CE);
    address investor1 = address(0xB0B1);
    address investor2 = address(0xC0C2);

    MockLURC lurc;
    BondAssetToken asset;
    SmartBond bond;
    SmartBondRegistry registry;

    // Test-Config (Ether-Konvention)
    uint64 issueDate;
    uint64 maturityTs;
    uint64 capPlain      = 1_000_000_000;
    uint64 pricePlain    = 1_000;   // Par
    uint256 couponPerYear = 5e4;      // 5% p.a. (6-decimal Rate)

    function setUp() public {
        // Make the test contract known to the FHE precompile system
        FHE.asEuint64(0);

        issueDate  = uint64(block.timestamp);
        maturityTs = uint64(block.timestamp + 365 days);

        // Payment-Token
        vm.startPrank(issuer);
        lurc = new MockLURC("Mock LURC", "LURC", issuer);
        vm.stopPrank();

        // Verschlüsselte Handles (Provider) und Zugriff für Consumer
        euint64 capEnc   = FHE.asEuint64(capPlain);
        euint64 matEnc   = FHE.asEuint64(maturityTs);
        euint64 priceEnc = FHE.asEuint64(pricePlain);

        // Asset
        asset = new BondAssetToken(capEnc, issuer);
        FHE.allow(capEnc, issuer);
        FHE.allow(capEnc, address(asset));

        // Bond
        bond = new SmartBond(address(lurc), address(asset), matEnc, priceEnc, issuer);
        FHE.allow(matEnc, address(bond));
        FHE.allow(matEnc, issuer);
        FHE.allow(priceEnc, address(bond));
        FHE.allow(priceEnc, issuer);

        // Link
        vm.prank(issuer);
        asset.setBond(address(bond));

        // Registry
        registry = new SmartBondRegistry(issuer);
        vm.prank(issuer);
        registry.setFactory(address(this)); // FACTORY_ROLE für diesen Test

        FHE.allow(matEnc, address(registry));
        FHE.allow(capEnc, address(registry));
        registry.registerBond(
            address(bond),
            issuer,
            issueDate,
            matEnc,
            issueDate + 7 days,
            capEnc,
            address(lurc)
        );

        // Whitelist + LURC Funding
        vm.startPrank(issuer);
        asset.setWhitelist(investor1, true);
        asset.setWhitelist(investor2, true);
        lurc.mint(investor1, 200_000_000);
        lurc.mint(investor2, 300_000_000);
        vm.stopPrank();
    }

    // Off-Chain Zinsberechnung (einfaches Pro-Rata über Laufzeit)
    function _computeInterest(uint256 soldNotional) internal view returns (uint256) {
        uint256 duration = uint256(maturityTs) - uint256(issueDate);
        return (soldNotional * couponPerYear * duration) / (365 days * 1e18);
    }

    function testFullLifecycle_SingleInvestor_FHE() public {
        // Kauf
        vm.startPrank(investor1);
        lurc.approve(address(bond), 100_000_000);
        bond.buy(100_000_000);
        vm.stopPrank();

        // Issuance schließen
        vm.prank(issuer);
        bond.closeIssuance();

        // Zins off-chain
        uint256 soldNotionalPlain = 100_000_000;
        uint256 interestPlain     = _computeInterest(soldNotionalPlain);

        // Zins setzen (verschlüsselt)
        vm.prank(issuer);
        euint64 interestEnc = FHE.asEuint64(interestPlain);
        FHE.allow(interestEnc, address(bond));
        bond.setComputedInterestEnc(interestEnc);

        // Escrow funden (öffentlich)
        uint256 totalPayoutRequiredPlain = soldNotionalPlain + interestPlain;
        vm.startPrank(issuer);
        lurc.mint(issuer, totalPayoutRequiredPlain);
        lurc.approve(address(bond), totalPayoutRequiredPlain);
        bond.fundUpfront(totalPayoutRequiredPlain);
        vm.stopPrank();

        // Nach Fälligkeit redeem (2‑Tx)
        vm.warp(maturityTs + 1);
        uint256 beforeBal = lurc.balanceOf(investor1);

        euint64 amtEnc = FHE.asEuint64(100_000_000);
        FHE.allow(amtEnc, address(bond));

        vm.startPrank(investor1);
        vm.expectRevert(bytes("Payout decryption started, retry redeem"));
        bond.redeemEnc(amtEnc);
        bond.redeemEnc(amtEnc);
        vm.stopPrank();

        uint256 expectedPayout = 100_000_000 + (100_000_000 * interestPlain) / soldNotionalPlain;
        assertEq(lurc.balanceOf(investor1), beforeBal + expectedPayout, "payout mismatch");

        vm.prank(issuer);
        bond.finalize(issuer);
    }

    function testTwoInvestors_ProRata_FHE() public {
        // Käufe
        vm.startPrank(investor1);
        lurc.approve(address(bond), 100_000_000);
        bond.buy(100_000_000);
        vm.stopPrank();

        vm.startPrank(investor2);
        lurc.approve(address(bond), 200_000_000);
        bond.buy(200_000_000);
        vm.stopPrank();

        vm.prank(issuer);
        bond.closeIssuance();

        uint256 soldNotionalPlain = 300_000_000;
        uint256 interestPlain     = _computeInterest(soldNotionalPlain);

        vm.prank(issuer);
        euint64 interestEnc = FHE.asEuint64(interestPlain);
        FHE.allow(interestEnc, address(bond));
        bond.setComputedInterestEnc(interestEnc);

        uint256 totalPayoutRequiredPlain = soldNotionalPlain + interestPlain;
        vm.startPrank(issuer);
        lurc.mint(issuer, totalPayoutRequiredPlain);
        lurc.approve(address(bond), totalPayoutRequiredPlain);
        bond.fundUpfront(totalPayoutRequiredPlain);
        vm.stopPrank();

        vm.warp(maturityTs + 1);
        uint256 i1Before = lurc.balanceOf(investor1);
        uint256 i2Before = lurc.balanceOf(investor2);

        // Investor1
        euint64 amt1 = FHE.asEuint64(100_000_000);
        FHE.allow(amt1, address(bond));
        vm.startPrank(investor1);
        vm.expectRevert(bytes("Payout decryption started, retry redeem"));
        bond.redeemEnc(amt1);
        bond.redeemEnc(amt1);
        vm.stopPrank();

        // Investor2
        euint64 amt2 = FHE.asEuint64(200_000_000);
        FHE.allow(amt2, address(bond));
        vm.startPrank(investor2);
        vm.expectRevert(bytes("Payout decryption started, retry redeem"));
        bond.redeemEnc(amt2);
        bond.redeemEnc(amt2);
        vm.stopPrank();

        uint256 i1Interest = (100_000_000 * interestPlain) / soldNotionalPlain;
        uint256 i2Interest = (200_000_000 * interestPlain) / soldNotionalPlain;

        assertEq(lurc.balanceOf(investor1), i1Before + 100_000_000 + i1Interest, "i1 payout mismatch");
        assertEq(lurc.balanceOf(investor2), i2Before + 200_000_000 + i2Interest, "i2 payout mismatch");
    }

    function testBuyReverts_NotWhitelisted() public {
        vm.prank(issuer);
        asset.setWhitelist(investor1, false);

        vm.startPrank(investor1);
        lurc.approve(address(bond), 10_000_000);
        vm.expectRevert("Not whitelisted");
        bond.buy(10_000_000);
        vm.stopPrank();
    }

    function testBuyReverts_AfterSubscriptionEnd() public {
        uint64 subEnd = bond.subscriptionEndDate();
        vm.warp(subEnd + 1);

        vm.startPrank(investor1);
        lurc.approve(address(bond), 10_000_000);
        vm.expectRevert("After subscription end");
        bond.buy(10_000_000);
        vm.stopPrank();
    }

    function testRedeem_BeforeMaturity_PaysZero_FHE() public {
        vm.startPrank(investor1);
        lurc.approve(address(bond), 10_000_000);
        bond.buy(10_000_000);
        vm.stopPrank();

        vm.prank(issuer);
        bond.closeIssuance();

        uint256 soldNotionalPlain = 10_000_000;
        uint256 interestPlain     = _computeInterest(soldNotionalPlain);

        vm.prank(issuer);
        euint64 interestEnc = FHE.asEuint64(interestPlain);
        FHE.allow(interestEnc, address(bond));
        bond.setComputedInterestEnc(interestEnc);

        vm.startPrank(issuer);
        uint256 required = soldNotionalPlain + interestPlain;
        lurc.mint(issuer, required);
        lurc.approve(address(bond), required);
        bond.fundUpfront(required);
        vm.stopPrank();

        uint256 before = lurc.balanceOf(investor1);
        euint64 amt = FHE.asEuint64(10_000_000);
        FHE.allow(amt, address(bond));

        vm.startPrank(investor1);
        vm.expectRevert(bytes("Payout decryption started, retry redeem"));
        bond.redeemEnc(amt);
        bond.redeemEnc(amt);
        vm.stopPrank();

        assertEq(lurc.balanceOf(investor1), before, "payout should be zero before maturity");
    }

    function testMintBurnOnlyByBond() public {
        vm.expectRevert("Only bond");
        asset.confidentialMintTo(investor1, FHE.asEuint64(1));

        vm.expectRevert("Only bond");
        asset.confidentialBurnFrom(investor1, FHE.asEuint64(1));
    }

    function testRegistryContents() public {
        SmartBondRegistry.BondInfo[] memory arr = registry.getAllBonds();
        assertEq(arr.length, 1, "registry count mismatch");
        SmartBondRegistry.BondInfo memory info = arr[0];
        assertEq(info.bond, address(bond), "bond addr mismatch");
        assertEq(info.issuer, issuer, "issuer mismatch");
        assertEq(info.issueDate, issueDate, "issueDate mismatch");
        assertEq(info.subscriptionEndDate, bond.subscriptionEndDate(), "subEnd mismatch");
        assertEq(info.currencyToken, address(lurc), "currency token mismatch");
        // Encrypted Felder (maturityDate, notionalCap) sind Handles – kein Klartextvergleich.
    }
}
