use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::error::StakingError;
use crate::state::{GlobalPool, UserStakeInfo, Period, POOL_SEED, ACCUMULATED_REWARD_PER_SHARE_PRECISION, UNCLAIMED_REWARD_FLAG};
use crate::instructions::stake::{update_pool, calculate_pending_reward};

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        mut,
        seeds = [POOL_SEED],
        bump = global_pool.bump,
        constraint = global_pool.is_initialized @ StakingError::NotInitialized
    )]
    pub global_pool: Box<Account<'info, GlobalPool>>,

    #[account(
        mut,
        seeds = [POOL_SEED, owner.key().as_ref(), &[0]],
        bump,
        constraint = user_stake_info_1m.owner == owner.key() @ StakingError::InvalidAuthority
    )]
    pub user_stake_info_1m: Box<Account<'info, UserStakeInfo>>,

    #[account(
        mut,
        seeds = [POOL_SEED, owner.key().as_ref(), &[1]],
        bump,
        constraint = user_stake_info_3m.owner == owner.key() @ StakingError::InvalidAuthority
    )]
    pub user_stake_info_3m: Box<Account<'info, UserStakeInfo>>,

    #[account(
        mut,
        seeds = [POOL_SEED, owner.key().as_ref(), &[2]],
        bump,
        constraint = user_stake_info_1y.owner == owner.key() @ StakingError::InvalidAuthority
    )]
    pub user_stake_info_1y: Box<Account<'info, UserStakeInfo>>,

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = user_staking_token_account.mint == global_pool.staking_mint @ StakingError::InvalidMint,
        constraint = user_staking_token_account.owner == owner.key()
    )]
    pub user_staking_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = staking_vault.key() == anchor_spl::associated_token::get_associated_token_address(
            &global_pool.key(),
            &global_pool.staking_mint
        )
    )]
    pub staking_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[inline(never)]
pub fn unstake(ctx: Context<Unstake>, amount: u64, period: Period) -> Result<()> {
    require!(amount > 0, StakingError::InvalidAmount);
    require!(period <= 2, StakingError::InvalidPeriod);

    // Capture before mutable borrow so we can use in CPI signer
    let pool_account_info = ctx.accounts.global_pool.to_account_info();
    let pool_bump = ctx.accounts.global_pool.bump;

    let global_pool = &mut **ctx.accounts.global_pool;
    let clock = Clock::get()?;

    let user_stake_info: &mut UserStakeInfo = match period {
        0 => &mut **ctx.accounts.user_stake_info_1m,
        1 => &mut **ctx.accounts.user_stake_info_3m,
        _ => &mut **ctx.accounts.user_stake_info_1y,
    };

    require!(
        clock.unix_timestamp >= user_stake_info.unlock_at,
        StakingError::StakeLocked
    );
    require!(
        user_stake_info.amount >= amount,
        StakingError::InsufficientStakedAmount
    );

    // Update pool rewards first
    update_pool(global_pool, clock.unix_timestamp)?;

    let pending_reward = calculate_pending_reward(
        user_stake_info.amount,
        global_pool.accumulated_reward_per_share,
        user_stake_info.reward_debt,
    )?;

    // Update user stake
    user_stake_info.amount = user_stake_info
        .amount
        .checked_sub(amount)
        .ok_or(StakingError::MathOverflow)?;

    if user_stake_info.amount == 0 && pending_reward > 0 {
        // Store pending reward for later manual claim (high bit of reward_debt = unclaimed flag).
        let reward_to_claim_later = u64::try_from(pending_reward)
            .map_err(|_| StakingError::RewardCalculationOverflow)?;
        user_stake_info.reward_debt = UNCLAIMED_REWARD_FLAG | (reward_to_claim_later as u128);
        msg!("Stored {} pending rewards for later claim (use Claim Reward button)", reward_to_claim_later);
    } else {
        // Partial unstake: set reward_debt so remaining stake has correct accumulated share (no subtraction to avoid underflow).
        let new_reward_debt = (user_stake_info.amount as u128)
            .checked_mul(global_pool.accumulated_reward_per_share)
            .ok_or(StakingError::MathOverflow)?
            .checked_div(ACCUMULATED_REWARD_PER_SHARE_PRECISION)
            .ok_or(StakingError::MathOverflow)?;
        user_stake_info.reward_debt = new_reward_debt;
    }

    global_pool.total_staked = global_pool
        .total_staked
        .checked_sub(amount)
        .ok_or(StakingError::MathOverflow)?;

    let seeds = &[POOL_SEED, &[pool_bump]];
    let signer = &[&seeds[..]];
    let cpi_accounts = Transfer {
        from: ctx.accounts.staking_vault.to_account_info(),
        to: ctx.accounts.user_staking_token_account.to_account_info(),
        authority: pool_account_info,
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    token::transfer(cpi_ctx, amount)?;

    msg!(
        "User unstaked {} tokens (period {}). Total staked: {}, User amount: {}",
        amount,
        period,
        global_pool.total_staked,
        user_stake_info.amount
    );

    Ok(())
}
