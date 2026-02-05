// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";

import {MockLURC} from "../src/MockLURC.sol";
import {BondAssetToken} from "../src/BondAssetToken.sol";
import {SmartBond} from "../src/SmartBond.sol";
import {SmartBondRegistry} from "../src/SmartBondRegistry.sol";
import {SmartBondFactory} from "../src/SmartBondFactory.sol";

contract BondContracts is Script {
    // Deployed instances
    MockLURC public lurc;
    SmartBondRegistry public registry;
    SmartBondFactory public factory;
    SmartBond public bond;
    BondAssetToken public assetToken;

    function run() public {

        vm.startBroadcast();

        // // 1) MockLURC
        // lurc = new MockLURC("Mock EuroTest", "LURC", msg.sender);

        // 2) registry + factory; grant FACTORY_ROLE to factory
        registry = new SmartBondRegistry(address(0xF8D4339525cA9BD071ABfe063E90C203FEC6e350));
        factory = new SmartBondFactory(address(0xF8D4339525cA9BD071ABfe063E90C203FEC6e350), address(registry));
        registry.setFactory(address(factory));
        // bonds + assets can be deployed via the factory 'createBond' function

        vm.stopBroadcast();
    }
}
