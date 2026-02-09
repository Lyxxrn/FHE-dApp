// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {FHE, euint64} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {ITaskManager, FunctionId, EncryptedInput} from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";

import {MockLURC} from "test/testContracts/MockLURC.sol";

// FHE contracts
import {BondAssetToken} from "test/testContracts/BondAssetToken.sol";
import {SmartBond} from "test/testContracts/SmartBond.sol";
import {SmartBondRegistry} from "test/testContracts/SmartBondRegistry.sol";
import {SmartBondFactory} from "test/testContracts/SmartBondFactory.sol";

// Public contracts
import {PublicBondAssetToken} from "test/testContracts/public/PublicBondAssetToken.sol";
import {PublicSmartBond} from "test/testContracts/public/PublicSmartBond.sol";
import {PublicSmartBondRegistry} from "test/testContracts/public/PublicSmartBondRegistry.sol";
import {PublicSmartBondFactory} from "test/testContracts/public/PublicSmartBondFactory.sol";

contract BondGasComparison is Test {
    address constant TASK_MANAGER = 0xeA30c4B8b44078Bbf8a6ef5b9f1eC1626C7848D9;

    address issuer = address(0xA11CE);
    address investor1 = address(0xB0B1);

    // Config
    uint64 capPlain = 1_000_000_000;
    uint64 pricePlain = 1_000; // Par
    uint256 couponPerYear = 5e4; // 5% p.a. (6-decimal Rate)
    string isin = "US0000000001";

    function _mockTaskManager() internal {
        MockTaskManager mock = new MockTaskManager();
        vm.etch(TASK_MANAGER, address(mock).code);
    }

    function _computeInterest(uint256 soldNotional, uint256 issueDate, uint256 maturityTs) internal view returns (uint256) {
        uint256 duration = maturityTs - issueDate;
        return (soldNotional * couponPerYear * duration) / (365 days * 1e18);
    }

    function testGas_FHE_FullLifecycle_SingleInvestor() public {
        vm.pauseGasMetering();

        _mockTaskManager();

        // Initialize FHE precompile in test env
        FHE.asEuint64(0);

        uint64 issueDate = uint64(block.timestamp);
        uint64 maturityTs = uint64(block.timestamp + 365 days);

        vm.startPrank(issuer);
        MockLURC lurc = new MockLURC("Mock LURC", "LURC", issuer);

        SmartBondRegistry registry = new SmartBondRegistry(issuer);
        SmartBondFactory factory = new SmartBondFactory(issuer, address(registry));
        registry.setFactory(address(factory));

        // Pre-fund investor and issuer
        lurc.mint(investor1, 200_000_000);
        lurc.mint(issuer, 1_000_000_000);
        vm.stopPrank();

        vm.resumeGasMetering();

        // Step 1: Create smart bond (deploy bond + asset via factory)
        vm.startPrank(issuer);
        euint64 capEnc = FHE.asEuint64(capPlain);
        euint64 matEnc = FHE.asEuint64(maturityTs);
        euint64 priceEnc = FHE.asEuint64(pricePlain);
        euint64 couponEnc = FHE.asEuint64(uint64(couponPerYear));
        FHE.allow(matEnc, address(factory));
        FHE.allow(capEnc, address(factory));
        FHE.allow(priceEnc, address(factory));
        FHE.allow(couponEnc, address(factory));

        uint256 gasStart = gasleft();
        (address bondAddr, address assetAddr) = factory.createBondEnc(
            address(lurc),
            capEnc,
            matEnc,
            priceEnc,
            couponEnc,
            isin
        );
        uint256 gasUsed = gasStart - gasleft();
        emit log_named_uint("FHE - Create smart bond", gasUsed);
        vm.stopPrank();

        SmartBond bond = SmartBond(bondAddr);
        BondAssetToken asset = BondAssetToken(assetAddr);

        // Step 2: Whitelist investor
        vm.startPrank(issuer);
        gasStart = gasleft();
        asset.setWhitelist(investor1, true);
        gasUsed = gasStart - gasleft();
        emit log_named_uint("FHE - Whitelist investor", gasUsed);
        vm.stopPrank();

        // Step 3: Buy bond (approve + buy)
        vm.startPrank(investor1);
        gasStart = gasleft();
        lurc.approve(address(bond), 100_000_000);
        bond.buy(100_000_000);
        gasUsed = gasStart - gasleft();
        emit log_named_uint("FHE - Buy bond", gasUsed);
        vm.stopPrank();

        // Step 4: Close issuance
        vm.startPrank(issuer);
        gasStart = gasleft();
        bond.closeIssuance();
        gasUsed = gasStart - gasleft();
        emit log_named_uint("FHE - Close issuance", gasUsed);
        vm.stopPrank();

        uint256 soldNotionalPlain = 100_000_000;
        uint256 interestPlain = _computeInterest(soldNotionalPlain, issueDate, maturityTs);
        uint256 totalPayoutRequiredPlain = soldNotionalPlain + interestPlain;

        // Step 5: Fund interest (approve + fund)
        vm.startPrank(issuer);
        gasStart = gasleft();
        lurc.approve(address(bond), totalPayoutRequiredPlain);
        bond.fundUpfront(totalPayoutRequiredPlain);
        gasUsed = gasStart - gasleft();
        emit log_named_uint("FHE - Fund interest", gasUsed);
        vm.stopPrank();

        // Step 6: Interest payout (request + claim)
        vm.warp(maturityTs + 1);
        euint64 amtEnc = FHE.asEuint64(100_000_000);
        FHE.allow(amtEnc, address(bond));

        vm.startPrank(investor1);
        gasStart = gasleft();
        bond.requestRedeemEnc(amtEnc);
        gasUsed = gasStart - gasleft();
        emit log_named_uint("FHE - Interest payout (Request)", gasUsed);
        vm.stopPrank();

        euint64 payoutHandle = bond.pendingPayoutHandle(investor1);
        vm.pauseGasMetering();
        vm.mockCall(
            TASK_MANAGER,
            abi.encodeWithSelector(ITaskManager.getDecryptResultSafe.selector, euint64.unwrap(payoutHandle)),
            abi.encode(totalPayoutRequiredPlain, true)
        );
        vm.resumeGasMetering();

        vm.startPrank(investor1);
        gasStart = gasleft();
        bond.claimRedeem();
        gasUsed = gasStart - gasleft();
        emit log_named_uint("FHE - Interest payout (Claim)", gasUsed);
        vm.stopPrank();
    }

    function testGas_PUBLIC_FullLifecycle_SingleInvestor() public {
        vm.pauseGasMetering();

        uint64 issueDate = uint64(block.timestamp);
        uint64 maturityTs = uint64(block.timestamp + 365 days);

        vm.startPrank(issuer);
        MockLURC lurc = new MockLURC("Mock LURC", "LURC", issuer);

        PublicSmartBondRegistry registry = new PublicSmartBondRegistry(issuer);
        PublicSmartBondFactory factory = new PublicSmartBondFactory(issuer, address(registry));
        registry.setFactory(address(factory));

        // Pre-fund investor and issuer
        lurc.mint(investor1, 200_000_000);
        lurc.mint(issuer, 1_000_000_000);
        vm.stopPrank();

        vm.resumeGasMetering();

        // Step 1: Create smart bond (deploy bond + asset via factory)
        vm.startPrank(issuer);
        uint256 gasStart = gasleft();
        (address bondAddr, address assetAddr) = factory.createBond(
            address(lurc),
            capPlain,
            maturityTs,
            pricePlain,
            uint64(couponPerYear),
            isin
        );
        uint256 gasUsed = gasStart - gasleft();
        emit log_named_uint("PUBLIC - Create smart bond", gasUsed);
        vm.stopPrank();

        PublicSmartBond bond = PublicSmartBond(bondAddr);
        PublicBondAssetToken asset = PublicBondAssetToken(assetAddr);

        // Step 2: Whitelist investor
        vm.startPrank(issuer);
        gasStart = gasleft();
        asset.setWhitelist(investor1, true);
        gasUsed = gasStart - gasleft();
        emit log_named_uint("PUBLIC - Whitelist investor", gasUsed);
        vm.stopPrank();

        // Step 3: Buy bond (approve + buy)
        vm.startPrank(investor1);
        gasStart = gasleft();
        lurc.approve(address(bond), 100_000_000);
        bond.buy(100_000_000);
        gasUsed = gasStart - gasleft();
        emit log_named_uint("PUBLIC - Buy bond", gasUsed);
        vm.stopPrank();

        // Step 4: Close issuance
        vm.startPrank(issuer);
        gasStart = gasleft();
        bond.closeIssuance();
        gasUsed = gasStart - gasleft();
        emit log_named_uint("PUBLIC - Close issuance", gasUsed);
        vm.stopPrank();

        uint256 soldNotionalPlain = 100_000_000;
        uint256 interestPlain = _computeInterest(soldNotionalPlain, issueDate, maturityTs);
        uint256 totalPayoutRequiredPlain = soldNotionalPlain + interestPlain;

        // Step 5: Fund interest (approve + fund)
        vm.startPrank(issuer);
        gasStart = gasleft();
        lurc.approve(address(bond), totalPayoutRequiredPlain);
        bond.fundUpfront(totalPayoutRequiredPlain);
        gasUsed = gasStart - gasleft();
        emit log_named_uint("PUBLIC - Fund interest", gasUsed);
        vm.stopPrank();

        // Step 6: Interest payout (request + claim)
        vm.warp(maturityTs + 1);

        vm.startPrank(investor1);
        gasStart = gasleft();
        bond.requestRedeem(uint64(100_000_000));
        gasUsed = gasStart - gasleft();
        emit log_named_uint("PUBLIC - Interest payout (Request)", gasUsed);
        vm.stopPrank();

        vm.startPrank(investor1);
        gasStart = gasleft();
        bond.claimRedeem();
        gasUsed = gasStart - gasleft();
        emit log_named_uint("PUBLIC - Interest payout (Claim)", gasUsed);
        vm.stopPrank();
    }
}

contract MockTaskManager is ITaskManager {
    uint256 private _counter;

    function createTask(
        uint8,
        FunctionId,
        uint256[] memory,
        uint256[] memory
    ) external override returns (uint256) {
        unchecked { _counter++; }
        return _counter;
    }

    function createRandomTask(uint8, uint256, int32) external override returns (uint256) {
        unchecked { _counter++; }
        return _counter;
    }

    function verifyInput(EncryptedInput memory, address) external override returns (uint256) {
        unchecked { _counter++; }
        return _counter;
    }

    function createDecryptTask(uint256, address) external override {}

    function getDecryptResult(uint256) external pure override returns (uint256) {
        return 0;
    }

    function getDecryptResultSafe(uint256) external pure override returns (uint256, bool) {
        return (0, false);
    }

    function allow(uint256, address) external override {}

    function allowGlobal(uint256) external override {}

    function allowTransient(uint256, address) external override {}

    function isAllowed(uint256, address) external pure override returns (bool) {
        return true;
    }
}