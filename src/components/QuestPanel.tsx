import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import styles from "./QuestPanel.module.css"

export interface QuestReward {
  type: "twitter" | "linkedin"
  tickets: number
}

interface Quest {
  id: "twitter" | "linkedin"
  icon: string
  platform: string
  action: string
  url: string
  reward: number
  color: string
  glow: string
  handle: string
}

const QUESTS: Quest[] = [
  {
    id: "twitter",
    icon: "𝕏",
    platform: "Twitter / X",
    action: "Follow @Blu27681Blue",
    url: "https://x.com/Blu27681Blue",
    reward: 3,
    color: "#1d9bf0",
    glow: "rgba(29,155,240,0.35)",
    handle: "@Blu27681Blue",
  },
  {
    id: "linkedin",
    icon: "in",
    platform: "LinkedIn",
    action: "Follow Can Sarıhan",
    url: "https://www.linkedin.com/in/can-sar%C4%B1han-4b2758232/",
    reward: 5,
    color: "#0a66c2",
    glow: "rgba(10,102,194,0.35)",
    handle: "Can Sarıhan",
  },
]

interface Props {
  onClaim: (reward: QuestReward) => void
  claimed: Set<string>
}

const QuestPanel: React.FC<Props> = ({ onClaim, claimed }) => {
  const [confirming, setConfirming] = useState<string | null>(null)

  const handleFollow = (quest: Quest) => {
    window.open(quest.url, "_blank", "noopener,noreferrer")
    // After opening, show confirm button
    setTimeout(() => setConfirming(quest.id), 800)
  }

  const handleConfirm = (quest: Quest) => {
    onClaim({ type: quest.id, tickets: quest.reward })
    setConfirming(null)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>🎯</span>
        <div>
          <h3 className={styles.title}>Daily Quests</h3>
          <p className={styles.subtitle}>Complete tasks to earn free box tickets</p>
        </div>
      </div>

      <div className={styles.quests}>
        {QUESTS.map((quest) => {
          const done = claimed.has(quest.id)
          const isConfirming = confirming === quest.id

          return (
            <motion.div
              key={quest.id}
              className={`${styles.questCard} ${done ? styles.done : ""}`}
              style={{ "--q-color": quest.color, "--q-glow": quest.glow } as React.CSSProperties}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className={styles.platformIcon}>{quest.icon}</div>

              <div className={styles.questInfo}>
                <span className={styles.platform}>{quest.platform}</span>
                <span className={styles.action}>{quest.action}</span>
                <span className={styles.handle}>{quest.handle}</span>
              </div>

              <div className={styles.rewardBadge}>
                <span className={styles.rewardNum}>+{quest.reward}</span>
                <span className={styles.rewardLabel}>tickets</span>
              </div>

              <div className={styles.questAction}>
                {done ? (
                  <div className={styles.claimedBadge}>✓ Claimed</div>
                ) : isConfirming ? (
                  <AnimatePresence>
                    <motion.button
                      className={styles.confirmBtn}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={() => handleConfirm(quest)}
                    >
                      ✓ I followed!
                    </motion.button>
                  </AnimatePresence>
                ) : (
                  <button
                    className={styles.followBtn}
                    onClick={() => handleFollow(quest)}
                  >
                    Follow →
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default QuestPanel
