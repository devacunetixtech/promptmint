# PromptMint

PromptMint is an on-chain marketplace for reusable AI prompts. Creators publish prompt metadata and hashes off-chain, while the contract records ownership, pricing, purchases, payouts, and tips on BOT Chain.

## Stack

- React, TypeScript, Vite, ethers.js
- Solidity 0.8.24
- Hardhat 2 with Chai and the Hardhat toolbox
- BOT Chain testnet: chain ID `968`, RPC `https://rpc.bohr.life`

## Run the app

```bash
npm install
cp .env.example .env
npm run dev
```

The UI works in demo mode without a deployed address. Set `VITE_PROMPTMINT_CONTRACT_ADDRESS` in `.env` to enable real purchases from a compatible wallet.

## Contract checks

```bash
npm run hardhat:compile
npm run hardhat:test
```

Tests cover prompt registration, creator ownership, purchases, payout events, tipping, and invalid purchase prices.

## Deploy to BOT Chain testnet

1. Put a funded deployer key in `.env` as `DEPLOYER_PRIVATE_KEY`.
2. Run:

```bash
npm run deploy:testnet
```

3. Copy the printed address into `VITE_PROMPTMINT_CONTRACT_ADDRESS`.
4. Restart the Vite server.

Current BOT Chain testnet deployment: `0xBE2fa5CF5EcBD3F64C39F43B148EDecd4036536b`.
Verified source: https://scan.bohr.life/address/0xBE2fa5CF5EcBD3F64C39F43B148EDecd4036536b#code

To register the four included listings on a fresh deployment, run `npm run seed:testnet`. The script is idempotent and only uses metadata references; private prompt text stays off-chain.

For verification, use the BOT Chain explorer at `https://scan.bohr.life`. Mainnet configuration is available as the `botchainMainnet` Hardhat network with chain ID `677`.

## Data model

Only `metadataURI`, price, creator, and access state are recorded on-chain. Keep private prompt text off-chain; publish a public preview and a content hash or encrypted delivery reference in the metadata.