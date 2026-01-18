// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MockLURC is ERC20, AccessControl {
    bytes32 public constant ISSUER_ADMIN_ROLE = keccak256("ISSUER_ADMIN_ROLE");

    constructor(string memory name_, string memory symbol_, address issuerAdmin) ERC20(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, issuerAdmin);
        _grantRole(ISSUER_ADMIN_ROLE, issuerAdmin);
    }

    function mint(address to, uint256 amount) external onlyRole(ISSUER_ADMIN_ROLE) {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRole(ISSUER_ADMIN_ROLE) {
        _burn(from, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
