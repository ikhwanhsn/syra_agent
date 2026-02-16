use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("w446ABrZadQZonJhfM6JxdBNrK2azPT328trf7EQnAc");

#[program]
pub mod staking {
    use super::*;

    /// Initialize the global staking pool
    pub fn initialize(ctx: Context<Initialize>, reward_per_second: u64) -> Result<()> {
        instructions::initialize(ctx, reward_per_second)
    }

    /// Stake tokens into the pool (period: 0=1m, 1=3m, 2=1y). position_index must equal counter.next_index for that period.
    pub fn stake(ctx: Context<Stake>, amount: u64, period: u8, position_index: u32) -> Result<()> {
        instructions::stake(ctx, amount, period, position_index)
    }

    /// Unstake tokens from the pool (period: 0=1m, 1=3m, 2=1y)
    pub fn unstake(ctx: Context<Unstake>, amount: u64, period: u8) -> Result<()> {
        instructions::unstake(ctx, amount, period)
    }

    /// Claim pending rewards
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        instructions::claim(ctx)
    }
}
