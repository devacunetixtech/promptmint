import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Check, ChevronRight, Heart, Menu, Search, Sparkles, Wallet, X } from 'lucide-react'
import { BrowserProvider, Contract, parseEther } from 'ethers'

type Prompt = { id: number; title: string; description: string; category: string; price: string; creator: string; creatorName: string; initials: string; accent: string; preview: string; content: string }
type TransactionState = { status: 'idle' | 'pending' | 'success' | 'error'; message: string; hash?: string }

const prompts: Prompt[] = [
  { id: 1, title: 'The Strategic Operator', description: 'Turn ambiguous goals into clear, sequenced operating plans with risks, owners, and next moves.', category: 'Strategy', price: '0.08', creator: '0xEB...e834', creatorName: 'PromptMint Studio', initials: 'PM', accent: 'coral', preview: 'Name the thing everyone is avoiding. Then make it actionable.', content: 'You are a strategic operator. Take the situation below and return: the uncomfortable truth, the decision that follows, a sequence of three moves, the owner of each move, and the first observable signal that tells us we are on track.' },
  { id: 2, title: 'Socratic Tutor', description: 'A patient learning companion that builds real understanding through well-timed questions.', category: 'Education', price: '0.04', creator: '0xEB...e834', creatorName: 'PromptMint Studio', initials: 'PM', accent: 'blue', preview: 'Do not give me the answer. Help me earn it.', content: 'Act as a Socratic tutor. Never jump to the answer. Ask one question at a time, adapt to the learner\'s last response, identify the misconception underneath a wrong answer, and end with a compact explanation the learner can restate.' },
  { id: 3, title: 'Research Room', description: 'Make dense papers useful: extract claims, challenge assumptions, and surface what matters.', category: 'Research', price: '0.06', creator: '0xEB...e834', creatorName: 'PromptMint Studio', initials: 'PM', accent: 'lilac', preview: 'Make the important parts impossible to miss.', content: 'Read the research below as a skeptical editor. Separate observations from interpretations, extract the strongest claim, list the evidence supporting it, identify the weakest assumption, and propose one follow-up test.' },
  { id: 4, title: 'Brand Voice Kit', description: 'Build a distinct, consistent voice from a handful of examples and a point of view.', category: 'Creative', price: '0.03', creator: '0xEB...e834', creatorName: 'PromptMint Studio', initials: 'PM', accent: 'mint', preview: 'A recognizable voice is a decision made repeatedly.', content: 'You are a brand voice editor. Infer the point of view, rhythm, vocabulary, and emotional temperature from the examples. Return a concise voice guide, five do and do not pairs, and a rewrite in the established voice.' },
]
const categories = ['All prompts', 'Strategy', 'Education', 'Research', 'Creative']
const contractAddress = import.meta.env.VITE_PROMPTMINT_CONTRACT_ADDRESS
const contractAbi = ['function purchasePrompt(uint256 promptId) external payable', 'function tipCreator(uint256 promptId) external payable']
const testnet = { chainId: '0x3c8', chainName: 'BOT Chain Testnet', rpcUrls: ['https://rpc.bohr.life'], nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 }, blockExplorerUrls: ['https://scan.bohr.life'] }
declare global { interface Window { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } } }

