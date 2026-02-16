use anchor_lang::prelude::*;

#[error_code]
pub enum StakingError {
    #[msg("Pool is already initialized")]
    AlreadyInitialized,
    #[msg("Pool is not initialized")]
    NotInitialized,
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Invalid mint")]
    InvalidMint,
    #[msg("Insufficient staked amount")]
    InsufficientStakedAmount,
    #[msg("Invalid amount (must be greater than 0)")]
    InvalidAmount,
    #[msg("Overflow in reward calculation")]
    RewardCalculationOverflow,
    #[msg("Insufficient reward vault balance")]
    InsufficientRewardBalance,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("No rewards to claim")]
    NothingToClaim,
    #[msg("Invalid period (0=1m, 1=3m, 2=1y)")]
    InvalidPeriod,
    #[msg("Stake is still locked")]
    StakeLocked,
}
