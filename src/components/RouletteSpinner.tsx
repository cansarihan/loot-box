import React, { useEffect, useRef, useState } from "react"
import { motion, useAnimation } from "framer-motion"
import styles from "./RouletteSpinner.module.css"

interface Item {
  name: string
  rarity: "Common" | "Rare" | "Legendary"
  color: string
}

const RARITY_COLORS = {
  Common: "#94a3b8",
  Rare: "#3b82f6",
  Legendary: "#fbbf24",
}

// Pool of items shown in the reel
const REEL_ITEMS: Item[] = [
  { name: "Iron Shield", rarity: "Common", color: RARITY_COLORS.Common },
  { name: "Silver Blade", rarity: "Rare", color: RARITY_COLORS.Rare },
  { name: "Wooden Sword", rarity: "Common", color: RARITY_COLORS.Common },
  { name: "Dragon Slayer", rarity: "Legendary", color: RARITY_COLORS.Legendary },
  { name: "Leather Boots", rarity: "Common", color: RARITY_COLORS.Common },
  { name: "Enchanted Bow", rarity: "Rare", color: RARITY_COLORS.Rare },
  { name: "Bronze Helm", rarity: "Common", color: RARITY_COLORS.Common },
  { name: "Void Gauntlet", rarity: "Legendary", color: RARITY_COLORS.Legendary },
  { name: "Stone Ring", rarity: "Common", color: RARITY_COLORS.Common },
  { name: "Crystal Staff", rarity: "Rare", color: RARITY_COLORS.Rare },
  { name: "Shadow Cloak", rarity: "Rare", color: RARITY_COLORS.Rare },
  { name: "Stellar Crown", rarity: "Legendary", color: RARITY_COLORS.Legendary },
  { name: "Mithril Armor", rarity: "Rare", color: RARITY_COLORS.Rare },
  { name: "Cosmic Blade", rarity: "Legendary", color: RARITY_COLORS.Legendary },
  { name: "Infinity Orb", rarity: "Legendary", color: RARITY_COLORS.Legendary },
]

const ITEM_WIDTH = 140 // px
const VISIBLE_COUNT = 7

interface Props {
  spinning: boolean
  result?: { item_name: string; rarity: string }
  onDone?: () => void
}

const RouletteSpinner: React.FC<Props> = ({ spinning, result, onDone }) => {
  const controls = useAnimation()
  const [items, setItems] = useState<Item[]>([])
  const hasSpun = useRef(false)

  // Build a long reel with the result item at the winning position
  useEffect(() => {
    if (spinning && result) {
      hasSpun.current = false
      const rarity = result.rarity as "Common" | "Rare" | "Legendary"
      const winItem: Item = {
        name: result.item_name,
        rarity,
        color: RARITY_COLORS[rarity] ?? RARITY_COLORS.Common,
      }

      // Build 40 random items, place winner near the end
      const pool: Item[] = []
      for (let i = 0; i < 38; i++) {
        pool.push(REEL_ITEMS[Math.floor(Math.random() * REEL_ITEMS.length)])
      }
      // Winner at index 35 (center of visible area after scroll)
      pool[35] = winItem
      setItems(pool)

      // Animate: scroll to winner position
      const targetX = -(35 - Math.floor(VISIBLE_COUNT / 2)) * ITEM_WIDTH
      controls.set({ x: 0 })
      controls.start({
        x: targetX,
        transition: {
          duration: 4,
          ease: [0.1, 0.9, 0.2, 1.0], // fast then slow
        },
      }).then(() => {
        if (!hasSpun.current) {
          hasSpun.current = true
          onDone?.()
        }
      })
    }
  }, [spinning, result])

  if (!spinning && items.length === 0) return null

  return (
    <div className={styles.spinnerWrapper}>
      {/* Center marker */}
      <div className={styles.centerMarker} />

      <div className={styles.viewport}>
        <motion.div className={styles.reel} animate={controls}>
          {items.map((item, i) => (
            <div
              key={i}
              className={styles.reelItem}
              style={{ borderColor: item.color, color: item.color }}
            >
              <span className={styles.itemRarity}>{item.rarity}</span>
              <span className={styles.itemName}>{item.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default RouletteSpinner
