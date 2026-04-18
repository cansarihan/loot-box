/// 1 XLM = 10_000_000 stroops
pub const fn to_stroops(num: u64) -> i128 {
    (num as i128) * 10_000_000
}

// ── Production: hardcoded per-network XLM SAC address ────────────────────────
#[cfg(not(test))]
pub fn token_client(env: &soroban_sdk::Env) -> soroban_sdk::token::TokenClient<'_> {
    // Testnet XLM SAC — change to mainnet address for production:
    // Mainnet: CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA
    let xlm_address = soroban_sdk::Address::from_str(
        env,
        "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
    );
    soroban_sdk::token::TokenClient::new(env, &xlm_address)
}

#[cfg(not(test))]
pub fn register(_env: &soroban_sdk::Env, _admin: &soroban_sdk::Address) {
    // No-op on real networks — XLM already exists
}

// ── Test helpers ──────────────────────────────────────────────────────────────
#[cfg(test)]
const XLM_KEY: &soroban_sdk::Symbol = &soroban_sdk::symbol_short!("XLM");

#[cfg(test)]
pub fn contract_id(env: &soroban_sdk::Env) -> soroban_sdk::Address {
    env.storage()
        .instance()
        .get::<_, soroban_sdk::Address>(XLM_KEY)
        .expect("XLM not initialized in test")
}

#[cfg(test)]
pub fn register(env: &soroban_sdk::Env, admin: &soroban_sdk::Address) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    env.storage().instance().set(XLM_KEY, &sac.address());
    soroban_sdk::token::StellarAssetClient::new(env, &sac.address())
        .mint(admin, &to_stroops(10_000));
}

#[cfg(test)]
pub fn token_client(env: &soroban_sdk::Env) -> soroban_sdk::token::TokenClient<'_> {
    soroban_sdk::token::TokenClient::new(env, &contract_id(env))
}
