//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BondAssetToken
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const bondAssetTokenAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'capEncrypted', internalType: 'euint64', type: 'uint256' },
      { name: 'issuerAdmin_', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'ISSUER_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'balanceOfIsIndicator',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'bond',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'bondSet',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'cap',
    outputs: [{ name: '', internalType: 'euint64', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'confidentialBalanceOf',
    outputs: [{ name: '', internalType: 'euint64', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'euint64', type: 'uint256' },
    ],
    name: 'confidentialBurnFrom',
    outputs: [{ name: 'burned', internalType: 'euint64', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'requested', internalType: 'euint64', type: 'uint256' },
    ],
    name: 'confidentialMintTo',
    outputs: [{ name: 'minted', internalType: 'euint64', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'confidentialTotalSupply',
    outputs: [{ name: '', internalType: 'euint64', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      {
        name: 'inValue',
        internalType: 'struct InEuint64',
        type: 'tuple',
        components: [
          { name: 'ctHash', internalType: 'uint256', type: 'uint256' },
          { name: 'securityZone', internalType: 'uint8', type: 'uint8' },
          { name: 'utype', internalType: 'uint8', type: 'uint8' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'confidentialTransfer',
    outputs: [
      { name: 'transferred', internalType: 'euint64', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'euint64', type: 'uint256' },
    ],
    name: 'confidentialTransfer',
    outputs: [
      { name: 'transferred', internalType: 'euint64', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'euint64', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'confidentialTransferAndCall',
    outputs: [
      { name: 'transferred', internalType: 'euint64', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      {
        name: 'inValue',
        internalType: 'struct InEuint64',
        type: 'tuple',
        components: [
          { name: 'ctHash', internalType: 'uint256', type: 'uint256' },
          { name: 'securityZone', internalType: 'uint8', type: 'uint8' },
          { name: 'utype', internalType: 'uint8', type: 'uint8' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'confidentialTransferAndCall',
    outputs: [
      { name: 'transferred', internalType: 'euint64', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      {
        name: 'inValue',
        internalType: 'struct InEuint64',
        type: 'tuple',
        components: [
          { name: 'ctHash', internalType: 'uint256', type: 'uint256' },
          { name: 'securityZone', internalType: 'uint8', type: 'uint8' },
          { name: 'utype', internalType: 'uint8', type: 'uint8' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'confidentialTransferFrom',
    outputs: [
      { name: 'transferred', internalType: 'euint64', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'euint64', type: 'uint256' },
    ],
    name: 'confidentialTransferFrom',
    outputs: [
      { name: 'transferred', internalType: 'euint64', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'euint64', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'confidentialTransferFromAndCall',
    outputs: [
      { name: 'transferred', internalType: 'euint64', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      {
        name: 'inValue',
        internalType: 'struct InEuint64',
        type: 'tuple',
        components: [
          { name: 'ctHash', internalType: 'uint256', type: 'uint256' },
          { name: 'securityZone', internalType: 'uint8', type: 'uint8' },
          { name: 'utype', internalType: 'uint8', type: 'uint8' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'confidentialTransferFromAndCall',
    outputs: [
      { name: 'transferred', internalType: 'euint64', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'role', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'indicatorTick',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'isFherc20',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'holder', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'isOperator',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'issuerAdmin',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'callerConfirmation', internalType: 'address', type: 'address' },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'resetIndicatedBalance',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'bond_', internalType: 'address', type: 'address' }],
    name: 'setBond',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'until', internalType: 'uint48', type: 'uint48' },
    ],
    name: 'setOperator',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'holder', internalType: 'address', type: 'address' },
      { name: 'status', internalType: 'bool', type: 'bool' },
    ],
    name: 'setWhitelist',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'whitelist',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'holder',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'viewer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'BalanceAccessGranted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'bond', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'BondSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'value_hash',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ConfidentialTransfer',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'holder',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'until', internalType: 'uint48', type: 'uint48', indexed: false },
    ],
    name: 'OperatorSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'previousAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'newAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'RoleAdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleGranted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleRevoked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Transfer',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'holder',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'status', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'WhitelistUpdated',
  },
  { type: 'error', inputs: [], name: 'AccessControlBadConfirmation' },
  {
    type: 'error',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'neededRole', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'AccessControlUnauthorizedAccount',
  },
  {
    type: 'error',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'allowance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientAllowance',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidApprover',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSender',
  },
  {
    type: 'error',
    inputs: [{ name: 'spender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSpender',
  },
  {
    type: 'error',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'permitOwner', internalType: 'address', type: 'address' },
    ],
    name: 'FHERC20ConfidentialTransferFromOwnerMismatch',
  },
  {
    type: 'error',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'permitSpender', internalType: 'address', type: 'address' },
    ],
    name: 'FHERC20ConfidentialTransferFromSpenderMismatch',
  },
  {
    type: 'error',
    inputs: [
      { name: 'inValueHash', internalType: 'uint256', type: 'uint256' },
      { name: 'permitValueHash', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'FHERC20ConfidentialTransferFromValueHashMismatch',
  },
  { type: 'error', inputs: [], name: 'FHERC20IncompatibleFunction' },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'FHERC20InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'FHERC20UnauthorizedSpender',
  },
  {
    type: 'error',
    inputs: [
      { name: 'value', internalType: 'euint64', type: 'uint256' },
      { name: 'owner', internalType: 'address', type: 'address' },
    ],
    name: 'FHERC20UnauthorizedUseOfEncryptedAmount',
  },
  {
    type: 'error',
    inputs: [
      { name: 'got', internalType: 'uint8', type: 'uint8' },
      { name: 'expected', internalType: 'uint8', type: 'uint8' },
    ],
    name: 'InvalidEncryptedInput',
  },
  { type: 'error', inputs: [], name: 'NotWhitelisted' },
  {
    type: 'error',
    inputs: [{ name: 'value', internalType: 'int32', type: 'int32' }],
    name: 'SecurityZoneOutOfBounds',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MockLURC
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const mockLurcAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'name_', internalType: 'string', type: 'string' },
      { name: 'symbol_', internalType: 'string', type: 'string' },
      { name: 'issuerAdmin', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'ISSUER_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'role', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'callerConfirmation', internalType: 'address', type: 'address' },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'previousAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'newAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'RoleAdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleGranted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleRevoked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Transfer',
  },
  { type: 'error', inputs: [], name: 'AccessControlBadConfirmation' },
  {
    type: 'error',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'neededRole', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'AccessControlUnauthorizedAccount',
  },
  {
    type: 'error',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'allowance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientAllowance',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidApprover',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSender',
  },
  {
    type: 'error',
    inputs: [{ name: 'spender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSpender',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SmartBond
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const smartBondAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'paymentToken_', internalType: 'address', type: 'address' },
      { name: 'assetToken_', internalType: 'address', type: 'address' },
      { name: 'maturityDate_', internalType: 'euint64', type: 'uint256' },
      { name: 'priceAtIssue_', internalType: 'euint64', type: 'uint256' },
      { name: 'couponRatePerYear_', internalType: 'euint64', type: 'uint256' },
      { name: 'issuerAdmin', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DUST_THRESHOLD',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'SUBSCRIPTION_PERIOD',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'assetToken',
    outputs: [
      { name: '', internalType: 'contract BondAssetToken', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'paymentAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'buy',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'claimRedeem',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'closeIssuance',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'closed',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'couponRatePerYear',
    outputs: [{ name: '', internalType: 'euint64', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'issuerAdmin', internalType: 'address', type: 'address' }],
    name: 'finalize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    name: 'fundUpfront',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'funded',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'interestAtMaturity',
    outputs: [{ name: '', internalType: 'euint64', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'interestPerToken',
    outputs: [{ name: '', internalType: 'euint64', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'issuanceClosed',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'issueDate',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'issuerAdminAddr',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'maturityDate',
    outputs: [{ name: '', internalType: 'euint64', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'paymentToken',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'holder', internalType: 'address', type: 'address' }],
    name: 'payoutDecryptStatus',
    outputs: [
      { name: 'ready', internalType: 'bool', type: 'bool' },
      { name: 'payoutPlain', internalType: 'uint64', type: 'uint64' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'payoutEscrowBalance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'holder', internalType: 'address', type: 'address' }],
    name: 'pendingPayoutHandle',
    outputs: [{ name: '', internalType: 'euint64', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'priceAtIssue',
    outputs: [{ name: '', internalType: 'euint64', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'tokenAmountEnc',
        internalType: 'struct InEuint64',
        type: 'tuple',
        components: [
          { name: 'ctHash', internalType: 'uint256', type: 'uint256' },
          { name: 'securityZone', internalType: 'uint8', type: 'uint8' },
          { name: 'utype', internalType: 'uint8', type: 'uint8' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'redeem',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenAmount', internalType: 'euint64', type: 'uint256' }],
    name: 'requestRedeemEnc',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'soldNotional',
    outputs: [{ name: '', internalType: 'euint64', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'subscriptionEndDate',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalPayoutRequired',
    outputs: [{ name: '', internalType: 'euint64', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'issueDate',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
      {
        name: 'subscriptionEndDate',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
      {
        name: 'maturityDate',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'priceAtIssue',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'BondActivated',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'BondClosed' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'interestAtMaturity',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'interestPerToken',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'totalPayoutRequired',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'InterestSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'soldNotional',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'IssuanceClosed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'holder',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'payoutTotal',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'PayoutDecryptionRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'totalPayoutRequired',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'soldNotional',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'PayoutFunded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'buyer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'paymentAmount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'tokenAmount',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'price',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Purchased',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'holder',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenAmount',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'payoutPrincipal',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'payoutInterest',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'payoutTotal',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'RedeemRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'holder',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenAmount',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'payoutPrincipal',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'payoutInterest',
        internalType: 'euint64',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Redeemed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'holder',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'payoutTotalPlain',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'RedeemedPayout',
  },
  {
    type: 'error',
    inputs: [
      { name: 'got', internalType: 'uint8', type: 'uint8' },
      { name: 'expected', internalType: 'uint8', type: 'uint8' },
    ],
    name: 'InvalidEncryptedInput',
  },
  { type: 'error', inputs: [], name: 'NotIssuerAdmin' },
  { type: 'error', inputs: [], name: 'ReentrancyGuardReentrantCall' },
  {
    type: 'error',
    inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
    name: 'SafeERC20FailedOperation',
  },
  {
    type: 'error',
    inputs: [{ name: 'value', internalType: 'int32', type: 'int32' }],
    name: 'SecurityZoneOutOfBounds',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SmartBondFactory
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const smartBondFactoryAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'admin', internalType: 'address', type: 'address' },
      { name: 'registry_', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'paymentToken', internalType: 'address', type: 'address' },
      {
        name: 'cap_',
        internalType: 'struct InEuint64',
        type: 'tuple',
        components: [
          { name: 'ctHash', internalType: 'uint256', type: 'uint256' },
          { name: 'securityZone', internalType: 'uint8', type: 'uint8' },
          { name: 'utype', internalType: 'uint8', type: 'uint8' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      {
        name: 'maturityDate_',
        internalType: 'struct InEuint64',
        type: 'tuple',
        components: [
          { name: 'ctHash', internalType: 'uint256', type: 'uint256' },
          { name: 'securityZone', internalType: 'uint8', type: 'uint8' },
          { name: 'utype', internalType: 'uint8', type: 'uint8' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      {
        name: 'priceAtIssue_',
        internalType: 'struct InEuint64',
        type: 'tuple',
        components: [
          { name: 'ctHash', internalType: 'uint256', type: 'uint256' },
          { name: 'securityZone', internalType: 'uint8', type: 'uint8' },
          { name: 'utype', internalType: 'uint8', type: 'uint8' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      {
        name: 'couponRatePerYear_',
        internalType: 'struct InEuint64',
        type: 'tuple',
        components: [
          { name: 'ctHash', internalType: 'uint256', type: 'uint256' },
          { name: 'securityZone', internalType: 'uint8', type: 'uint8' },
          { name: 'utype', internalType: 'uint8', type: 'uint8' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'isin', internalType: 'string', type: 'string' },
    ],
    name: 'createBond',
    outputs: [
      { name: 'bondAddr', internalType: 'address', type: 'address' },
      { name: 'assetAddr', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'issuerAdminAddr',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'registry',
    outputs: [
      { name: '', internalType: 'contract SmartBondRegistry', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'bond', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'assetToken',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'issuer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'BondCreated',
  },
  {
    type: 'error',
    inputs: [
      { name: 'got', internalType: 'uint8', type: 'uint8' },
      { name: 'expected', internalType: 'uint8', type: 'uint8' },
    ],
    name: 'InvalidEncryptedInput',
  },
  { type: 'error', inputs: [], name: 'NotIssuerAdmin' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SmartBondRegistry
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const smartBondRegistryAbi = [
  {
    type: 'constructor',
    inputs: [{ name: 'admin', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'FACTORY_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getAllBonds',
    outputs: [
      {
        name: '',
        internalType: 'struct SmartBondRegistry.BondInfo[]',
        type: 'tuple[]',
        components: [
          { name: 'bond', internalType: 'address', type: 'address' },
          { name: 'issuer', internalType: 'address', type: 'address' },
          { name: 'issueDate', internalType: 'uint64', type: 'uint64' },
          { name: 'maturityDate', internalType: 'euint64', type: 'uint256' },
          {
            name: 'subscriptionEndDate',
            internalType: 'uint64',
            type: 'uint64',
          },
          { name: 'notionalCap', internalType: 'euint64', type: 'uint256' },
          { name: 'currencyToken', internalType: 'address', type: 'address' },
          { name: 'isin', internalType: 'string', type: 'string' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'role', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'indexOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'bond', internalType: 'address', type: 'address' },
      { name: 'issuer', internalType: 'address', type: 'address' },
      { name: 'issueDate', internalType: 'uint64', type: 'uint64' },
      { name: 'maturityDate', internalType: 'euint64', type: 'uint256' },
      { name: 'subscriptionEndDate', internalType: 'uint64', type: 'uint64' },
      { name: 'notionalCap', internalType: 'euint64', type: 'uint256' },
      { name: 'currencyToken', internalType: 'address', type: 'address' },
      { name: 'isin', internalType: 'string', type: 'string' },
    ],
    name: 'registerBond',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'callerConfirmation', internalType: 'address', type: 'address' },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'factory', internalType: 'address', type: 'address' }],
    name: 'setFactory',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'bond', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'issuer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'isin', internalType: 'string', type: 'string', indexed: false },
    ],
    name: 'BondRegistered',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'previousAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'newAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'RoleAdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleGranted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleRevoked',
  },
  { type: 'error', inputs: [], name: 'AccessControlBadConfirmation' },
  {
    type: 'error',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'neededRole', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'AccessControlUnauthorizedAccount',
  },
] as const
