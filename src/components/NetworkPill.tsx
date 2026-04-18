import { Icon } from "@stellar/design-system"
import React from "react"
import { stellarNetwork } from "../contracts/util"
import { useWallet } from "../hooks/useWallet"

const formatNetworkName = (name: string) =>
  name === "STANDALONE"
    ? "Local"
    : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()

const appNetwork = formatNetworkName(stellarNetwork)

const NetworkPill: React.FC = () => {
  const { network, address } = useWallet()
  const walletNetwork = formatNetworkName(network ?? "")
  const isNetworkMismatch = walletNetwork !== appNetwork

  let dotColor = "#2ED06E"
  let title = ""
  if (!address) {
    dotColor = "#4a6070"
    title = "Connect your wallet using this network."
  } else if (isNetworkMismatch) {
    dotColor = "#ef4444"
    title = `Wallet is on ${walletNetwork}, connect to ${appNetwork} instead.`
  }

  return (
    <div
      style={{
        backgroundColor: "#161f2e",
        color: "#c8d8e8",
        padding: "4px 10px",
        borderRadius: "16px",
        fontSize: "12px",
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        border: "1px solid rgba(0,212,255,0.2)",
        cursor: isNetworkMismatch ? "help" : "default",
      }}
      title={title}
    >
      <Icon.Circle color={dotColor} />
      {appNetwork}
    </div>
  )
}

export default NetworkPill
