# PromptMint

PromptMint is an on-chain marketplace for reusable AI prompts. Creators publish prompt metadata and hashes off-chain, while the contract records ownership, pricing, purchases, payouts, and tips on BOT Chain.

## Stack

- React, TypeScript, Vite, ethers.js
- Solidity 0.8.24
- Hardhat 2 with Chai and the Hardhat toolbox
- BOT Chain mainnet: chain ID `677`, RPC `https://rpc.botchain.ai`

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

## BOT Chain mainnet deployment

1. Put a funded deployer key in `.env` as `DEPLOYER_PRIVATE_KEY`.
2. Run:

```bash
npm run deploy:mainnet
```

3. Copy the printed address into `VITE_PROMPTMINT_CONTRACT_ADDRESS`.
4. Restart the Vite server.

Current BOT Chain mainnet deployment: `0x03f928c192205911a25FDf137cBdf251f0f74765`.
Verified source: https://scan.botchain.ai/address/0x03f928c192205911a25FDf137cBdf251f0f74765#code

To register the four included listings on a fresh deployment, run `npm run seed:mainnet`. The script is idempotent and only uses metadata references; private prompt text stays off-chain.

Verify a deployment with `npm run verify:mainnet -- <contract-address>`. The mainnet explorer is `https://scan.botchain.ai`.

The five generated interaction wallets are kept in the git-ignored `.interaction-wallets.json` with file mode `0600`. Run `npm run interact:mainnet` to fund each wallet only for gas and send a 1-wei tip interaction.

## Data model

Only `metadataURI`, price, creator, and access state are recorded on-chain. Keep private prompt text off-chain; publish a public preview and a content hash or encrypted delivery reference in the metadata.
