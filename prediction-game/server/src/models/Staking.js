import mongoose from 'mongoose';

// Staking tier configuration
export const STAKING_TIERS = {
  FREE: {
    name: 'Free',
    minStake: 0,
    dailyEvents: 0,
    lockDays: 0,
    creationFee: 5000, // SYRA tokens burned per event
    color: 'gray',
    emoji: '📊',
  },
  BRONZE: {
    name: 'Bronze',
    minStake: 10_000,
    dailyEvents: 1,
    lockDays: 1,
    creationFee: 1000,
    color: 'orange',
    emoji: '🥉',
  },
  SILVER: {
    name: 'Silver',
    minStake: 100_000,
    dailyEvents: 3,
    lockDays: 3,
    creationFee: 500,
    color: 'gray',
    emoji: '🥈',
  },
  GOLD: {
    name: 'Gold',
    minStake: 1_000_000,
    dailyEvents: 5,
    lockDays: 5,
    creationFee: 100,
    color: 'yellow',
    emoji: '🥇',
  },
  DIAMOND: {
    name: 'Diamond',
    minStake: 10_000_000,
    dailyEvents: 10,
    lockDays: 7,
    creationFee: 0, // Free for Diamond
    color: 'cyan',
    emoji: '💎',
  },
};

const stakingSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  
  // Staked amount
  stakedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  
  // Current tier based on staked amount
  tier: {
    type: String,
    enum: ['FREE', 'BRONZE', 'SILVER', 'GOLD', 'DIAMOND'],
    default: 'FREE',
  },
  
  // When the stake was made/updated
  stakedAt: {
    type: Date,
    default: null,
  },
  
  // When the stake can be unstaked (lock period)
  unlocksAt: {
    type: Date,
    default: null,
  },
  
  // Staking history
  stakingHistory: [{
    action: {
      type: String,
      enum: ['stake', 'unstake', 'tier_change'],
    },
    amount: Number,
    previousAmount: Number,
    previousTier: String,
    newTier: String,
    txSignature: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Daily event tracking
  eventsCreatedToday: {
    type: Number,
    default: 0,
  },
  lastEventCreatedAt: {
    type: Date,
    default: null,
  },
  
  // Total stats
  totalEventsCreated: {
    type: Number,
    default: 0,
  },
  totalStakingRewards: {
    type: Number,
    default: 0,
  },
  
  // Penalties (for bad behavior)
  penalties: [{
    reason: String,
    amount: Number, // SYRA slashed
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  totalSlashed: {
    type: Number,
    default: 0,
  },
  
}, {
  timestamps: true,
});

// Calculate tier based on staked amount
stakingSchema.methods.calculateTier = function() {
  const amount = this.stakedAmount;
  
  if (amount >= STAKING_TIERS.DIAMOND.minStake) return 'DIAMOND';
  if (amount >= STAKING_TIERS.GOLD.minStake) return 'GOLD';
  if (amount >= STAKING_TIERS.SILVER.minStake) return 'SILVER';
  if (amount >= STAKING_TIERS.BRONZE.minStake) return 'BRONZE';
  return 'FREE';
};

// Get tier info
stakingSchema.methods.getTierInfo = function() {
  return STAKING_TIERS[this.tier];
};

// Check if can create event
stakingSchema.methods.canCreateEvent = function() {
  const tierInfo = this.getTierInfo();
  
  // Free tier cannot create events
  if (this.tier === 'FREE') {
    return {
      canCreate: false,
      reason: 'You need to stake SYRA tokens to create events',
      dailyLimit: 0,
      eventsCreatedToday: this.eventsCreatedToday,
      remainingToday: 0,
    };
  }
  
  // Reset daily count if it's a new day
  const now = new Date();
  const lastCreated = this.lastEventCreatedAt;
  
  if (lastCreated) {
    const lastCreatedDate = new Date(lastCreated);
    const isNewDay = now.toDateString() !== lastCreatedDate.toDateString();
    
    if (isNewDay) {
      // Will be reset when checked
      this.eventsCreatedToday = 0;
    }
  }
  
  const remainingToday = Math.max(0, tierInfo.dailyEvents - this.eventsCreatedToday);
  
  return {
    canCreate: remainingToday > 0,
    reason: remainingToday > 0 ? null : 'Daily event limit reached for your tier',
    dailyLimit: tierInfo.dailyEvents,
    eventsCreatedToday: this.eventsCreatedToday,
    remainingToday,
    creationFee: tierInfo.creationFee,
  };
};

// Check if can unstake
stakingSchema.methods.canUnstake = function() {
  if (this.stakedAmount <= 0) {
    return { canUnstake: false, reason: 'No staked tokens' };
  }
  
  if (!this.unlocksAt) {
    return { canUnstake: true, reason: null };
  }
  
  const now = new Date();
  if (now < this.unlocksAt) {
    return {
      canUnstake: false,
      reason: `Tokens locked until ${this.unlocksAt.toISOString()}`,
      unlocksAt: this.unlocksAt,
      timeRemaining: this.unlocksAt.getTime() - now.getTime(),
    };
  }
  
  return { canUnstake: true, reason: null };
};

// Stake tokens
stakingSchema.methods.stake = async function(amount, txSignature) {
  const previousAmount = this.stakedAmount;
  const previousTier = this.tier;
  
  this.stakedAmount += amount;
  this.tier = this.calculateTier();
  this.stakedAt = new Date();
  
  // Calculate lock period based on new tier
  const tierInfo = STAKING_TIERS[this.tier];
  const lockDays = tierInfo.lockDays;
  this.unlocksAt = new Date(Date.now() + lockDays * 24 * 60 * 60 * 1000);
  
  this.stakingHistory.push({
    action: 'stake',
    amount,
    previousAmount,
    previousTier,
    newTier: this.tier,
    txSignature,
    timestamp: new Date(),
  });
  
  // Add tier change if changed
  if (previousTier !== this.tier) {
    this.stakingHistory.push({
      action: 'tier_change',
      amount: this.stakedAmount,
      previousAmount,
      previousTier,
      newTier: this.tier,
      timestamp: new Date(),
    });
  }
  
  await this.save();
  return this;
};

// Unstake tokens
stakingSchema.methods.unstake = async function(amount, txSignature) {
  const canUnstakeResult = this.canUnstake();
  if (!canUnstakeResult.canUnstake) {
    throw new Error(canUnstakeResult.reason);
  }
  
  if (amount > this.stakedAmount) {
    throw new Error('Cannot unstake more than staked amount');
  }
  
  const previousAmount = this.stakedAmount;
  const previousTier = this.tier;
  
  this.stakedAmount -= amount;
  this.tier = this.calculateTier();
  
  // Update unlock time if still staking
  if (this.stakedAmount > 0) {
    const tierInfo = STAKING_TIERS[this.tier];
    this.unlocksAt = new Date(Date.now() + tierInfo.lockDays * 24 * 60 * 60 * 1000);
  } else {
    this.unlocksAt = null;
    this.stakedAt = null;
  }
  
  this.stakingHistory.push({
    action: 'unstake',
    amount,
    previousAmount,
    previousTier,
    newTier: this.tier,
    txSignature,
    timestamp: new Date(),
  });
  
  await this.save();
  return this;
};

// Record event creation
stakingSchema.methods.recordEventCreation = async function() {
  const now = new Date();
  const lastCreated = this.lastEventCreatedAt;
  
  // Reset if new day
  if (lastCreated) {
    const lastCreatedDate = new Date(lastCreated);
    const isNewDay = now.toDateString() !== lastCreatedDate.toDateString();
    
    if (isNewDay) {
      this.eventsCreatedToday = 0;
    }
  }
  
  this.eventsCreatedToday += 1;
  this.totalEventsCreated += 1;
  this.lastEventCreatedAt = now;
  
  await this.save();
  return this;
};

// Apply penalty (slash stake)
stakingSchema.methods.applyPenalty = async function(amount, reason, eventId = null) {
  const slashAmount = Math.min(amount, this.stakedAmount);
  
  if (slashAmount > 0) {
    this.stakedAmount -= slashAmount;
    this.tier = this.calculateTier();
    this.totalSlashed += slashAmount;
    
    this.penalties.push({
      reason,
      amount: slashAmount,
      eventId,
      timestamp: new Date(),
    });
    
    await this.save();
  }
  
  return { slashedAmount: slashAmount, newStakedAmount: this.stakedAmount, newTier: this.tier };
};

// Static method to get or create staking record
stakingSchema.statics.getOrCreate = async function(walletAddress) {
  let staking = await this.findOne({ walletAddress });
  
  if (!staking) {
    staking = new this({ walletAddress });
    await staking.save();
  }
  
  return staking;
};

// Static method to get staking stats
stakingSchema.statics.getStats = async function() {
  const result = await this.aggregate([
    {
      $group: {
        _id: null,
        totalStakers: { $sum: 1 },
        totalStaked: { $sum: '$stakedAmount' },
        totalSlashed: { $sum: '$totalSlashed' },
        avgStaked: { $avg: '$stakedAmount' },
      },
    },
  ]);
  
  const tierCounts = await this.aggregate([
    {
      $group: {
        _id: '$tier',
        count: { $sum: 1 },
        totalStaked: { $sum: '$stakedAmount' },
      },
    },
  ]);
  
  return {
    ...(result[0] || { totalStakers: 0, totalStaked: 0, totalSlashed: 0, avgStaked: 0 }),
    tierDistribution: tierCounts.reduce((acc, t) => {
      acc[t._id] = { count: t.count, totalStaked: t.totalStaked };
      return acc;
    }, {}),
  };
};

const Staking = mongoose.model('Staking', stakingSchema);

export default Staking;
