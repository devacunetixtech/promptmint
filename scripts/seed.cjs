const hre = require('hardhat')

const listings = [
  ['ipfs://promptmint/strategic-operator.json', '0.08'],
  ['ipfs://promptmint/socratic-tutor.json', '0.04'],
  ['ipfs://promptmint/research-room.json', '0.06'],
  ['ipfs://promptmint/brand-voice-kit.json', '0.03'],
]

async function main() {
  const address = process.env.VITE_PROMPTMINT_CONTRACT_ADDRESS
  if (!address) throw new Error('VITE_PROMPTMINT_CONTRACT_ADDRESS is required')
  const promptMint = await hre.ethers.getContractAt('PromptMint', address)
  const currentCount = Number(await promptMint.promptCount())
  if (currentCount >= listings.length) {
    console.log(`Prompt listings already seeded (${currentCount})`)
    return
  }
  for (const [metadataURI, price] of listings.slice(currentCount)) {
    const tx = await promptMint.registerPrompt(metadataURI, hre.ethers.parseEther(price))
    const receipt = await tx.wait()
    console.log(`Registered ${metadataURI} at ${price} BOT: ${receipt.hash}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
