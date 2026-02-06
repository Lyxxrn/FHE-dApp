// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/AccessControl.sol";
import { FHE, euint64, ebool } from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import { FHERC20 } from "./FhenixContracts/FHERC20.sol";

// Reverts used by this contract
error TransfersDisabled();
error NotWhitelisted();

/// @notice Confidential, capped, whitelist-gated bond asset built on Fhenix FHERC20.
/// @dev
/// - Balances and total supply are encrypted (managed by FHERC20).
/// - Cap is encrypted; mint is clamped to remaining capacity using FHE.select.
/// - Cross-contract access: provider must FHE.allow(value, address(this)) if passing encrypted handles in.
/// @notice Confidential bond asset token with encrypted balances and capped supply.
/// @dev Built on Fhenix FHERC20; mint/burn requires bond and respects encrypted cap.
contract BondAssetToken is FHERC20, AccessControl {
    bytes32 public constant ISSUER_ADMIN_ROLE = keccak256("ISSUER_ADMIN_ROLE");

    mapping(address => bool) public whitelist;
    address public bond;
    address public issuerAdmin;
    bool public bondSet;

    /// @notice Confidential cap (upper bound for total supply).
    euint64 public cap;

    // Encrypted constants.
    euint64 private ENCRYPTED_ZERO;

    event BondSet(address indexed bond);
    event WhitelistUpdated(address indexed holder, bool status);
    event BalanceAccessGranted(address indexed holder, address indexed viewer);

    /// @notice Construct the confidential bond asset token.
    /// @param capEncrypted Encrypted cap handle (euint64).
    constructor(euint64 capEncrypted, address issuerAdmin_)
        FHERC20("Bond Token", "BOND", 6)
    {
        ENCRYPTED_ZERO = FHE.asEuint64(0);
        FHE.allowThis(ENCRYPTED_ZERO);

        cap = capEncrypted;

        issuerAdmin = issuerAdmin_;

        _grantRole(ISSUER_ADMIN_ROLE, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, issuerAdmin);
        _grantRole(ISSUER_ADMIN_ROLE, issuerAdmin);
    }

    /// @dev Only the bond is allowed to access some functions.
    modifier onlyBond() {
        require(msg.sender == bond, "Only bond");
        _;
    }

    /// @notice Link the bond contract; only set once by issuer admin.
    function setBond(address bond_) external onlyRole(ISSUER_ADMIN_ROLE) {
        require(!bondSet, "Bond already set");
        require(bond_ != address(0), "Bond=0");
        bond = bond_;
        bondSet = true;

        emit BondSet(bond_);
    }

    /// @notice Update whitelist status for confidential minting.
    function setWhitelist(address holder, bool status) external onlyRole(ISSUER_ADMIN_ROLE) {
        whitelist[holder] = status;
        emit WhitelistUpdated(holder, status);
    }

    /// @notice Confidential mint with cap enforcement (single call).
    /// @dev remaining = max(0, cap - totalSupply); minted = min(requested, remaining).
    function confidentialMintTo(address to, euint64 requested)
        external
        onlyBond
        returns (euint64 minted)
    {
        if (!whitelist[to]) revert NotWhitelisted();

        // remaining = max(0, cap - totalSupply)
        ebool full = FHE.gte(_encTotalSupply, cap);
        euint64 remaining = FHE.select(
            full,
            ENCRYPTED_ZERO,
            FHE.sub(cap, _encTotalSupply)
        );

        // minted = min(requested, remaining)
        euint64 mintAmt = FHE.select(
            FHE.gt(requested, remaining),
            remaining,
            requested
        );

        minted = _confidentialMint(to, mintAmt);
    }

    /// @notice Confidential burn from an address.
    function confidentialBurnFrom(address from, euint64 value)
        external
        onlyBond
        returns (euint64 burned)
    {
        burned = _confidentialBurn(from, value);
    }

    /// @notice Encrypted total supply getter (view only).
    function confidentialTotalSupply() public view override returns (euint64) {
        return _encTotalSupply;
    }

    /// @dev After each balance/supply change, ensure issuerAdmin and bond have access.
    function _update(address from, address to, euint64 value)
        internal
        override
        returns (euint64 transferred)
    {
        transferred = super._update(from, to, value);

        // Admin access
        FHE.allow(_encTotalSupply, issuerAdmin);
        if (from != address(0)) { FHE.allow(_encBalances[from], issuerAdmin); }
        if (to   != address(0)) { FHE.allow(_encBalances[to],   issuerAdmin); }
        FHE.allow(transferred, issuerAdmin);

        // Bond access (supply/balances/transferred), if bond is set
        if (bond != address(0)) {
            FHE.allow(_encTotalSupply, bond);
            if (from != address(0)) { FHE.allow(_encBalances[from], bond); }
            if (to   != address(0)) { FHE.allow(_encBalances[to],   bond); }
            FHE.allow(transferred, bond);
        }

        return transferred;
    }
}
