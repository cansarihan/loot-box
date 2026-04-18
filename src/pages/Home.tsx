import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import LootBoxGallery, { BoxTier, BOXES, PAYOUTS } from "../components/LootBoxGallery"
import RouletteSpinner from "../components/RouletteSpinner"
import LootResult from "../components/LootResult"
import Inventory, { InventoryItem } from "../components/Inventory"
import QuestPanel, { QuestReward } from "../components/QuestPanel"
import BalanceBar from "../components/BalanceBar"
import ConnectAccount from "../components/ConnectAccount"
import { useWallet } from "../hooks/useWallet"
import { openBox } from "../util/lootbox"
import styles from "./Home.module.css"

type LootResultData = {
  item_name: string
  rarity: string
  item_id: number
  tx_hash_seed: string
  xlm_won: number
}

const TABS = ["boxes", "quests", "inventory", "fair"] as const
type Tab = typeof TABS[number]

const Home: React.FC = () => {
  const { balances, updateBalances, address, signTransaction } = useWallet()

  // Real XLM balance from Horizon
  const rawXlm = balances?.xlm?.balance ?? "0"
  const walletXlm = parseFloat(rawXlm) || 0

  // Optimistic delta — applied instantly, resets when Horizon confirms
  const [optimisticDelta, setOptimisticDelta] = useState(0)
  const balance = walletXlm + optimisticDelta

  const [tickets, setTickets]       = useState(0)
  const [totalWon, setTotalWon]     = useState(0)
  const [lastWin, setLastWin]       = useState<number | null>(null)
  const [spinning, setSpinning]     = useState(false)
  const [pendingResult, setPendingResult] = useState<LootResultData | null>(null)
  const [shownResult, setShownResult]     = useState<LootResultData | null>(null)
  const [inventory, setInventory]   = useState<InventoryItem[]>([])
  const [activeTab, setActiveTab]   = useState<Tab>("boxes")
  const [claimedQuests, setClaimedQuests] = useState<Set<string>>(new Set())
  const [txError, setTxError]       = useState<string | null>(null)
  const [ticketAdded, setTicketAdded] = useState<number | null>(null)

  // Refresh wallet balance every 5s
  useEffect(() => {
    const id = setInterval(() => { void updateBalances() }, 5000)
    return () => clearInterval(id)
  }, [updateBalances])

  /* ── Open a box — calls real Soroban contract ── */
  const handleOpenBox = async (tier: BoxTier, useTicket: boolean) => {
    if (spinning || !address) return
    const box = BOXES.find(b => b.tier === tier)!
    if (!useTicket && balance < box.price) return
    if (useTicket && tickets <= 0) return

    setSpinning(true)
    setTxError(null)
    setActiveTab("boxes")

    // Optimistically deduct box price immediately (only if paying with XLM)
    if (!useTicket) {
      setOptimisticDelta(prev => prev - box.price)
    }

    try {
      // Call the real on-chain contract — wallet popup will appear for signing
      const result = await openBox(address, tier, useTicket, signTransaction)
      // xlm_won comes directly from the contract's real execution
      setPendingResult({ ...result, xlm_won: result.xlm_won })

      if (useTicket) {
        setTickets(prev => prev - 1)
      }
      // Refresh balance immediately after tx confirms
      void updateBalances()
      setTimeout(() => void updateBalances(), 2000)
    } catch (err) {
      console.error("open_box failed:", err)
      setTxError(err instanceof Error ? err.message : "Transaction failed")
      setSpinning(false)
      // Revert optimistic deduction on error
      if (!useTicket) {
        const box = BOXES.find(b => b.tier === tier)!
        setOptimisticDelta(prev => prev + box.price)
      }
    }
  }

  /* ── Spin done ── */
  const handleSpinDone = () => {
    setSpinning(false)
    if (!pendingResult) return
    setShownResult(pendingResult)
    if (pendingResult.xlm_won > 0) {
      setTotalWon(prev => +(prev + pendingResult.xlm_won).toFixed(2))
      setLastWin(pendingResult.xlm_won)
    }
    setInventory(prev => [...prev, { ...pendingResult, timestamp: Date.now() }])
    // Refresh balance immediately after tx confirms
    void updateBalances()
    // And again after 3s to catch any delay
    setTimeout(() => void updateBalances(), 3000)
  }

  const handleCloseResult = () => {
    // Add winnings to optimistic balance instantly
    if (shownResult && shownResult.xlm_won > 0) {
      setOptimisticDelta(prev => prev + shownResult.xlm_won)
    }
    setShownResult(null)
    setPendingResult(null)
    // Refresh from Horizon in background — when it arrives, reset optimistic delta
    void updateBalances().then(() => setOptimisticDelta(0))
  }

  /* ── Quest claim ── */
  const handleQuestClaim = (reward: QuestReward) => {
    if (claimedQuests.has(reward.type)) return
    setClaimedQuests(prev => new Set([...prev, reward.type]))
    setTickets(prev => prev + reward.tickets)
    setTicketAdded(reward.tickets)
    setTimeout(() => setTicketAdded(null), 3000)
  }

  return (
    <div className={styles.Home}>

      {/* ── Hero ── */}
      <motion.div className={styles.hero} initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}>
        <h1 className={styles.title}>
          <span className={styles.neon}>LOOT</span>
          <span className={styles.white}>BOX</span>
        </h1>
        <p className={styles.subtitle}>
          Provably fair on-chain loot boxes · powered by{" "}
          <span className={styles.neon}>Stellar Soroban</span>
        </p>
        <div className={styles.walletRow}>
          <ConnectAccount />
        </div>
      </motion.div>

      {/* ── Balance bar ── */}
      <BalanceBar
        balance={balance}
        tickets={tickets}
        lastWin={lastWin}
        connected={!!balances?.xlm}
      />

      {/* ── Ticket toast ── */}
      {ticketAdded !== null && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            background: "rgba(0,212,255,0.12)",
            border: "1px solid rgba(0,212,255,0.4)",
            borderRadius: "10px",
            padding: "0.65rem 1rem",
            color: "#00d4ff",
            fontSize: "0.9rem",
            textAlign: "center",
            fontFamily: "'Orbitron', sans-serif",
          }}
        >
          🎟️ +{ticketAdded} Free Tickets added to your balance!
        </motion.div>
      )}

      {/* ── Roulette ── */}
      <RouletteSpinner spinning={spinning} result={pendingResult ?? undefined} onDone={handleSpinDone} />

      {/* ── TX Error ── */}
      {txError && (
        <div style={{
          background: "rgba(239,68,68,0.12)",
          border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: "10px",
          padding: "0.75rem 1rem",
          color: "#fca5a5",
          fontSize: "0.85rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span>⚠️ {txError}</span>
          <button onClick={() => setTxError(null)} style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer", fontSize: "1rem" }}>✕</button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "boxes"     && "🎁 Boxes"}
            {tab === "quests"    && `🎯 Quests${claimedQuests.size > 0 ? ` (${claimedQuests.size}/2)` : ""}`}
            {tab === "inventory" && `🎒 Inventory (${inventory.length})`}
            {tab === "fair"      && "🔍 Provably Fair"}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className={styles.tabContent}>

        {activeTab === "boxes" && (
          <LootBoxGallery
            onSelect={handleOpenBox}
            disabled={spinning}
            balance={balance}
            tickets={tickets}
          />
        )}

        {activeTab === "quests" && (
          <QuestPanel onClaim={handleQuestClaim} claimed={claimedQuests} />
        )}

        {activeTab === "inventory" && (
          <Inventory items={inventory} />
        )}

        {activeTab === "fair" && (
          <div className={styles.fairPanel}>
            <h2>How does it work?</h2>
            <p>
              Every loot box opening is powered by <strong>Soroban's on-chain PRNG</strong>.
              The random seed is generated inside the smart contract using{" "}
              <code>env.prng().gen_range()</code> — seeded by the ledger's verifiable random function (VRF).
            </p>

            <h3>Odds & Payouts</h3>
            <table className={styles.oddsTable}>
              <thead>
                <tr>
                  <th>Box</th>
                  <th>Price</th>
                  <th>⭐ Legendary</th>
                  <th>🔵 Rare</th>
                  <th>⚪ Common</th>
                </tr>
              </thead>
              <tbody>
                {BOXES.map(b => (
                  <tr key={b.tier}>
                    <td style={{ color: b.color }}>{b.tier}</td>
                    <td>{b.price} XLM</td>
                    <td className={styles.legendary}>
                      {b.tier === "Bronze" ? "5%" : b.tier === "Silver" ? "8%" : b.tier === "Gold" ? "12%" : "20%"}
                      {" · "}+{PAYOUTS[b.tier].Legendary} XLM
                    </td>
                    <td className={styles.rare}>
                      {b.tier === "Bronze" ? "25%" : b.tier === "Silver" ? "30%" : b.tier === "Gold" ? "38%" : "45%"}
                      {" · "}+{PAYOUTS[b.tier].Rare} XLM
                    </td>
                    <td className={styles.common}>
                      {b.tier === "Bronze" ? "70%" : b.tier === "Silver" ? "62%" : b.tier === "Gold" ? "50%" : "35%"}
                      {PAYOUTS[b.tier].Common > 0 ? ` · +${PAYOUTS[b.tier].Common} XLM` : " · —"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>Verify a Roll</h3>
            <p>
              Each result includes a <strong>tx_hash_seed</strong> — the raw random number generated on-chain.
              Look up the transaction on{" "}
              <a href="https://stellar.expert" target="_blank" rel="noreferrer" className={styles.link}>
                Stellar Explorer
              </a>{" "}
              to verify the result independently.
            </p>

            {inventory.length > 0 && (
              <div className={styles.recentSeeds}>
                <h3>Recent Seeds</h3>
                {[...inventory].reverse().slice(0, 5).map((item, i) => (
                  <div key={i} className={styles.seedRow}>
                    <span className={styles.seedItem}>{item.item_name}</span>
                    <code className={styles.seedCode}>{item.tx_hash_seed}</code>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Result modal ── */}
      {shownResult && <LootResult result={shownResult} onClose={handleCloseResult} />}
    </div>
  )
}

export default Home
