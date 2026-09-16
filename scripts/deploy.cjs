const hre = require('hardhat')

async function main() {
  const PromptMint = await hre.ethers.getContractFactory('PromptMint')
  const promptMint = await PromptMint.deploy()
  await promptMint.waitForDeployment()
  console.log(`PromptMint deployed to ${await promptMint.getAddress()}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})