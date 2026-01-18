// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import { FHE, euint64 } from "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract SmartBondRegistry is AccessControl {
    bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");

    struct BondInfo {
        address bond;
        address issuer;
        uint64 issueDate;
        euint64 maturityDate;
        uint64 subscriptionEndDate;
        euint64 notionalCap;
        address currencyToken;
    }

    BondInfo[] private bonds;
    mapping(address => uint256) public indexOf; // 1-based

    event BondRegistered(address indexed bond, address indexed issuer);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function setFactory(address factory) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(FACTORY_ROLE, factory);
    }

    /// @notice Register a newly created bond with confidential parameters.
    /// @dev Grants issuer access; registry retains contract access to stored encrypted values.
    function registerBond(
        address bond,
        address issuer,
        uint64 issueDate,
        euint64 maturityDate,
        uint64 subscriptionEndDate,
        euint64 notionalCap,
        address currencyToken
    ) external onlyRole(FACTORY_ROLE) {
        require(indexOf[bond] == 0, "Already registered");

        // Grant issuer access to confidential fields
        FHE.allow(maturityDate, issuer);
        FHE.allow(notionalCap, issuer);

        // Registry stores encrypted values; grant contract access for future reads
        FHE.allowThis(maturityDate);
        FHE.allowThis(notionalCap);

        bonds.push(
            BondInfo({
                bond: bond,
                issuer: issuer,
                issueDate: issueDate,
                maturityDate: maturityDate,
                subscriptionEndDate: subscriptionEndDate,
                notionalCap: notionalCap,
                currencyToken: currencyToken
            })
        );
        indexOf[bond] = bonds.length;

        emit BondRegistered(bond, issuer);
    }

    /// @notice Return all registered bonds; encrypted fields are returned as handles.
    function getAllBonds() external view returns (BondInfo[] memory) {
        return bonds;
    }
}