function App() {
  const [wallet, setWallet] = useState('')
  const [owned, setOwned] = useState<number[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(getPromptIdFromHash())
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [transaction, setTransaction] = useState<TransactionState>({ status: 'idle', message: '' })
  const selectedPrompt = prompts.find((prompt) => prompt.id === selectedId) ?? null

  useEffect(() => {
    const onHashChange = () => setSelectedId(getPromptIdFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const connectWallet = async () => {
    if (!window.ethereum) { setToast('Install a compatible wallet to continue'); return '' }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[]
      try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: testnet.chainId }] }) }
      catch (error) { if ((error as { code?: number }).code === 4902) await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [testnet] }); else throw error }
      const account = accounts[0] ?? ''
      setWallet(account)
      return account
    } catch { setToast('Connect a wallet on BOT Chain testnet'); return '' }
  }

  const sendTransaction = async (prompt: Prompt, action: 'purchase' | 'tip', amount: string) => {
    const account = wallet || await connectWallet()
    if (!account || !window.ethereum) return
    if (!contractAddress) { setTransaction({ status: 'error', message: 'Contract address is not configured' }); return }
    try {
      setTransaction({ status: 'pending', message: action === 'purchase' ? 'Waiting for collection confirmation...' : 'Waiting for tip confirmation...' })
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new Contract(contractAddress, contractAbi, signer)
      const tx = action === 'purchase' ? await contract.purchasePrompt(prompt.id, { value: parseEther(amount) }) : await contract.tipCreator(prompt.id, { value: parseEther(amount) })
      const receipt = await tx.wait()
      if (action === 'purchase') setOwned((current) => [...new Set([...current, prompt.id])])
      setTransaction({ status: 'success', message: action === 'purchase' ? 'Prompt collected. Access unlocked.' : 'Tip sent directly to the creator.', hash: receipt.hash })
    } catch (error) {
      const details = getTransactionError(error)
      setTransaction({ status: 'error', message: details || 'Transaction cancelled or rejected by the network' })
    }
  }

  const openPrompt = (id: number) => { window.location.hash = `prompt/${id}`; setMobileOpen(false) }
  const closePrompt = () => { window.location.hash = ''; setTransaction({ status: 'idle', message: '' }) }

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#" onClick={() => { closePrompt(); setMobileOpen(false) }}><span className="brand-mark"><Sparkles size={16} /></span><span>prompt<span className="brand-accent">mint</span></span></a><nav className={mobileOpen ? 'nav-links is-open' : 'nav-links'}><a href="#discover" onClick={() => { closePrompt(); setMobileOpen(false) }}>Discover</a><a href="#how-it-works" onClick={() => { closePrompt(); setMobileOpen(false) }}>How it works</a></nav><div className="top-actions"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button><button className="wallet-button" onClick={() => void connectWallet()}><Wallet size={16} />{wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : 'Connect wallet'}</button></div></header>
    {selectedPrompt ? <PromptPage prompt={selectedPrompt} owned={owned.includes(selectedPrompt.id)} transaction={transaction} onBack={closePrompt} onCollect={() => void sendTransaction(selectedPrompt, 'purchase', selectedPrompt.price)} onTip={(amount) => void sendTransaction(selectedPrompt, 'tip', amount)} /> : <LandingPage onOpenPrompt={openPrompt} />}
    <footer><a className="brand" href="#" onClick={closePrompt}><span className="brand-mark"><Sparkles size={15} /></span><span>prompt<span className="brand-accent">mint</span></span></a><span>Own the prompts that power your agents.</span><span>BOT Chain testnet · <a href="https://scan.bohr.life" target="_blank" rel="noreferrer">Explorer ↗</a></span></footer>
    {toast && <button className="toast" onClick={() => setToast('')}><X size={14} /> {toast}</button>}
  </div>
}

function LandingPage({ onOpenPrompt }: { onOpenPrompt: (id: number) => void }) {
  const [activeCategory, setActiveCategory] = useState('All prompts')
  const [search, setSearch] = useState('')
  const filteredPrompts = useMemo(() => prompts.filter((prompt) => (activeCategory === 'All prompts' || prompt.category === activeCategory) && `${prompt.title} ${prompt.description} ${prompt.category}`.toLowerCase().includes(search.toLowerCase())), [activeCategory, search])
  return <main id="top"><section className="hero landing-hero"><div className="hero-copy"><p className="eyebrow"><span className="live-dot" /> A living library for better agents</p><h1>Ideas worth<br /><em>owning.</em></h1><p className="hero-subtitle">Reusable prompts with a point of view, collected on BOT Chain. Find the thinking that belongs in your agent’s toolkit.</p><div className="hero-actions"><a className="primary-button" href="#discover">Explore the collection <ArrowUpRight size={17} /></a><a className="text-button" href="#how-it-works">How it works <span>↓</span></a></div></div><div className="hero-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-card art-card-main"><div className="art-card-top"><span className="mini-label">PROMPT / 001</span><span className="art-status"><span /> on-chain</span></div><div className="quote-mark">“</div><p>Give me the<br /><strong>uncomfortable truth.</strong></p><div className="art-card-footer"><span>STRATEGIC OPERATOR</span><span>0.08 BOT</span></div></div><div className="floating-note note-top"><Sparkles size={14} /> <span>Human-made systems</span></div><div className="floating-note note-bottom"><span className="tiny-avatar">MC</span> Own the thinking behind the output</div></div></section><section className="landing-intro"><p className="eyebrow">THE PROMPT ECONOMY</p><p>PromptMint is a place for creators to package useful ways of thinking and for agents to access them with a single, verifiable payment.</p><span className="chain-mark">◈</span><span>Built on BOT Chain</span></section><section className="discover-section" id="discover"><div className="section-heading"><div><p className="eyebrow">THE COLLECTION</p><h2>Find your next<br /><em>unfair advantage.</em></h2></div><p className="section-intro">Four considered prompts for sharper thinking, better work, and more capable agents. Each has its own page, preview, and live collect flow.</p></div><div className="toolbar"><div className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the collection..." /></div><div className="category-list">{categories.map((category) => <button key={category} className={activeCategory === category ? 'category active' : 'category'} onClick={() => setActiveCategory(category)}>{category}</button>)}</div></div><div className="prompt-grid">{filteredPrompts.map((prompt) => <PromptCard key={prompt.id} prompt={prompt} onOpen={onOpenPrompt} />)}</div>{filteredPrompts.length === 0 && <div className="empty-state">No prompt matches that search.</div>}</section><section className="creator-band" id="how-it-works"><div className="creator-band-content"><p className="eyebrow">WHY PROMPTMINT</p><h2>Good prompts have<br /><em>a point of view.</em></h2><p>Creators publish a preview and metadata. Collectors pay in BOT for access. Every payout and tip moves directly to the creator’s wallet through the contract.</p><a className="dark-button" href="#discover">Browse the collection <ArrowUpRight size={16} /></a></div><div className="creator-visual"><div className="creator-ring ring-one" /><div className="creator-ring ring-two" /><div className="creator-profile"><div className="profile-avatar">MC</div><div><strong>Creator-owned</strong><span>Payment · access · provenance</span></div><Check size={16} /></div><div className="creator-tag tag-one">BOT Chain <span>testnet</span></div><div className="creator-tag tag-two">Pay creators directly</div></div></section></main>
}

