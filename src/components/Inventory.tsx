import React from "react"
import { motion } from "framer-motion"
import styles from "./Inventory.module.css"

export interface InventoryItem {
  item_name: string
  rarity: string
  item_id: number
  tx_hash_seed: string
  timestamp: number
}

const RARITY_COLORS = {
  Common: "#94a3b8",
  Rare: "#3b82f6",
  Legendary: "#fbbf24",
}

interface Props {
  items: InventoryItem[]
}

const Inventory: React.FC<Props> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>🎁 No items yet. Open a box to get started!</p>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {[...items].reverse().map((item, i) => {
        const color = RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] ?? "#94a3b8"
        return (
          <motion.div
            key={`${item.tx_hash_seed}-${i}`}
            className={styles.itemCard}
            style={{ "--item-color": color } as React.CSSProperties}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className={styles.rarityDot} />
            <span className={styles.itemName}>{item.item_name}</span>
            <span className={styles.rarity}>{item.rarity}</span>
            <span className={styles.seed} title={`Seed: ${item.tx_hash_seed}`}>
              #{item.item_id}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

export default Inventory
