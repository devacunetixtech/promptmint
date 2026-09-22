const fs = require('node:fs')
const path = require('node:path')
const hre = require('hardhat')

const walletFile = path.join(process.cwd(), '.interaction-wallets.json')
const walletCount = 5
const tipAmount = 1n

function saveWallets(data) {
  fs.writeFileSync(walletFile, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 })
  fs.chmodSync(walletFile, 0o600)
}

async function main() {
  const contractAddress = process.env.VITE_PROMPTMINT_CONTRACT_ADDRESS
  if (!contractAddress) throw new Error('VITE_PROMPTMINT_CONTRACT_ADDRESS is required')

  const [deployer] = await hre.ethers.getSigners()
  const provider = hre.ethers.provider
  const network = await provider.getNetwork()
  if (network.chainId !== 677n) throw new Error(`Refusing to run on chain ${network.chainId}; expected BOT Chain mainnet (677)`)

  const promptMint = await hre.ethers.getContractAt('PromptMint', contractAddress)
  const prompt = await promptMint.prompts(1)
  if (!prompt.active) throw new Error('Prompt 1 must be active before wallet interactions')

  let data
  if (fs.existsSync(walletFile)) {
    data = JSON.parse(fs.readFileSync(walletFile, 'utf8'))
    if (data.chainId !== 677 || data.contractAddress.toLowerCase() !== contractAddress.toLowerCase()) {
      throw new Error(`${walletFile} belongs to a different chain or contract`)
    }
  } else {
    data = {
      chainId: 677,
      contractAddress,
      wallets: Array.from({ length: walletCount }, () => {
        const wallet = hre.ethers.Wallet.createRandom()
        return { address: wallet.address, privateKey: wallet.privateKey }
      }),
    }
    saveWallets(data)
  }

  if (process.env.PREPARE_ONLY === 'true') {
    for (const entry of data.wallets) console.log(entry.address)
    console.log(`Wallet secrets saved locally with mode 0600 in ${walletFile}`)
    return
  }

  const feeData = await provider.getFeeData()
  if (!feeData.gasPrice) throw new Error('The RPC did not return a legacy gas price')
  const gasPrice = feeData.gasPrice
  const interactionGasLimit = 60_000n
  const fundingAmount = interactionGasLimit * gasPrice + tipAmount

  for (const entry of data.wallets) {
    if (entry.tipTxHash) {
      console.log(`${entry.address} already interacted: ${entry.tipTxHash}`)
      continue
    }

    const wallet = new hre.ethers.Wallet(entry.privateKey, provider)
    const balance = await provider.getBalance(wallet.address)
    if (balance < fundingAmount) {
      const fundingTx = await deployer.sendTransaction({
        to: wallet.address,
        value: fundingAmount - balance,
        gasPrice,
      })
      const fundingReceipt = await fundingTx.wait()
      entry.fundingTxHash = fundingReceipt.hash
      saveWallets(data)
      console.log(`Funded ${wallet.address}: ${fundingReceipt.hash}`)
    }

    const contract = promptMint.connect(wallet)
    const estimatedGas = await contract.tipCreator.estimateGas(1, { value: tipAmount, gasPrice })
    const tipTx = await contract.tipCreator(1, {
      value: tipAmount,
      gasLimit: estimatedGas,
      gasPrice,
    })
    const tipReceipt = await tipTx.wait()
    entry.tipTxHash = tipReceipt.hash
    entry.gasUsed = tipReceipt.gasUsed.toString()
    saveWallets(data)
    console.log(`Interacted ${wallet.address}: ${tipReceipt.hash} (${tipReceipt.gasUsed} gas)`)
  }

  console.log(`Wallet secrets saved locally with mode 0600 in ${walletFile}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
