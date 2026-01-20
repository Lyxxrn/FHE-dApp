import { defineConfig } from '@wagmi/cli'
import { foundry, foundryDefaultExcludes } from '@wagmi/cli/plugins'

export default defineConfig({
  out: 'src/generated.ts',
  plugins: [
    foundry({
      project: './onchain',
      artifacts: 'out',
      // Generate ABIs only for used contracts.
      include: [
        'SmartBond.json',
        'BondAssetToken.json',
        'SmartBondFactory.json',
        'SmartBondRegistry.json',
        'MockLURC.json',
      ],
      exclude: [...foundryDefaultExcludes, 'testContracts/**'],
    }),
  ],
})