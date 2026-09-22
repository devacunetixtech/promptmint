const hre = require('hardhat')

async function main() {
  const PromptMint = await hre.ethers.getContractFactory('PromptMint')
  const promptMint = await PromptMint.deploy()
  await promptMint.waitForDeployment()
  const receipt = await promptMint.deploymentTransaction().wait()
  console.log(`PromptMint deployed to ${await promptMint.getAddress()}`)
  console.log(`Deployment transaction: ${receipt.hash}`)
  console.log(`Gas used: ${receipt.gasUsed}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
