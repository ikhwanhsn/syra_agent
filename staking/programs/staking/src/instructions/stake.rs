// use anchor_lang::prelude::*;
// use anchor_spl::token::{self, Token, TokenAccount, Transfer};

// use crate::error::StakingError;
// use crate::state::{GlobalPool, UserStakeInfo, POOL_SEED, ACCUMULATED_REWARD_PER_SHARE_PRECISION};

// #[derive(Accounts)]
// pub struct Stake<'info> {
//     #[account(
//         mut,
//         seeds = [POOL_SEED],
//         bump = global_pool.bump,
//         constraint = global_pool.is_initialized @ StakingError::NotInitialized
//     )]
//     pub global_pool: Account<'info, GlobalPool>,

//     #[account(
//         init_if_needed,
//         payer = owner,
//         space = UserStakeInfo::LEN,
//         seeds = [POOL_SEED, owner.key().as_ref()],
//         bump
//     )]
//     pub user_stake_info: Account<'info, UserStakeInfo>,

//     #[account(mut)]
//     pub owner: Signer<'info>,

//     #[account(
//         mut,
//         constraint = user_staking_token_account.mint == global_pool.staking_mint @ StakingError::InvalidMint,
//         constraint = user_staking_token_account.owner == owner.key()
//     )]
//     pub user_staking_token_account: Account<'info, TokenAccount>,

//     #[account(
//         mut,
//         constraint = staking_vault.key() == anchor_spl::associated_token::get_associated_token_address(
//             &global_pool.key(),
//             &global_pool.staking_mint
//         )
//     )]
//     pub staking_vault: Account<'info, TokenAccount>,

//     pub token_program: Program<'info, Token>,
//     pub system_program: Program<'info, System>,
// }

// pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
//     require!(amount > 0, StakingError::InvalidAmount);

//     let global_pool = &mut ctx.accounts.global_pool;
//     let user_stake_info = &mut ctx.accounts.user_stake_info;
//     let clock = Clock::get()?;

//     // Update pool rewards first
//     update_pool(global_pool, clock.unix_timestamp)?;

//     // Initialize user stake info if needed
//     if user_stake_info.owner == Pubkey::default() {
//         user_stake_info.owner = ctx.accounts.owner.key();
//         user_stake_info.amount = 0;
//         user_stake_info.reward_debt = 0;
//     }

//     // Calculate and settle any pending rewards before staking more
//     if user_stake_info.amount > 0 {
//         let pending_reward = calculate_pending_reward(
//             user_stake_info.amount,
//             global_pool.accumulated_reward_per_share,
//             user_stake_info.reward_debt,
//         )?;
        
//         if pending_reward > 0 {
//             msg!("Pending rewards auto-added to debt: {}", pending_reward);
//         }
//     }

//     // Transfer tokens from user to vault
//     let cpi_accounts = Transfer {
//         from: ctx.accounts.user_staking_token_account.to_account_info(),
//         to: ctx.accounts.staking_vault.to_account_info(),
//         authority: ctx.accounts.owner.to_account_info(),
//     };
//     let cpi_program = ctx.accounts.token_program.to_account_info();
//     let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
//     token::transfer(cpi_ctx, amount)?;

//     // Update user stake
//     user_stake_info.amount = user_stake_info
//         .amount
//         .checked_add(amount)
//         .ok_or(StakingError::MathOverflow)?;

//     // Update reward debt
//     let new_reward_debt = (user_stake_info.amount as u128)
//         .checked_mul(global_pool.accumulated_reward_per_share)
//         .ok_or(StakingError::MathOverflow)?
//         .checked_div(ACCUMULATED_REWARD_PER_SHARE_PRECISION)
//         .ok_or(StakingError::MathOverflow)?;
//     user_stake_info.reward_debt = new_reward_debt;

//     // Update global pool total
//     global_pool.total_staked = global_pool
//         .total_staked
//         .checked_add(amount)
//         .ok_or(StakingError::MathOverflow)?;

//     msg!(
//         "User staked {} tokens. Total staked: {}, User amount: {}",
//         amount,
//         global_pool.total_staked,
//         user_stake_info.amount
//     );

//     Ok(())
// }

// /// Update pool's accumulated reward per share based on time elapsed
// pub fn update_pool(pool: &mut GlobalPool, current_time: i64) -> Result<()> {
//     if pool.total_staked == 0 {
//         pool.last_reward_time = current_time;
//         return Ok(());
//     }

//     if current_time <= pool.last_reward_time {
//         return Ok(());
//     }

//     let time_elapsed = (current_time - pool.last_reward_time) as u64;
//     let reward = (pool.reward_per_second as u128)
//         .checked_mul(time_elapsed as u128)
//         .ok_or(StakingError::RewardCalculationOverflow)?;

//     let reward_per_share_increase = reward
//         .checked_mul(ACCUMULATED_REWARD_PER_SHARE_PRECISION)
//         .ok_or(StakingError::RewardCalculationOverflow)?
//         .checked_div(pool.total_staked as u128)
//         .ok_or(StakingError::RewardCalculationOverflow)?;

//     pool.accumulated_reward_per_share = pool
//         .accumulated_reward_per_share
//         .checked_add(reward_per_share_increase)
//         .ok_or(StakingError::RewardCalculationOverflow)?;

