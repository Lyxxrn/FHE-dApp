// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice Registry for issued bonds with plaintext parameters.
contract PublicSmartBondRegistry is AccessControl {
    bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");

    struct BondInfo {
        address bond;
        address issuer;
        uint64 issueDate;
        uint64 maturityDate;
        uint64 subscriptionEndDate;
        uint64 notionalCap;
        address currencyToken;
        string isin;
    }

    BondInfo[] private bonds;
    mapping(address => uint256) public indexOf; // 1-based

    event BondRegistered(address indexed bond, address indexed issuer, string isin);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function setFactory(address factory) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(FACTORY_ROLE, factory);
    }

    function registerBond(
        address bond,
        address issuer,
        uint64 issueDate,
        uint64 maturityDate,
        uint64 subscriptionEndDate,
        uint64 notionalCap,
        address currencyToken,
        string calldata isin
    ) external onlyRole(FACTORY_ROLE) {
        require(indexOf[bond] == 0, "Already registered");

        bonds.push(
            BondInfo({
                bond: bond,
                issuer: issuer,
                issueDate: issueDate,
                maturityDate: maturityDate,
                subscriptionEndDate: subscriptionEndDate,
                notionalCap: notionalCap,
                currencyToken: currencyToken,
                isin: isin
            })
        );
        indexOf[bond] = bonds.length;

        emit BondRegistered(bond, issuer, isin);
    }

    function getAllBonds() external view returns (BondInfo[] memory) {
        return bonds;
    }
}
