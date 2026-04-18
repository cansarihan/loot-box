#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, BytesN, Env, String, Symbol, Vec,
    events,
};

mod xlm;

pub const ADMIN_KEY: &Symbol = &symbol_short!("ADMIN");
pub const BOX_PRICE: i128 = 5_000_000; // 0.5 XLM in stroops

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum Rarity {
    Common,
    Rare,
    Legendary,
}

#[contracttype]
#[derive(Clone)]
pub struct LootResult {
    pub rarity: Rarity,
    pub item_name: String,
    pub item_id: u64,
    pub tx_hash_seed: u64,
    pub xlm_won: i128,
}

#[contracttype]
#[derive(Clone)]
pub enum BoxTier {
    Bronze,
    Silver,
    Gold,
    Cyber,
}

#[contract]
pub struct LootBox;

#[contractimpl]
impl LootBox {
    pub fn __constructor(env: &Env, admin: Address) {
        admin.require_auth();
        #[cfg(test)]
        xlm::register(env, &admin);
        env.storage().instance().set(ADMIN_KEY, &admin);
    }

    pub fn open_box(env: &Env, player: Address, box_tier: BoxTier, use_ticket: bool) -> LootResult {
        player.require_auth();

        let price = Self::box_price(&box_tier);
        let contract_addr = env.current_contract_address();

        // Only charge XLM if not using a free ticket
        if !use_ticket {
            xlm::token_client(env).transfer(&player, &contract_addr, &price);
        }

        let seed: u64 = env.prng().gen_range(0..=u64::MAX);
        let roll: u64 = seed % 100;

        let (rarity, item_id) = Self::determine_rarity(env, roll, &box_tier);
        let item_name = Self::item_name(env, &rarity, item_id);

        // Calculate payout
        let xlm_won: i128 = Self::payout(&rarity, &box_tier);

        // Send winnings if any
        if xlm_won > 0 {
            let balance = xlm::token_client(env).balance(&contract_addr);
            if balance >= xlm_won {
                xlm::token_client(env).transfer(&contract_addr, &player, &xlm_won);
            }
        }

        let result = LootResult {
            rarity,
            item_name,
            item_id,
            tx_hash_seed: seed,
            xlm_won,
        };

        // Emit event so frontend can read real result
        env.events().publish(
            (symbol_short!("loot_open"), player),
            result.clone(),
        );

        result
    }

    pub(crate) fn payout(rarity: &Rarity, tier: &BoxTier) -> i128 {
        let stroops: i128 = match (rarity, tier) {
            (Rarity::Rare,      BoxTier::Bronze) => 8_000_000,   // 0.8 XLM
            (Rarity::Legendary, BoxTier::Bronze) => 25_000_000,  // 2.5 XLM
            (Rarity::Rare,      BoxTier::Silver) => 15_000_000,  // 1.5 XLM
            (Rarity::Legendary, BoxTier::Silver) => 50_000_000,  // 5 XLM
            (Rarity::Common,    BoxTier::Gold)   => 5_000_000,   // 0.5 XLM
            (Rarity::Rare,      BoxTier::Gold)   => 40_000_000,  // 4 XLM
            (Rarity::Legendary, BoxTier::Gold)   => 150_000_000, // 15 XLM
            (Rarity::Common,    BoxTier::Cyber)  => 10_000_000,  // 1 XLM
            (Rarity::Rare,      BoxTier::Cyber)  => 80_000_000,  // 8 XLM
            (Rarity::Legendary, BoxTier::Cyber)  => 300_000_000, // 30 XLM
            _ => 0,
        };
        stroops
    }

    pub fn box_price(tier: &BoxTier) -> i128 {
        match tier {
            BoxTier::Bronze => BOX_PRICE,
            BoxTier::Silver => BOX_PRICE * 2,
            BoxTier::Gold   => BOX_PRICE * 6,
            BoxTier::Cyber  => BOX_PRICE * 10,
        }
    }

    fn determine_rarity(env: &Env, roll: u64, tier: &BoxTier) -> (Rarity, u64) {
        let legendary_threshold = match tier {
            BoxTier::Bronze => 5,
            BoxTier::Silver => 8,
            BoxTier::Gold   => 12,
            BoxTier::Cyber  => 20,
        };
        let rare_threshold = match tier {
            BoxTier::Bronze => 30,
            BoxTier::Silver => 38,
            BoxTier::Gold   => 50,
            BoxTier::Cyber  => 65,
        };

        let rarity = if roll < legendary_threshold {
            Rarity::Legendary
        } else if roll < rare_threshold {
            Rarity::Rare
        } else {
            Rarity::Common
        };

        let pool: u64 = match rarity {
            Rarity::Common    => 20,
            Rarity::Rare      => 10,
            Rarity::Legendary => 5,
        };
        let item_id = env.prng().gen_range(0..pool);
        (rarity, item_id)
    }

    fn item_name(env: &Env, rarity: &Rarity, id: u64) -> String {
        match rarity {
            Rarity::Common => match id % 5 {
                0 => String::from_str(env, "Iron Shield"),
                1 => String::from_str(env, "Wooden Sword"),
                2 => String::from_str(env, "Leather Boots"),
                3 => String::from_str(env, "Bronze Helm"),
                _ => String::from_str(env, "Stone Ring"),
            },
            Rarity::Rare => match id % 5 {
                0 => String::from_str(env, "Silver Blade"),
                1 => String::from_str(env, "Enchanted Bow"),
                2 => String::from_str(env, "Mithril Armor"),
                3 => String::from_str(env, "Crystal Staff"),
                _ => String::from_str(env, "Shadow Cloak"),
            },
            Rarity::Legendary => match id % 5 {
                0 => String::from_str(env, "Dragon Slayer"),
                1 => String::from_str(env, "Void Gauntlet"),
                2 => String::from_str(env, "Stellar Crown"),
                3 => String::from_str(env, "Cosmic Blade"),
                _ => String::from_str(env, "Infinity Orb"),
            },
        }
    }

    pub fn get_boxes(env: &Env) -> Vec<i128> {
        let mut prices = Vec::new(env);
        prices.push_back(Self::box_price(&BoxTier::Bronze));
        prices.push_back(Self::box_price(&BoxTier::Silver));
        prices.push_back(Self::box_price(&BoxTier::Gold));
        prices.push_back(Self::box_price(&BoxTier::Cyber));
        prices
    }

    pub fn add_funds(env: &Env, amount: i128) {
        Self::require_admin(env);
        let admin = Self::admin(env).unwrap();
        xlm::token_client(env).transfer(&admin, &env.current_contract_address(), &amount);
    }

    pub fn upgrade(env: &Env, new_wasm_hash: BytesN<32>) {
        Self::require_admin(env);
        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    pub fn admin(env: &Env) -> Option<Address> {
        env.storage().instance().get(ADMIN_KEY)
    }

    fn require_admin(env: &Env) {
        let admin = Self::admin(env).expect("admin not set");
        admin.require_auth();
    }
}
