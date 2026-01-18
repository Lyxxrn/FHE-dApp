// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.24;

// import {Script} from "forge-std/Script.sol";

// import {MockLURC} from "../src/MockLURC.sol";
// import {BondAssetToken} from "../src/BondAssetToken.sol";
// import {SmartBond} from "../src/SmartBond.sol";
// import {SmartBondRegistry} from "../src/SmartBondRegistry.sol";
// import {SmartBondFactory} from "../src/SmartBondFactory.sol";

// contract BondContracts is Script {
//     // Deployed instances
//     MockLURC public lurc;
//     SmartBondRegistry public registry;
//     SmartBondFactory public factory;
//     SmartBond public bond;
//     BondAssetToken public assetToken;

//     function run() public {
//         // Static config (no env)
//         uint256 cap = 1_000_000 ether;     // total notional cap
//         uint256 price = 1 ether;           // price per token at issue (par)
//         uint64 maturityDate = uint64(block.timestamp + 365 days);

//         vm.startBroadcast();

//         // 1) Deploy payment token (MockLURC) with msg.sender as admin
//         lurc = new MockLURC("Mock LURC", "LURC", msg.sender);

//         // 2) Deploy registry and factory; grant FACTORY_ROLE to factory
//         registry = new SmartBondRegistry(msg.sender);
//         factory = new SmartBondFactory(msg.sender, address(registry));
//         registry.setFactory(address(factory));

//         // 3) Create a bond via the simplified 4-arg factory
//         (address bondAddr, address assetAddr) = factory.createBond(
//             address(lurc),
//             cap,
//             maturityDate,
//             price
//         );

//         bond = SmartBond(bondAddr);
//         assetToken = BondAssetToken(assetAddr);

//         // 4) Whitelist the deployer so you can immediately buy() for testing
//         assetToken.setWhitelist(msg.sender, true);

//         vm.stopBroadcast();
//     }
// }
