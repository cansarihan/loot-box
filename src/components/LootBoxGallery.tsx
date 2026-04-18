import React from "react"
import { motion } from "framer-motion"
import styles from "./LootBoxGallery.module.css"

export type BoxTier = "Bronze" | "Silver" | "Gold" | "Cyber"

export interface BoxConfig {
  tier: BoxTier
  price: number   // XLM
  color: string
  glow: string
  emoji: string
  description: string
}

export const BOXES: BoxConfig[] = [
  {
    tier: "Bronze",
    price: 0.5,
    color: "#cd7f32",
    glow: "rgba(205,127,50,0.35)",
    emoji: "📦",
    description: "5% Legendary · 25% Rare · 70% Common",
  },
  {
    tier: "Silver",
    price: 1,
    color: "#c0c0c0",
    glow: "rgba(192,192,192,0.35)",
    emoji: "🎁",
    description: "8% Legendary · 30% Rare · 62% Common",
  },
  {
    tier: "Gold",
    price: 3,
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.35)",
    emoji: "🏆",
    description: "12% Legendary · 38% Rare · 50% Common",
  },
  {
    tier: "Cyber",
    price: 5,
    color: "#00d4ff",
    glow: "rgba(0,212,255,0.35)",
    emoji: "⚡",
    description: "20% Legendary · 45% Rare · 35% Common",
  },
]

// XLM payout multipliers per rarity — matches contract payout() function
export const PAYOUTS: Record<BoxTier, Record<string, number>> = {
  Bronze:  { Common: 0,    Rare: 0.8,  Legendary: 2.5 },
  Silver:  { Common: 0,    Rare: 1.5,  Legendary: 5   },
  Gold:    { Common: 0.5,  Rare: 4,    Legendary: 15  },
  Cyber:   { Common: 1,    Rare: 8,    Legendary: 30  },
}

interface Props {
  onSelect: (tier: BoxTier, useTicket: boolean) => void
  disabled?: boolean
  balance: number
  tickets: number
}

const LootBoxGallery: React.FC<Props> = ({ onSelect, disabled, balance, tickets }) => {
  return (
    <div className={styles.gallery}>
      {BOXES.map((box, i) => {
        const canAfford = balance >= box.price
        const hasTicket = tickets > 0

        return (
          <motion.div
            key={box.tier}
            className={styles.boxCard}
            style={{ "--box-color": box.color, "--box-glow": box.glow } as React.CSSProperties}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.04, y: -4 }}
          >
            <div className={styles.boxEmoji}>{box.emoji}</div>
            <h3 className={styles.boxTier}>{box.tier}</h3>
            <div className={styles.boxPrice}>{box.price} XLM</div>
            <p className={styles.boxDesc}>{box.description}</p>

            {/* Payout info */}
            <div className={styles.payouts}>
              {Object.entries(PAYOUTS[box.tier])
                .filter(([, v]) => v > 0)
                .map(([rarity, xlm]) => (
                  <span key={rarity} className={styles.payoutRow}>
                    <span className={styles.payoutRarity}>{rarity}</span>
                    <span className={styles.payoutXlm}>+{xlm} XLM</span>
                  </span>
                ))}
            </div>

            {/* Buy with XLM */}
            <button
              className={styles.openBtn}
              onClick={() => onSelect(box.tier, false)}
              disabled={disabled || !canAfford}
              title={!canAfford ? "Insufficient balance" : ""}
            >
              {canAfford ? `Open — ${box.price} XLM` : "Insufficient XLM"}
            </button>

            {/* Use free ticket */}
            {hasTicket && (
              <button
                className={styles.ticketBtn}
                onClick={() => onSelect(box.tier, true)}
                disabled={disabled}
              >
                🎟️ Use Free Ticket
              </button>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

export default LootBoxGallery
