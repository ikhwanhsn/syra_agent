use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;

use crate::error::StakingError;
use crate::state::{GlobalPool, POOL_SEED};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = GlobalPool::LEN,
        seeds = [POOL_SEED],
        bump
    )]
    pub global_pool: Account<'info, GlobalPool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub staking_mint: Account<'info, Mint>,
    pub reward_mint: Account<'info, Mint>,

    /// Staking vault (ATA owned by pool PDA)
    #[account(
        init,
        payer = authority,
        associated_token::mint = staking_mint,
        associated_token::authority = global_pool
    )]
    pub staking_vault: Account<'info, TokenAccount>,

    /// Reward vault (ATA owned by pool PDA)
    #[account(
        init,
        payer = authority,
        associated_token::mint = reward_mint,
        associated_token::authority = global_pool
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn initialize(ctx: Context<Initialize>, reward_per_second: u64) -> Result<()> {
    let global_pool = &mut ctx.accounts.global_pool;

    require!(!global_pool.is_initialized, StakingError::AlreadyInitialized);
    require!(reward_per_second > 0, StakingError::InvalidAmount);

    let clock = Clock::get()?;

    global_pool.authority = ctx.accounts.authority.key();
    global_pool.staking_mint = ctx.accounts.staking_mint.key();
    global_pool.reward_mint = ctx.accounts.reward_mint.key();
    global_pool.total_staked = 0;
    global_pool.reward_per_second = reward_per_second;
    global_pool.accumulated_reward_per_share = 0;
    global_pool.last_reward_time = clock.unix_timestamp;
    global_pool.bump = ctx.bumps.global_pool;
    global_pool.is_initialized = true;

    msg!("Pool initialized with reward_per_second: {}", reward_per_second);

    Ok(())
}
