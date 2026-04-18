import lootBoxClient from "../contracts/loot_box"
import { wallet } from "./wallet"
import type { BoxTier as ContractBoxTier, LootResult } from "loot_box"

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015"

function toContractTier(tier: string): ContractBoxTier {
  switch (tier) {
    case "Bronze": return { tag: "Bronze", values: undefined as unknown as void }
    case "Silver": return { tag: "Silver", values: undefined as unknown as void }
    case "Gold":   return { tag: "Gold",   values: undefined as unknown as void }
    case "Cyber":  return { tag: "Cyber",  values: undefined as unknown as void }
    default:       return { tag: "Bronze", values: undefined as unknown as void }
  }
}

export interface OpenBoxResult {
  item_name: string
  rarity: string
  item_id: number
  tx_hash_seed: string
  xlm_won: number
}

export async function openBox(
  playerAddress: string,
  tier: string,
  useTicket: boolean,
  signTransaction: typeof wallet.signTransaction,
): Promise<OpenBoxResult> {
  const assembledTx = await lootBoxClient.open_box(
    {
      player: playerAddress,
      box_tier: toContractTier(tier),
      use_ticket: useTicket,
    },
    { publicKey: playerAddress },
  )

  // Single popup — SDK handles polling and result parsing
  const sentTx = await assembledTx.signAndSend({
    signTransaction: (xdrStr: string) =>
      signTransaction(xdrStr, { networkPassphrase: TESTNET_PASSPHRASE }),
  })

  const loot = sentTx.result as LootResult

  // xlm_won is i128 — SDK returns it as bigint
  const xlm_won_stroops = typeof loot.xlm_won === "bigint"
    ? loot.xlm_won
    : BigInt(String(loot.xlm_won ?? 0))
  const xlm_won = Number(xlm_won_stroops) / 10_000_000

  return {
    item_name: String(loot.item_name),
    rarity: (loot.rarity as { tag: string }).tag,
    item_id: Number(loot.item_id),
    tx_hash_seed: String(loot.tx_hash_seed),
    xlm_won,
  }
}
