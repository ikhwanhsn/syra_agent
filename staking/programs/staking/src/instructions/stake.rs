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
use crate::state::{
    GlobalPool, PositionCounter, StakePosition, UserStakeInfo, Period, POOL_SEED, COUNTER_SEED,
    POSITION_SEED, ACCUMULATED_REWARD_PER_SHARE_PRECISION,
    PERIOD_SECS_1_MONTH, PERIOD_SECS_1_YEAR, PERIOD_SECS_3_MONTHS,
    get_stake_position_pda,
};

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

    #[account(
        init_if_needed,
        payer = owner,
        space = PositionCounter::LEN,
        seeds = [POOL_SEED, COUNTER_SEED, owner.key().as_ref(), &[0]],
        bump
    )]
    pub position_counter_1m: Account<'info, PositionCounter>,

    #[account(
        init_if_needed,
        payer = owner,
        space = PositionCounter::LEN,
        seeds = [POOL_SEED, COUNTER_SEED, owner.key().as_ref(), &[1]],
        bump
    )]
    pub position_counter_3m: Account<'info, PositionCounter>,

    #[account(
        init_if_needed,
        payer = owner,
        space = PositionCounter::LEN,
        seeds = [POOL_SEED, COUNTER_SEED, owner.key().as_ref(), &[2]],
        bump
    )]
    pub position_counter_1y: Account<'info, PositionCounter>,

    /// CHECK: PDA for the new stake position; validated in instruction via get_stake_position_pda(owner, period, position_index). Program creates the account and writes StakePosition data manually.
    #[account(mut)]
    pub stake_position: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

fn period_duration_secs(period: Period) -> Result<i64> {
    match period {
        0 => Ok(PERIOD_SECS_1_MONTH),
        1 => Ok(PERIOD_SECS_3_MONTHS),
        2 => Ok(PERIOD_SECS_1_YEAR),
        _ => Err(StakingError::InvalidPeriod.into()),
    }
}

/// Entrypoint for stake instruction (called from lib.rs).
pub fn stake(ctx: Context<Stake>, amount: u64, period: Period, position_index: u32) -> Result<()> {
    Stake::exec(ctx, amount, period, position_index)
}

