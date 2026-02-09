// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// Reverts used by this contract
error NotWhitelisted();

/// @notice Public (non-FHE) bond asset token with whitelist and capped supply.
/// @dev Mirrors the FHE token API but uses plaintext uints.
contract PublicBondAssetToken is ERC20, AccessControl {
    bytes32 public constant ISSUER_ADMIN_ROLE = keccak256("ISSUER_ADMIN_ROLE");

    mapping(address => bool) public whitelist;
    address public bond;
    address public issuerAdmin;
    bool public bondSet;

    /// @notice Plaintext cap (upper bound for total supply) in 6-decimal units.
    uint64 public cap;

    event BondSet(address indexed bond);
    event WhitelistUpdated(address indexed holder, bool status);

    /// @notice Construct the public bond asset token.
    /// @param capPlain Plaintext cap value.
    constructor(uint64 capPlain, address issuerAdmin_)
        ERC20("Bond Token", "BOND")
    {
        cap = capPlain;
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

    /// @notice Update whitelist status for minting.
    function setWhitelist(address holder, bool status) external onlyRole(ISSUER_ADMIN_ROLE) {
        whitelist[holder] = status;
        emit WhitelistUpdated(holder, status);
    }

    /// @notice Mint with cap enforcement.
    /// @dev remaining = max(0, cap - totalSupply); minted = min(requested, remaining).
    function confidentialMintTo(address to, uint64 requested)
        external
        onlyBond
        returns (uint64 minted)
    {
        if (!whitelist[to]) revert NotWhitelisted();

        uint256 supply = totalSupply();
        uint256 remaining = supply >= cap ? 0 : uint256(cap) - supply;
        uint256 mintAmt = requested > remaining ? remaining : requested;

        if (mintAmt > 0) {
            _mint(to, mintAmt);
        }

        minted = uint64(mintAmt);
    }

    /// @notice Burn from an address.
    function confidentialBurnFrom(address from, uint64 value)
        external
        onlyBond
        returns (uint64 burned)
    {
        if (value > 0) {
            _burn(from, value);
        }
        burned = value;
    }

    /// @notice Plaintext total supply getter.
    function confidentialTotalSupply() public view returns (uint64) {
        return uint64(totalSupply());
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
