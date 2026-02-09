## Public test contracts

This folder contains the **public (non‑FHE)** variants of the bond contracts used for gas comparison.
They mirror the FHE API and logic but operate on plain `uint` values to provide a baseline.

### Contents

- `PublicBondAssetToken.sol` — plaintext bond asset token (whitelist + cap)
- `PublicSmartBond.sol` — plaintext bond lifecycle
- `PublicSmartBondFactory.sol` — factory for public bond + asset
- `PublicSmartBondRegistry.sol` — registry for public bonds

### Gas comparison test

The gas comparison is implemented in:

- [test/BondGasComparison.t.sol](../../../BondGasComparison.t.sol)

It measures the following lifecycle steps for **FHE vs. Public**:

1. Create smart bond (deploy bond + asset via factory)
2. Whitelist investor
3. Buy bond
4. Close issuance
5. Fund interest
6. Interest payout (Request + Claim)

### Run

```shell
forge test --match-test testGas_ --gas-report
```

The test logs per‑step gas usage with clear `FHE - ...` and `PUBLIC - ...` labels.
