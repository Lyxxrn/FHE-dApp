// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {FHE, euint64} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {ITaskManager} from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";

import {MockLURC} from "../src/MockLURC.sol";
import {BondAssetToken} from "../src/BondAssetToken.sol";
import {SmartBond} from "../src/SmartBond.sol";
import {SmartBondRegistry} from "../src/SmartBondRegistry.sol";

contract BondLifecycleFheTest is Test {
    address constant TASK_MANAGER = 0xeA30c4B8b44078Bbf8a6ef5b9f1eC1626C7848D9;
    address issuer    = address(0xA11CE);
    address investor1 = address(0xB0B1);
    address investor2 = address(0xC0C2);

    MockLURC lurc;
    BondAssetToken asset;
    SmartBond bond;
    SmartBondRegistry registry;

    // Test-Config
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

        // encrypt handles for later usage
        euint64 capEnc    = FHE.asEuint64(capPlain);
        euint64 matEnc    = FHE.asEuint64(maturityTs);
        euint64 priceEnc  = FHE.asEuint64(pricePlain);
        euint64 couponEnc = FHE.asEuint64(uint64(couponPerYear));

        // Asset
        asset = new BondAssetToken(capEnc, issuer);
        FHE.allow(capEnc, issuer);
        FHE.allow(capEnc, address(asset));

        // Bond
        bond = new SmartBond(address(lurc), address(asset), matEnc, priceEnc, couponEnc, issuer);
        FHE.allow(matEnc, address(bond));
        FHE.allow(matEnc, issuer);
        FHE.allow(priceEnc, address(bond));
        FHE.allow(priceEnc, issuer);
        FHE.allow(couponEnc, address(bond));
        FHE.allow(couponEnc, issuer);

        // Link
        vm.prank(issuer);
        asset.setBond(address(bond));

        // Registry
        registry = new SmartBondRegistry(issuer);
        vm.prank(issuer);
        registry.setFactory(address(this));

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

    // helpers
    function _computeInterest(uint256 soldNotional) internal view returns (uint256) {
        uint256 duration = uint256(maturityTs) - uint256(issueDate);
        return (soldNotional * couponPerYear * duration) / (365 days * 1e18);
    }

    function _redeemWithDecrypt(address investor, euint64 amountEnc, uint256 expectedPayoutPlain) internal {
        vm.startPrank(investor);
        bond.requestRedeemEnc(amountEnc);
        vm.stopPrank();

        euint64 payoutHandle = bond.pendingPayoutHandle(investor);
        vm.mockCall(
            TASK_MANAGER,
            abi.encodeWithSelector(ITaskManager.getDecryptResultSafe.selector, euint64.unwrap(payoutHandle)),
            abi.encode(expectedPayoutPlain, true)
        );

        vm.prank(investor);
        bond.claimRedeem();
    }

    // Tests the full sbc lifecycle with a single investor
    function testFullLifecycle_SingleInvestor_FHE() public {

        // buy bond (investor)
        vm.startPrank(investor1);
        lurc.approve(address(bond), 100_000_000);
        bond.buy(100_000_000);
        vm.stopPrank();

        // close issuance (issuer)
        vm.prank(issuer);
        bond.closeIssuance();

        // calculate interest (off-chain) (issuer, will be automated with dApp)
        uint256 soldNotionalPlain = 100_000_000;
        uint256 interestPlain     = _computeInterest(soldNotionalPlain);

        // fund the payout (issuer)
        uint256 totalPayoutRequiredPlain = soldNotionalPlain + interestPlain;
        vm.startPrank(issuer);
        lurc.mint(issuer, totalPayoutRequiredPlain);
        lurc.approve(address(bond), totalPayoutRequiredPlain);
        bond.fundUpfront(totalPayoutRequiredPlain);
        vm.stopPrank();

        // redeem pyout (2x-pattern with helper) (investor)
        vm.warp(maturityTs + 1);
        uint256 beforeBal = lurc.balanceOf(investor1);

        euint64 amtEnc = FHE.asEuint64(100_000_000);
        FHE.allow(amtEnc, address(bond));

        uint256 expectedPayout = 100_000_000 + (100_000_000 * interestPlain) / soldNotionalPlain;
        _redeemWithDecrypt(investor1, amtEnc, expectedPayout);
        assertEq(lurc.balanceOf(investor1), beforeBal + expectedPayout, "payout mismatch");

        vm.prank(issuer);
        bond.finalize(issuer);
    }

    // Tests same lifecycle like single investor, but makes sure that interest is calculated correctly even with multiple investors
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

        uint256 totalPayoutRequiredPlain = soldNotionalPlain + interestPlain;
        vm.startPrank(issuer);
        lurc.mint(issuer, totalPayoutRequiredPlain);
        lurc.approve(address(bond), totalPayoutRequiredPlain);
        bond.fundUpfront(totalPayoutRequiredPlain);
        vm.stopPrank();

        vm.warp(maturityTs + 1);
        uint256 i1Before = lurc.balanceOf(investor1);
        uint256 i2Before = lurc.balanceOf(investor2);

        uint256 i1Interest = (100_000_000 * interestPlain) / soldNotionalPlain;
        uint256 i2Interest = (200_000_000 * interestPlain) / soldNotionalPlain;

        // Investor1
        euint64 amt1 = FHE.asEuint64(100_000_000);
        FHE.allow(amt1, address(bond));
        _redeemWithDecrypt(investor1, amt1, 100_000_000 + i1Interest);

        // Investor2
        euint64 amt2 = FHE.asEuint64(200_000_000);
        FHE.allow(amt2, address(bond));
        _redeemWithDecrypt(investor2, amt2, 200_000_000 + i2Interest);

        assertEq(lurc.balanceOf(investor1), i1Before + 100_000_000 + i1Interest, "i1 payout mismatch");
        assertEq(lurc.balanceOf(investor2), i2Before + 200_000_000 + i2Interest, "i2 payout mismatch");
    }

    // Tests if whitelisting works
    function testBuyReverts_NotWhitelisted() public {
        vm.prank(issuer);
        asset.setWhitelist(investor1, false);

        vm.startPrank(investor1);
        lurc.approve(address(bond), 10_000_000);
        vm.expectRevert("Not whitelisted");
        bond.buy(10_000_000);
        vm.stopPrank();
    }

    // tests to buy a bond after bond is closed
    function testBuyReverts_AfterSubscriptionEnd() public {
        uint64 subEnd = bond.subscriptionEndDate();
        vm.warp(subEnd + 1);

        vm.startPrank(investor1);
        lurc.approve(address(bond), 10_000_000);
        vm.expectRevert("After subscription end");
        bond.buy(10_000_000);
        vm.stopPrank();
    }

    // Test to redeem payout before bond is 'mature'
    function testRedeem_BeforeMaturity_PaysZero_FHE() public {
        vm.startPrank(investor1);
        lurc.approve(address(bond), 10_000_000);
        bond.buy(10_000_000);
        vm.stopPrank();

        vm.prank(issuer);
        bond.closeIssuance();

        uint256 soldNotionalPlain = 10_000_000;
        uint256 interestPlain     = _computeInterest(soldNotionalPlain);

        vm.startPrank(issuer);
        uint256 required = soldNotionalPlain + interestPlain;
        lurc.mint(issuer, required);
        lurc.approve(address(bond), required);
        bond.fundUpfront(required);
        vm.stopPrank();

        uint256 before = lurc.balanceOf(investor1);
        euint64 amt = FHE.asEuint64(10_000_000);
        FHE.allow(amt, address(bond));

        _redeemWithDecrypt(investor1, amt, 0);

        assertEq(lurc.balanceOf(investor1), before, "payout should be zero before maturity");
    }

    // Tests if asset token is only available to bond
    function testMintBurnOnlyByBond() public {
        euint64 oneEnc = FHE.asEuint64(1);
        vm.expectRevert("Only bond");
        asset.confidentialMintTo(investor1, oneEnc);

        vm.expectRevert("Only bond");
        asset.confidentialBurnFrom(investor1, oneEnc);
    }

    // Tests registry
    function testRegistryContents() public {
        SmartBondRegistry.BondInfo[] memory arr = registry.getAllBonds();
        assertEq(arr.length, 1, "registry count mismatch");
        SmartBondRegistry.BondInfo memory info = arr[0];
        assertEq(info.bond, address(bond), "bond addr mismatch");
        assertEq(info.issuer, issuer, "issuer mismatch");
        assertEq(info.issueDate, issueDate, "issueDate mismatch");
        assertEq(info.subscriptionEndDate, bond.subscriptionEndDate(), "subEnd mismatch");
        assertEq(info.currencyToken, address(lurc), "currency token mismatch");
    }
}
