use anchor_lang::prelude::*;

/// Global pool state
#[account]
pub struct GlobalPool {
    /// Authority that can update pool parameters
    pub authority: Pubkey,
    /// Token mint for staking
    pub staking_mint: Pubkey,
    /// Token mint for rewards
    pub reward_mint: Pubkey,
    /// Total amount staked in the pool
    pub total_staked: u64,
    /// Reward tokens emitted per second (in smallest units)
    pub reward_per_second: u64,
    /// Accumulated reward per share, scaled by 1e12
    pub accumulated_reward_per_share: u128,
    /// Last time rewards were calculated
    pub last_reward_time: i64,
    /// Bump seed for PDA
    pub bump: u8,
    /// Pool initialization flag
    pub is_initialized: bool,
}

impl GlobalPool {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // staking_mint
        32 + // reward_mint
        8 + // total_staked
        8 + // reward_per_second
        16 + // accumulated_reward_per_share (u128)
        8 + // last_reward_time
        1 + // bump
        1; // is_initialized
}

/// Staking period: 0 = 1 minute, 1 = 1 hour, 2 = 1 day
pub type Period = u8;

/// User stake information (per period). PDA: [POOL_SEED, owner, period]
/// Tracks aggregate amount and reward debt for the period (sum of all positions).
#[account]
#[derive(Default)]
pub struct UserStakeInfo {
    /// Owner of the stake
    pub owner: Pubkey,
    /// Total amount staked by the user in this period (sum of all positions)
    pub amount: u64,
    /// Reward debt (used to calculate pending rewards)
    pub reward_debt: u128,
    /// Latest unlock time among positions (for backward compat / display)
    pub unlock_at: i64,
}

impl UserStakeInfo {
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        8 + // amount
        16 + // reward_debt (u128)
        8; // unlock_at (i64)
}

/// Counter for next position index per (owner, period). PDA: [POOL_SEED, COUNTER_SEED, owner, period]
#[account]
#[derive(Default)]
pub struct PositionCounter {
    pub next_index: u32,
}

impl PositionCounter {
    pub const LEN: usize = 8 + 4; // discriminator + next_index
}

/// A single stake position (one per stake tx). PDA: [POOL_SEED, POSITION_SEED, owner, period, index]
#[account]
pub struct StakePosition {
    pub owner: Pubkey,
    pub period: Period,
    pub index: u32,
    pub amount: u64,
    pub unlock_at: i64,
}

impl StakePosition {
    pub const LEN: usize = 8 + 32 + 1 + 4 + 8 + 8; // discriminator, owner, period, index, amount, unlock_at
}

/// PDA for position counter: [POOL_SEED, COUNTER_SEED, owner, period]
pub fn get_position_counter_pda(
    program_id: &Pubkey,
    owner: &Pubkey,
    period: Period,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[POOL_SEED, COUNTER_SEED, owner.as_ref(), &[period]],
        program_id,
    )
}

/// PDA for a stake position: [POOL_SEED, POSITION_SEED, owner, period, index_le_bytes]
pub fn get_stake_position_pda(
    program_id: &Pubkey,
    owner: &Pubkey,
    period: Period,
    index: u32,
) -> (Pubkey, u8) {
    let index_bytes = index.to_le_bytes();
    let seed_refs: &[&[u8]] = &[
        POOL_SEED,
        POSITION_SEED,
        owner.as_ref(),
        &[period],
        &index_bytes,
    ];
    Pubkey::find_program_address(seed_refs, program_id)
}

/// Constants
pub const ACCUMULATED_REWARD_PER_SHARE_PRECISION: u128 = 1_000_000_000_000; // 1e12
/// When amount == 0, reward_debt can store unclaimed reward: high bit set, lower bits = token amount.
pub const UNCLAIMED_REWARD_FLAG: u128 = 1u128 << 127;
pub const POOL_SEED: &[u8] = b"pool";
pub const POSITION_SEED: &[u8] = b"position";
pub const COUNTER_SEED: &[u8] = b"counter";

/// Period duration in seconds. Same on devnet and mainnet: 1 minute, 1 hour, 1 day.
pub const PERIOD_SECS_1_MONTH: i64 = 60; // 1 minute
pub const PERIOD_SECS_3_MONTHS: i64 = 60 * 60; // 1 hour
pub const PERIOD_SECS_1_YEAR: i64 = 24 * 60 * 60; // 1 day
