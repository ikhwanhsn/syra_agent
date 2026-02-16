use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::error::StakingError;
use crate::state::{GlobalPool, UserStakeInfo, POOL_SEED, ACCUMULATED_REWARD_PER_SHARE_PRECISION, UNCLAIMED_REWARD_FLAG};
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
        init_if_needed,
        payer = owner,
        space = UserStakeInfo::LEN,
        seeds = [POOL_SEED, owner.key().as_ref(), &[0]],
        bump
    )]
    pub user_stake_info_1m: Account<'info, UserStakeInfo>,

    #[account(
        init_if_needed,
        payer = owner,
        space = UserStakeInfo::LEN,
        seeds = [POOL_SEED, owner.key().as_ref(), &[1]],
        bump
    )]
    pub user_stake_info_3m: Account<'info, UserStakeInfo>,

    #[account(
        init_if_needed,
        payer = owner,
        space = UserStakeInfo::LEN,
        seeds = [POOL_SEED, owner.key().as_ref(), &[2]],
        bump
    )]
    pub user_stake_info_1y: Account<'info, UserStakeInfo>,

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
    pub system_program: Program<'info, System>,
}

/// Pending reward for one period: from active stake or from stored unclaimed (after full unstake).
fn pending_for_period(
    amount: u64,
    accumulated_reward_per_share: u128,
    reward_debt: u128,
) -> Result<u128> {
    if amount > 0 {
        calculate_pending_reward(amount, accumulated_reward_per_share, reward_debt)
    } else if reward_debt & UNCLAIMED_REWARD_FLAG != 0 {
        Ok(reward_debt & (UNCLAIMED_REWARD_FLAG - 1))
    } else {
        Ok(0)
    }
}

pub fn claim(ctx: Context<Claim>) -> Result<()> {
    let global_pool = &mut ctx.accounts.global_pool;
    let clock = Clock::get()?;

    update_pool(global_pool, clock.unix_timestamp)?;

    let pending_1m = pending_for_period(
        ctx.accounts.user_stake_info_1m.amount,
        global_pool.accumulated_reward_per_share,
        ctx.accounts.user_stake_info_1m.reward_debt,
    )?;
    let pending_3m = pending_for_period(
        ctx.accounts.user_stake_info_3m.amount,
        global_pool.accumulated_reward_per_share,
        ctx.accounts.user_stake_info_3m.reward_debt,
    )?;
    let pending_1y = pending_for_period(
        ctx.accounts.user_stake_info_1y.amount,
        global_pool.accumulated_reward_per_share,
        ctx.accounts.user_stake_info_1y.reward_debt,
    )?;

    let total_pending = pending_1m
        .checked_add(pending_3m)
        .ok_or(StakingError::MathOverflow)?
        .checked_add(pending_1y)
        .ok_or(StakingError::MathOverflow)?;

    require!(total_pending > 0, StakingError::NothingToClaim);

    let reward_to_claim = u64::try_from(total_pending)
        .map_err(|_| StakingError::RewardCalculationOverflow)?;

    require!(
        ctx.accounts.reward_vault.amount >= reward_to_claim,
        StakingError::InsufficientRewardBalance
    );

    // Update reward debt for each period (and clear unclaimed flag if amount == 0)
    let acc = global_pool.accumulated_reward_per_share;
    let prec = ACCUMULATED_REWARD_PER_SHARE_PRECISION;

    let new_debt_1m = if ctx.accounts.user_stake_info_1m.amount == 0 {
        0u128
    } else {
        (ctx.accounts.user_stake_info_1m.amount as u128)
            .checked_mul(acc)
            .ok_or(StakingError::MathOverflow)?
            .checked_div(prec)
            .ok_or(StakingError::MathOverflow)?
    };
    ctx.accounts.user_stake_info_1m.reward_debt = new_debt_1m;

    let new_debt_3m = if ctx.accounts.user_stake_info_3m.amount == 0 {
        0u128
    } else {
        (ctx.accounts.user_stake_info_3m.amount as u128)
            .checked_mul(acc)
            .ok_or(StakingError::MathOverflow)?
            .checked_div(prec)
            .ok_or(StakingError::MathOverflow)?
    };
    ctx.accounts.user_stake_info_3m.reward_debt = new_debt_3m;

    let new_debt_1y = if ctx.accounts.user_stake_info_1y.amount == 0 {
        0u128
    } else {
        (ctx.accounts.user_stake_info_1y.amount as u128)
            .checked_mul(acc)
            .ok_or(StakingError::MathOverflow)?
            .checked_div(prec)
            .ok_or(StakingError::MathOverflow)?
    };
    ctx.accounts.user_stake_info_1y.reward_debt = new_debt_1y;

    let seeds = &[POOL_SEED, &[global_pool.bump]];
    let signer = &[&seeds[..]];
    let cpi_accounts = Transfer {
        from: ctx.accounts.reward_vault.to_account_info(),
        to: ctx.accounts.user_reward_token_account.to_account_info(),
        authority: global_pool.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer,
    );
    token::transfer(cpi_ctx, reward_to_claim)?;

    msg!("User claimed {} reward tokens", reward_to_claim);
    Ok(())
}
