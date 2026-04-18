import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import styles from "./BalanceBar.module.css"

interface Props {
  balance: number
  tickets: number
  lastWin: number | null
  connected: boolean
}

const BalanceBar: React.FC<Props> = ({ balance, tickets, lastWin, connected }) => {
  return (
    <div className={styles.bar}>
      <div className={styles.stat}>
        <span className={styles.label}>💰 XLM Balance</span>
        {connected ? (
          <span className={styles.value}>
            {balance.toLocaleString("en-US", { maximumFractionDigits: 2 })} XLM
          </span>
        ) : (
          <span className={styles.notConnected}>Connect wallet</span>
        )}
      </div>

      <div className={styles.divider} />

      <div className={styles.stat}>
        <span className={styles.label}>🎟️ Free Tickets</span>
        <span className={`${styles.value} ${tickets > 0 ? styles.ticketGlow : ""}`}>
          {tickets}
        </span>
      </div>

      <div className={styles.divider} />

      <div className={styles.stat}>
        <span className={styles.label}>📈 Total Won</span>
        <AnimatePresence mode="wait">
          {lastWin !== null && lastWin > 0 ? (
            <motion.span
              key={lastWin}
              className={`${styles.value} ${styles.winGlow}`}
              initial={{ scale: 1.4, color: "#fbbf24" }}
              animate={{ scale: 1, color: "#4ade80" }}
              transition={{ duration: 0.5 }}
            >
              +{lastWin.toFixed(1)} XLM
            </motion.span>
          ) : (
            <span className={styles.value} style={{ color: "#6b7f96" }}>—</span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default BalanceBar
