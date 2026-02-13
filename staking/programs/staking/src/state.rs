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

/// User stake information
#[account]
pub struct UserStakeInfo {
    /// Owner of the stake
    pub owner: Pubkey,
    /// Amount staked by the user
    pub amount: u64,
    /// Reward debt (used to calculate pending rewards)
    pub reward_debt: u128,
}

impl UserStakeInfo {
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        8 + // amount
        16; // reward_debt (u128)
}

/// Constants
pub const ACCUMULATED_REWARD_PER_SHARE_PRECISION: u128 = 1_000_000_000_000; // 1e12
pub const POOL_SEED: &[u8] = b"pool";
