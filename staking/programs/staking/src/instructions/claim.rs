use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::error::StakingError;
use crate::state::{GlobalPool, UserStakeInfo, POOL_SEED, ACCUMULATED_REWARD_PER_SHARE_PRECISION};
use crate::instructions::stake::{update_pool, calculate_pending_reward};

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(
        mut,
        seeds = [POOL_SEED],
        bump = global_pool.bump,
        constraint = global_pool.is_initialized @ StakingError::NotInitialized
    )]
    pub global_pool: Account<'info, GlobalPool>,

    #[account(
        mut,
        seeds = [POOL_SEED, owner.key().as_ref()],
        bump,
        constraint = user_stake_info.owner == owner.key() @ StakingError::InvalidAuthority
    )]
    pub user_stake_info: Account<'info, UserStakeInfo>,

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = reward_vault.key() == anchor_spl::associated_token::get_associated_token_address(
            &global_pool.key(),
            &global_pool.reward_mint
        )
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_reward_token_account.mint == global_pool.reward_mint @ StakingError::InvalidMint,
        constraint = user_reward_token_account.owner == owner.key()
    )]
    pub user_reward_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn claim(ctx: Context<Claim>) -> Result<()> {
    let global_pool = &mut ctx.accounts.global_pool;
    let user_stake_info = &mut ctx.accounts.user_stake_info;
    let clock = Clock::get()?;

    // Update pool rewards first
    update_pool(global_pool, clock.unix_timestamp)?;

    // Calculate pending rewards
    let pending_reward = calculate_pending_reward(
        user_stake_info.amount,
        global_pool.accumulated_reward_per_share,
        user_stake_info.reward_debt,
    )?;

    require!(pending_reward > 0, StakingError::InvalidAmount);

    // Convert u128 to u64 for transfer (ensure it fits)
    let reward_to_claim = u64::try_from(pending_reward)
        .map_err(|_| StakingError::RewardCalculationOverflow)?;

    // Check reward vault has enough balance
    require!(
        ctx.accounts.reward_vault.amount >= reward_to_claim,
        StakingError::InsufficientRewardBalance
    );

    // Update user reward debt to current accumulated rewards
    let new_reward_debt = (user_stake_info.amount as u128)
        .checked_mul(global_pool.accumulated_reward_per_share)
        .ok_or(StakingError::MathOverflow)?
        .checked_div(ACCUMULATED_REWARD_PER_SHARE_PRECISION)
        .ok_or(StakingError::MathOverflow)?;
    user_stake_info.reward_debt = new_reward_debt;

    // Transfer reward tokens from vault to user (using PDA signer)
    let seeds = &[POOL_SEED, &[global_pool.bump]];
    let signer = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.reward_vault.to_account_info(),
        to: ctx.accounts.user_reward_token_account.to_account_info(),
        authority: global_pool.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    token::transfer(cpi_ctx, reward_to_claim)?;

    msg!(
        "User claimed {} reward tokens. Reward debt updated to: {}",
        reward_to_claim,
        new_reward_debt
    );

    Ok(())
}