function PromptCard({ prompt, onOpen }: { prompt: Prompt; onOpen: (id: number) => void }) {
  return <button className="prompt-card prompt-card-button" onClick={() => onOpen(prompt.id)}><div className={`prompt-card-art ${prompt.accent}`}><div className="card-art-meta"><span>{prompt.category}</span><span>↗</span></div><div className="card-art-shape"><span>{prompt.initials}</span></div></div><div className="prompt-card-body"><div className="card-title-row"><h3>{prompt.title}</h3><ArrowUpRight size={16} /></div><p>{prompt.description}</p><div className="card-footer"><div className="creator"><span className="avatar-small">{prompt.initials}</span><span><strong>{prompt.creatorName}</strong><small>{prompt.creator}</small></span></div><span className="price-button">{prompt.price} BOT <ChevronRight size={14} /></span></div></div></button>
}

function PromptPage({ prompt, owned, transaction, onBack, onCollect, onTip }: { prompt: Prompt; owned: boolean; transaction: TransactionState; onBack: () => void; onCollect: () => void; onTip: (amount: string) => void }) {
  return <main className="prompt-page"><div className="prompt-page-inner"><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to collection</button><div className="prompt-detail-grid"><div className={`prompt-detail-art ${prompt.accent}`}><div className="detail-art-code">PROMPT / {String(prompt.id).padStart(3, '0')}</div><div className="detail-art-initials">{prompt.initials}</div><div className="detail-art-caption">{prompt.category} · BOT Chain</div></div><article className="prompt-detail-copy"><p className="eyebrow">{prompt.category.toUpperCase()} · CREATOR EDITION</p><h1>{prompt.title}</h1><p className="detail-description">{prompt.description}</p><div className="detail-creator"><span className="profile-avatar">{prompt.initials}</span><span><strong>{prompt.creatorName}</strong><small>{prompt.creator}</small></span><span className="creator-verified"><Check size={14} /> on-chain creator</span></div><div className="detail-preview"><p className="eyebrow">PREVIEW</p><blockquote>“{prompt.preview}”</blockquote><small>Collect access to unlock the full prompt system.</small></div>{owned ? <div className="access-box"><div><Check size={18} /><span><strong>Access unlocked</strong><small>Your prompt is ready to use.</small></span></div><pre>{prompt.content}</pre></div> : <div className="collect-box"><div className="collect-price"><span>Collect access</span><strong>{prompt.price} BOT</strong></div><button className="primary-button full" disabled={transaction.status === 'pending'} onClick={onCollect}>{transaction.status === 'pending' ? 'Confirming on BOT Chain...' : <>Collect prompt <ArrowUpRight size={17} /></>}</button><small>One payment. Direct creator payout. No demo access.</small></div>}<TipPanel pending={transaction.status === 'pending'} onTip={onTip} />{transaction.status !== 'idle' && <TransactionNotice transaction={transaction} />}</article></div></div></main>
}

function TipPanel({ pending, onTip }: { pending: boolean; onTip: (amount: string) => void }) {
  const [amount, setAmount] = useState('0.01')
  return <div className="tip-panel"><div><Heart size={17} /><span><strong>Support the creator</strong><small>Send a direct tip in BOT.</small></span></div><div className="tip-actions"><select value={amount} onChange={(event) => setAmount(event.target.value)} disabled={pending}><option value="0.01">0.01 BOT</option><option value="0.02">0.02 BOT</option><option value="0.05">0.05 BOT</option></select><button className="tip-button" disabled={pending} onClick={() => onTip(amount)}>Tip creator</button></div></div>
}

function TransactionNotice({ transaction }: { transaction: TransactionState }) {
  return <div className={`transaction-notice ${transaction.status}`}><span>{transaction.status === 'pending' ? <Wallet size={16} /> : transaction.status === 'success' ? <Check size={16} /> : <X size={16} />}</span><div><strong>{transaction.message}</strong>{transaction.hash && <a href={`https://scan.bohr.life/tx/${transaction.hash}`} target="_blank" rel="noreferrer">View transaction ↗</a>}</div></div>
}

function getPromptIdFromHash() { const match = window.location.hash.match(/^#prompt\/(\d+)$/); return match ? Number(match[1]) : null }

function getTransactionError(error: unknown) {
  const candidate = error as { shortMessage?: string; reason?: string; code?: string }
  if (candidate.code === 'ACTION_REJECTED') return 'Transaction rejected in wallet'
  if (candidate.reason) return `Transaction reverted: ${candidate.reason}`
  if (candidate.shortMessage) return candidate.shortMessage
  return ''
}

export default App
