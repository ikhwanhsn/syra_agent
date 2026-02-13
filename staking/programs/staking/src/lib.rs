use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod staking {
    use super::*;

    /// Initialize the global staking pool
    pub fn initialize(ctx: Context<Initialize>, reward_per_second: u64) -> Result<()> {
        instructions::initialize(ctx, reward_per_second)
    }

    /// Stake tokens into the pool
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        instructions::stake(ctx, amount)
    }

    /// Unstake tokens from the pool
    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        instructions::unstake(ctx, amount)
    }

    /// Claim pending rewards
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        instructions::claim(ctx)
    }
}
