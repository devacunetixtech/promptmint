const { expect } = require('chai')

describe('PromptMint', function () {
  async function deployFixture() {
    const [creator, buyer] = await ethers.getSigners()
    const PromptMint = await ethers.getContractFactory('PromptMint')
    const promptMint = await PromptMint.deploy()
    return { promptMint, creator, buyer }
  }

  it('registers a prompt with creator ownership and price', async function () {
    const { promptMint, creator } = await deployFixture()
    await promptMint.connect(creator).registerPrompt('ipfs://metadata', ethers.parseEther('0.08'))
    const prompt = await promptMint.prompts(1)
    expect(prompt.creator).to.equal(creator.address)
    expect(prompt.metadataURI).to.equal('ipfs://metadata')
    expect(prompt.price).to.equal(ethers.parseEther('0.08'))
    expect(prompt.active).to.equal(true)
  })

  it('pays the creator and grants buyer access', async function () {
    const { promptMint, creator, buyer } = await deployFixture()
    await promptMint.connect(creator).registerPrompt('ipfs://metadata', ethers.parseEther('0.08'))
    await expect(promptMint.connect(buyer).purchasePrompt(1, { value: ethers.parseEther('0.08') }))
      .to.emit(promptMint, 'PromptPurchased').withArgs(1, buyer.address, ethers.parseEther('0.08'))
    expect(await promptMint.hasAccess(1, buyer.address)).to.equal(true)
  })

  it('pays creator tips', async function () {
    const { promptMint, creator, buyer } = await deployFixture()
    await promptMint.connect(creator).registerPrompt('ipfs://metadata', ethers.parseEther('0.08'))
    await expect(promptMint.connect(buyer).tipCreator(1, { value: ethers.parseEther('0.02') }))
      .to.emit(promptMint, 'CreatorTipped').withArgs(1, buyer.address, ethers.parseEther('0.02'))
  })

  it('rejects purchases with an incorrect price', async function () {
    const { promptMint, creator, buyer } = await deployFixture()
    await promptMint.connect(creator).registerPrompt('ipfs://metadata', ethers.parseEther('0.08'))
    await expect(promptMint.connect(buyer).purchasePrompt(1, { value: ethers.parseEther('0.01') }))
      .to.be.revertedWith('incorrect price')
  })
})