impl<'info> Stake<'info> {
    pub fn exec(ctx: Context<Stake>, amount: u64, period: Period, position_index: u32) -> Result<()> {
        require!(amount > 0, StakingError::InvalidAmount);
        require!(period <= 2, StakingError::InvalidPeriod);
        let period_secs = period_duration_secs(period)?;

        let global_pool = &mut ctx.accounts.global_pool;
        let clock = Clock::get()?;
        let owner = ctx.accounts.owner.key();

        // Get counter for this period and validate position_index
        let position_counter = match period {
            0 => &ctx.accounts.position_counter_1m,
            1 => &ctx.accounts.position_counter_3m,
            _ => &ctx.accounts.position_counter_1y,
        };
        let next_idx = position_counter.next_index;
        require!(
            position_index == next_idx,
            StakingError::InvalidAmount
        );

        let (position_pda, position_bump) =
            get_stake_position_pda(ctx.program_id, &owner, period, position_index);
        require!(
            ctx.accounts.stake_position.key() == position_pda,
            StakingError::InvalidAmount
        );

        // Create the position account (PDA)
        let rent = anchor_lang::solana_program::rent::Rent::get()?;
        let lamports = rent.minimum_balance(StakePosition::LEN);
        let create_ix = anchor_lang::solana_program::system_instruction::create_account(
            &ctx.accounts.owner.key(),
            &position_pda,
            lamports,
            StakePosition::LEN as u64,
            ctx.program_id,
        );
        let signer_seeds: &[&[&[u8]]] = &[&[
            POOL_SEED,
            POSITION_SEED,
            owner.as_ref(),
            &[period],
            &position_index.to_le_bytes(),
            &[position_bump],
        ]];
        anchor_lang::solana_program::program::invoke_signed(
            &create_ix,
            &[
                ctx.accounts.owner.to_account_info(),
                ctx.accounts.stake_position.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer_seeds,
        )?;

        let unlock_at = clock.unix_timestamp + period_secs;
        let position_data = StakePosition {
            owner,
            period,
            index: position_index,
            amount,
            unlock_at,
        };
        let mut data = ctx.accounts.stake_position.try_borrow_mut_data()?;
        position_data.try_serialize(&mut *data)?;

        // Increment counter for next stake in this period
        match period {
            0 => ctx.accounts.position_counter_1m.next_index = next_idx + 1,
            1 => ctx.accounts.position_counter_3m.next_index = next_idx + 1,
            _ => ctx.accounts.position_counter_1y.next_index = next_idx + 1,
        }

        // 1. Update pool rewards first
        update_pool(global_pool, clock.unix_timestamp)?;

        // Ensure all 3 period accounts exist (init_if_needed by Anchor; set defaults if new)
        Self::init_user_if_needed(&mut ctx.accounts.user_stake_info_1m, owner);
        Self::init_user_if_needed(&mut ctx.accounts.user_stake_info_3m, owner);
        Self::init_user_if_needed(&mut ctx.accounts.user_stake_info_1y, owner);

        let (user_stake_info, pending_reward) = match period {
            0 => {
                let info = &mut ctx.accounts.user_stake_info_1m;
                Self::init_user_if_needed(info, owner);
                let pending = if info.amount > 0 {
                    calculate_pending_reward(
                        info.amount,
                        global_pool.accumulated_reward_per_share,
                        info.reward_debt,
                    )?
                } else {
                    0u128
                };
                let unlock_at = if info.amount == 0 {
                    clock.unix_timestamp + period_secs
                } else {
                    let new_unlock = clock.unix_timestamp + period_secs;
                    if new_unlock > info.unlock_at {
                        new_unlock
                    } else {
                        info.unlock_at
                    }
                };
                info.unlock_at = unlock_at;
                (info, pending)
            }
            1 => {
                let info = &mut ctx.accounts.user_stake_info_3m;
                Self::init_user_if_needed(info, owner);
                let pending = if info.amount > 0 {
                    calculate_pending_reward(
                        info.amount,
                        global_pool.accumulated_reward_per_share,
                        info.reward_debt,
                    )?
                } else {
                    0u128
                };
                let unlock_at = if info.amount == 0 {
                    clock.unix_timestamp + period_secs
                } else {
                    let new_unlock = clock.unix_timestamp + period_secs;
                    if new_unlock > info.unlock_at {
                        new_unlock
                    } else {
                        info.unlock_at
                    }
                };
                info.unlock_at = unlock_at;
                (info, pending)
            }
            _ => {
                let info = &mut ctx.accounts.user_stake_info_1y;
                Self::init_user_if_needed(info, owner);
                let pending = if info.amount > 0 {
                    calculate_pending_reward(
                        info.amount,
                        global_pool.accumulated_reward_per_share,
                        info.reward_debt,
                    )?
                } else {
                    0u128
                };
                let unlock_at = if info.amount == 0 {
                    clock.unix_timestamp + period_secs
                } else {
                    let new_unlock = clock.unix_timestamp + period_secs;
                    if new_unlock > info.unlock_at {
                        new_unlock
                    } else {
                        info.unlock_at
                    }
                };
                info.unlock_at = unlock_at;
                (info, pending)
            }
        };

        // 2. Transfer tokens from user to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_staking_token_account.to_account_info(),
            to: ctx.accounts.staking_vault.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // 3. Update user state
        user_stake_info.amount = user_stake_info
            .amount
            .checked_add(amount)
            .ok_or(StakingError::MathOverflow)?;

        // 4. Update reward debt so pending is preserved for later claim
        let acc_reward_for_amount = (user_stake_info.amount as u128)
            .checked_mul(global_pool.accumulated_reward_per_share)
            .ok_or(StakingError::MathOverflow)?
            .checked_div(ACCUMULATED_REWARD_PER_SHARE_PRECISION)
            .ok_or(StakingError::MathOverflow)?;
        user_stake_info.reward_debt = acc_reward_for_amount
            .checked_sub(pending_reward)
            .ok_or(StakingError::MathOverflow)?;

        // 5. Update global pool total
        global_pool.total_staked = global_pool
            .total_staked
            .checked_add(amount)
            .ok_or(StakingError::MathOverflow)?;

        msg!(
            "Stake successful. Period: {}, User Amount: {}, Unlock at: {}",
            period,
            user_stake_info.amount,
            user_stake_info.unlock_at
        );
        Ok(())
    }

    fn init_user_if_needed(info: &mut UserStakeInfo, owner: Pubkey) {
        if info.owner == Pubkey::default() {
            info.owner = owner;
            info.amount = 0;
            info.reward_debt = 0;
            info.unlock_at = 0;
        }
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