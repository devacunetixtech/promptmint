require('@nomicfoundation/hardhat-toolbox')

const deployerKey = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY
const accounts = deployerKey ? [deployerKey] : []

module.exports = {
  solidity: {
    version: '0.8.24',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  paths: {
    sources: './src-contracts',
    tests: './test-hardhat',
  },
  networks: {
    hardhat: {},
    botchainTestnet: {
      url: process.env.BOTCHAIN_TESTNET_RPC || 'https://rpc.bohr.life',
      chainId: 968,
      accounts,
    },
    botchainMainnet: {
      url: process.env.BOTCHAIN_MAINNET_RPC || 'https://rpc.botchain.ai',
      chainId: 677,
      accounts,
    },
  },
  etherscan: {
    apiKey: {
      botchainTestnet: process.env.BLOCKSCOUT_API_KEY || '',
    },
    customChains: [
      {
        network: 'botchainTestnet',
        chainId: 968,
        urls: {
          apiURL: 'https://scan.bohr.life/api',
          browserURL: 'https://scan.bohr.life',
        },
      },
    ],
  },
}