//     pool.last_reward_time = current_time;

//     msg!(
//         "Pool updated. Time elapsed: {}s, Reward per share increase: {}",
//         time_elapsed,
//         reward_per_share_increase
//     );

//     Ok(())
// }

// /// Calculate pending reward for a user
// pub fn calculate_pending_reward(
//     user_amount: u64,
//     accumulated_reward_per_share: u128,
//     reward_debt: u128,
// ) -> Result<u128> {
//     let acc_reward = (user_amount as u128)
//         .checked_mul(accumulated_reward_per_share)
//         .ok_or(StakingError::MathOverflow)?
//         .checked_div(ACCUMULATED_REWARD_PER_SHARE_PRECISION)
//         .ok_or(StakingError::MathOverflow)?;

//     let pending = acc_reward.checked_sub(reward_debt).unwrap_or(0);

//     Ok(pending)
// }

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::error::StakingError;
use crate::state::{GlobalPool, UserStakeInfo, POOL_SEED, ACCUMULATED_REWARD_PER_SHARE_PRECISION};

#[derive(Accounts)]
pub struct Stake<'info> {
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
        seeds = [POOL_SEED, owner.key().as_ref()],
        bump
    )]
    pub user_stake_info: Account<'info, UserStakeInfo>,

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
    pub system_program: Program<'info, System>,
}

impl<'info> Stake<'info> {
    pub fn exec(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakingError::InvalidAmount);

        let global_pool = &mut ctx.accounts.global_pool;
        let user_stake_info = &mut ctx.accounts.user_stake_info;
        let clock = Clock::get()?;

        // 1. Update pool rewards first
        update_pool(global_pool, clock.unix_timestamp)?;

        // 2. Initialize user stake info if needed (for init_if_needed)
        if user_stake_info.owner == Pubkey::default() {
            user_stake_info.owner = ctx.accounts.owner.key();
            user_stake_info.amount = 0;
            user_stake_info.reward_debt = 0;
            // Best Practice: store the bump if your state struct has a bump field
            // user_stake_info.bump = ctx.bumps.user_stake_info; 
        }

        // 3. Settle pending rewards (Logic check: ensure reward_debt is updated)
        if user_stake_info.amount > 0 {
            let _pending_reward = calculate_pending_reward(
                user_stake_info.amount,
                global_pool.accumulated_reward_per_share,
                user_stake_info.reward_debt,
            )?;
            // Note: In a real production app for S3Labs, you'd likely mint/transfer 
            // these rewards to the user here before increasing the stake.
        }

        // 4. Transfer tokens from user to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_staking_token_account.to_account_info(),
            to: ctx.accounts.staking_vault.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // 5. Update user state
        user_stake_info.amount = user_stake_info
            .amount
            .checked_add(amount)
            .ok_or(StakingError::MathOverflow)?;

        // 6. Update reward debt: (amount * acc_reward) / precision
        let new_reward_debt = (user_stake_info.amount as u128)
            .checked_mul(global_pool.accumulated_reward_per_share)
            .ok_or(StakingError::MathOverflow)?
            .checked_div(ACCUMULATED_REWARD_PER_SHARE_PRECISION)
            .ok_or(StakingError::MathOverflow)?;
        user_stake_info.reward_debt = new_reward_debt;

        // 7. Update global pool total
        global_pool.total_staked = global_pool
            .total_staked
            .checked_add(amount)
            .ok_or(StakingError::MathOverflow)?;

        msg!("Stake successful. User Amount: {}", user_stake_info.amount);
        Ok(())
    }
}

// Helper functions kept outside the impl for internal use
pub fn update_pool(pool: &mut GlobalPool, current_time: i64) -> Result<()> {
    if pool.total_staked == 0 {
        pool.last_reward_time = current_time;
        return Ok(());
    }
    if current_time <= pool.last_reward_time {
        return Ok(());
    }

    let time_elapsed = (current_time - pool.last_reward_time) as u64;
    let reward = (pool.reward_per_second as u128)
        .checked_mul(time_elapsed as u128)
        .ok_or(StakingError::RewardCalculationOverflow)?;

    let reward_per_share_increase = reward
        .checked_mul(ACCUMULATED_REWARD_PER_SHARE_PRECISION)
        .ok_or(StakingError::RewardCalculationOverflow)?
        .checked_div(pool.total_staked as u128)
        .ok_or(StakingError::RewardCalculationOverflow)?;

    pool.accumulated_reward_per_share = pool
        .accumulated_reward_per_share
        .checked_add(reward_per_share_increase)
        .ok_or(StakingError::RewardCalculationOverflow)?;

    pool.last_reward_time = current_time;
    Ok(())
}

pub fn calculate_pending_reward(
    user_amount: u64,
    accumulated_reward_per_share: u128,
    reward_debt: u128,
) -> Result<u128> {
    let acc_reward = (user_amount as u128)
        .checked_mul(accumulated_reward_per_share)
        .ok_or(StakingError::MathOverflow)?
        .checked_div(ACCUMULATED_REWARD_PER_SHARE_PRECISION)
        .ok_or(StakingError::MathOverflow)?;

    Ok(acc_reward.checked_sub(reward_debt).unwrap_or(0))
}