import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import styles from "./LootResult.module.css"

interface Props {
  result: {
    item_name: string
    rarity: string
    item_id: number
    tx_hash_seed: string
    xlm_won?: number
  } | null
  onClose: () => void
}

const RARITY_CONFIG = {
  Common:    { color: "#94a3b8", emoji: "⚪", label: "COMMON" },
  Rare:      { color: "#3b82f6", emoji: "🔵", label: "RARE" },
  Legendary: { color: "#fbbf24", emoji: "⭐", label: "LEGENDARY" },
}

const LootResult: React.FC<Props> = ({ result, onClose }) => {
  if (!result) return null
  const cfg = RARITY_CONFIG[result.rarity as keyof typeof RARITY_CONFIG] ?? RARITY_CONFIG.Common
  const won = result.xlm_won ?? 0

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.card}
          style={{ "--rarity-color": cfg.color } as React.CSSProperties}
          initial={{ scale: 0.5, opacity: 0, y: 60 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          onClick={e => e.stopPropagation()}
        >
          <motion.div
            className={styles.emoji}
            animate={{ rotate: [0,-12,12,-8,0], scale: [1,1.25,1] }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {cfg.emoji}
          </motion.div>

          <div className={styles.rarityBadge}>{cfg.label}</div>
          <h2 className={styles.itemName}>{result.item_name}</h2>
          <p className={styles.itemId}>Item #{result.item_id}</p>

          {/* XLM won */}
          {won > 0 ? (
            <motion.div
              className={styles.winBanner}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              <span className={styles.winLabel}>💰 You won</span>
              <span className={styles.winAmount}>+{won} XLM</span>
              <span className={styles.winSub}>Added to your balance</span>
            </motion.div>
          ) : (
            <div className={styles.noWin}>No XLM payout for Common items on this tier</div>
          )}

          {/* Provably fair */}
          <div className={styles.proofSection}>
            <p className={styles.proofLabel}>🔍 Provably Fair Seed</p>
            <code className={styles.proofHash}>{result.tx_hash_seed}</code>
          </div>

          <button className={styles.closeBtn} onClick={onClose}>
            {won > 0 ? `Collect +${won} XLM` : "Close"}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default LootResult
