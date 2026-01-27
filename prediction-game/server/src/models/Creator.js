import mongoose from 'mongoose';

// Creator profile schema for tracking reputation and stats
const creatorSchema = new mongoose.Schema({
  // Wallet address is the unique identifier
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  
  // ==========================================
  // BASIC STATS
  // ==========================================
  
  // Total events created
  totalEventsCreated: {
    type: Number,
    default: 0,
  },
  
  // Events that completed successfully
  eventsCompleted: {
    type: Number,
    default: 0,
  },
  
  // Events that were cancelled
  eventsCancelled: {
    type: Number,
    default: 0,
  },
  
  // Events currently active (joining, predicting, waiting)
  eventsActive: {
    type: Number,
    default: 0,
  },
  
  // ==========================================
  // PARTICIPANT STATS
  // ==========================================
  
  // Total unique participants across all events
  totalParticipants: {
    type: Number,
    default: 0,
  },
  
  // Average participants per completed event
  averageParticipants: {
    type: Number,
    default: 0,
  },
  
  // Total predictions received across all events
  totalPredictions: {
    type: Number,
    default: 0,
  },
  
  // ==========================================
  // FINANCIAL STATS
  // ==========================================
  
  // Total SOL deposited as creator (seed money)
  totalDeposited: {
    type: Number,
    default: 0,
  },
  
  // Total fee revenue earned (25% of entry fees)
  totalFeeRevenueEarned: {
    type: Number,
    default: 0,
  },
  
  // Total entry fees collected from participants
  totalEntryFeesCollected: {
    type: Number,
    default: 0,
  },
  
  // Total prize pools generated (deposits + fees to winners)
  totalPrizePoolsGenerated: {
    type: Number,
    default: 0,
  },
  
  // ==========================================
  // REPUTATION METRICS
  // ==========================================
  
  // Completion rate (completed / (completed + cancelled))
  completionRate: {
    type: Number,
    default: 100, // Starts at 100%
    min: 0,
    max: 100,
  },
  
  // Fill rate - average percentage of max participants reached
  averageFillRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  
  // Reputation score (0-100 based on multiple factors)
  reputationScore: {
    type: Number,
    default: 50, // Start neutral
    min: 0,
    max: 100,
  },
  
  // Reputation tier based on score
  reputationTier: {
    type: String,
    enum: ['newcomer', 'bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'newcomer',
  },
  
  // ==========================================
  // STREAK & ACHIEVEMENTS
  // ==========================================
  
  // Current streak of completed events (no cancellations)
  currentStreak: {
    type: Number,
    default: 0,
  },
  
  // Best streak ever
  bestStreak: {
    type: Number,
    default: 0,
  },
  
  // Achievements unlocked
  achievements: [{
    type: String,
    enum: [
      'first_event',           // Created first event
      'first_completion',      // First event completed
      'ten_events',            // Created 10 events
      'fifty_events',          // Created 50 events
      'hundred_events',        // Created 100 events
      'hundred_participants',  // 100 total participants
      'thousand_participants', // 1000 total participants
      'perfect_fill',          // 100% fill rate on an event
      'streak_5',              // 5 completed events in a row
      'streak_10',             // 10 completed events in a row
      'streak_25',             // 25 completed events in a row
      'high_reputation',       // Reached 80+ reputation
      'diamond_creator',       // Reached diamond tier
      'whale_event',           // Created event with 10+ SOL deposit
      'popular_creator',       // Average 90%+ fill rate
    ],
  }],
  
  // ==========================================
  // TIER BENEFITS
  // ==========================================
  
  // Reduced platform fee percentage (earned through reputation)
  platformFeeDiscount: {
    type: Number,
    default: 0, // 0% discount by default
    min: 0,
    max: 50, // Max 50% discount (5% instead of 10%)
  },
  
  // Bonus creator fee percentage
  creatorFeeBonus: {
    type: Number,
    default: 0, // 0% bonus by default
    min: 0,
    max: 10, // Max +10% bonus (35% instead of 25%)
  },
  
  // Featured status (appears on homepage)
  isFeatured: {
    type: Boolean,
    default: false,
  },
  
  // Verified creator status
  isVerified: {
    type: Boolean,
    default: false,
  },
  
  // ==========================================
  // SOCIAL
  // ==========================================
  
  // Number of followers
  followersCount: {
    type: Number,
    default: 0,
  },
  
  // Profile customization
  displayName: {
    type: String,
    maxlength: 50,
  },
  
  bio: {
    type: String,
    maxlength: 250,
  },
  
  avatarUrl: {
    type: String,
  },
  
  // Social links
  socialLinks: {
    twitter: { type: String },
    discord: { type: String },
    telegram: { type: String },
  },
  
  // ==========================================
  // DATES
  // ==========================================
  
  firstEventAt: {
    type: Date,
  },
  
  lastEventAt: {
    type: Date,
  },
  
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
  
}, {
  timestamps: true,
});

// ==========================================
// VIRTUALS
// ==========================================

// Calculate effective creator fee (base 70% + bonus)
creatorSchema.virtual('effectiveCreatorFee').get(function() {
  return Math.min(90, 70 + this.creatorFeeBonus);  // Max 90%
});

// Calculate effective platform fee (base 30% - discount)
creatorSchema.virtual('effectivePlatformFee').get(function() {
  return Math.max(10, 30 - (30 * this.platformFeeDiscount / 100));  // Min 10%
});

// Check if creator can create events today (tier-based)
creatorSchema.virtual('dailyEventLimit').get(function() {
  switch (this.reputationTier) {
    case 'diamond': return 15;
    case 'platinum': return 12;
    case 'gold': return 10;
    case 'silver': return 7;
    case 'bronze': return 5;
    default: return 3;
  }
});

// ==========================================
// METHODS
// ==========================================

// Update stats when an event is created
creatorSchema.methods.onEventCreated = async function(eventData) {
  this.totalEventsCreated += 1;
  this.eventsActive += 1;
  this.totalDeposited += eventData.creatorDeposit || 0;
  this.lastEventAt = new Date();
  this.lastActiveAt = new Date();
  
  if (!this.firstEventAt) {
    this.firstEventAt = new Date();
    this.addAchievement('first_event');
  }
  
  // Check event count achievements
  if (this.totalEventsCreated >= 10) this.addAchievement('ten_events');
  if (this.totalEventsCreated >= 50) this.addAchievement('fifty_events');
  if (this.totalEventsCreated >= 100) this.addAchievement('hundred_events');
  
  // Check whale event achievement
  if (eventData.creatorDeposit >= 10) this.addAchievement('whale_event');
  
  return this.save();
};

// Update stats when an event is completed
creatorSchema.methods.onEventCompleted = async function(eventData) {
  this.eventsCompleted += 1;
  this.eventsActive = Math.max(0, this.eventsActive - 1);
  this.currentStreak += 1;
  
  if (this.currentStreak > this.bestStreak) {
    this.bestStreak = this.currentStreak;
  }
  
  // Update participant stats
  const participantCount = eventData.participants?.length || 0;
  const maxParticipants = eventData.maxParticipants || 25;
  this.totalParticipants += participantCount;
  this.totalPredictions += eventData.predictions?.length || 0;
  
  // Update financial stats
  // Entry fees go to creator (70%) and platform (30%) - NOT to winners
  // Winners prize comes from creator deposit only
  const entryFeesCollected = participantCount * (eventData.entryFee || 0);
  this.totalEntryFeesCollected += entryFeesCollected;
  this.totalFeeRevenueEarned += entryFeesCollected * 0.70; // 70% creator profit from entry fees
  this.totalPrizePoolsGenerated += (eventData.creatorDeposit || 0); // Prize pool = deposit only
  
  // Update averages
  if (this.eventsCompleted > 0) {
    this.averageParticipants = Math.round(this.totalParticipants / this.eventsCompleted * 10) / 10;
  }
  
  // Update fill rate
  const fillRate = (participantCount / maxParticipants) * 100;
  this.averageFillRate = Math.round(
    ((this.averageFillRate * (this.eventsCompleted - 1)) + fillRate) / this.eventsCompleted * 10
  ) / 10;
  
  // Check achievements
  if (!this.achievements.includes('first_completion')) {
    this.addAchievement('first_completion');
  }
  
  if (this.totalParticipants >= 100) this.addAchievement('hundred_participants');
  if (this.totalParticipants >= 1000) this.addAchievement('thousand_participants');
  if (fillRate >= 100) this.addAchievement('perfect_fill');
  if (this.currentStreak >= 5) this.addAchievement('streak_5');
  if (this.currentStreak >= 10) this.addAchievement('streak_10');
  if (this.currentStreak >= 25) this.addAchievement('streak_25');
  if (this.averageFillRate >= 90) this.addAchievement('popular_creator');
  
  // Recalculate reputation
  this.updateReputation();
  this.lastActiveAt = new Date();
  
  return this.save();
};

// Update stats when an event is cancelled
creatorSchema.methods.onEventCancelled = async function() {
  this.eventsCancelled += 1;
  this.eventsActive = Math.max(0, this.eventsActive - 1);
  this.currentStreak = 0; // Reset streak on cancellation
  
  // Recalculate completion rate and reputation
  this.updateReputation();
  this.lastActiveAt = new Date();
  
  return this.save();
};

// Add achievement if not already earned
creatorSchema.methods.addAchievement = function(achievement) {
  if (!this.achievements.includes(achievement)) {
    this.achievements.push(achievement);
  }
};

// Recalculate reputation score and tier
creatorSchema.methods.updateReputation = function() {
  const totalFinished = this.eventsCompleted + this.eventsCancelled;
  
  // Calculate completion rate
  if (totalFinished > 0) {
    this.completionRate = Math.round((this.eventsCompleted / totalFinished) * 100 * 10) / 10;
  }
  
  // Calculate reputation score (weighted factors)
  let score = 50; // Base score
  
  // Completion rate factor (up to +30 points)
  score += (this.completionRate - 50) * 0.6;
  
  // Fill rate factor (up to +15 points)
  score += (this.averageFillRate - 50) * 0.3;
  
  // Volume factor (up to +10 points based on events created)
  const volumeBonus = Math.min(10, this.eventsCompleted * 0.5);
  score += volumeBonus;
  
  // Streak bonus (up to +5 points)
  score += Math.min(5, this.currentStreak * 0.5);
  
  // Achievement bonus
  score += Math.min(10, this.achievements.length);
  
  // Clamp score
  this.reputationScore = Math.round(Math.max(0, Math.min(100, score)));
  
  // Determine tier (Base: 70% creator, 30% platform)
  if (this.reputationScore >= 95) {
    this.reputationTier = 'diamond';
    this.platformFeeDiscount = 50; // 30% → 15% platform fee
    this.creatorFeeBonus = 15;     // 70% → 85% creator fee
    this.addAchievement('diamond_creator');
  } else if (this.reputationScore >= 85) {
    this.reputationTier = 'platinum';
    this.platformFeeDiscount = 40; // 30% → 18% platform fee
    this.creatorFeeBonus = 12;     // 70% → 82% creator fee
  } else if (this.reputationScore >= 75) {
    this.reputationTier = 'gold';
    this.platformFeeDiscount = 27; // 30% → 22% platform fee
    this.creatorFeeBonus = 8;      // 70% → 78% creator fee
  } else if (this.reputationScore >= 60) {
    this.reputationTier = 'silver';
    this.platformFeeDiscount = 17; // 30% → 25% platform fee
    this.creatorFeeBonus = 5;      // 70% → 75% creator fee
  } else if (this.reputationScore >= 40) {
    this.reputationTier = 'bronze';
    this.platformFeeDiscount = 7;  // 30% → 28% platform fee
    this.creatorFeeBonus = 2;      // 70% → 72% creator fee
  } else {
    this.reputationTier = 'newcomer';
    this.platformFeeDiscount = 0;  // 30% platform fee
    this.creatorFeeBonus = 0;      // 70% creator fee
  }
  
  // Check high reputation achievement
  if (this.reputationScore >= 80) {
    this.addAchievement('high_reputation');
  }
};

// ==========================================
// STATICS
// ==========================================

// Get or create a creator profile
creatorSchema.statics.getOrCreate = async function(walletAddress) {
  let creator = await this.findOne({ walletAddress });
  
  if (!creator) {
    creator = new this({ walletAddress });
    await creator.save();
  }
  
  return creator;
};

// Get top creators by reputation
creatorSchema.statics.getTopCreators = async function(limit = 10) {
  return this.find({ eventsCompleted: { $gt: 0 } })
    .sort({ reputationScore: -1, totalEventsCreated: -1 })
    .limit(limit);
};

// Get featured creators
creatorSchema.statics.getFeaturedCreators = async function(limit = 5) {
  return this.find({ isFeatured: true, eventsCompleted: { $gt: 0 } })
    .sort({ reputationScore: -1 })
    .limit(limit);
};

// ==========================================
// INDEXES
// ==========================================

creatorSchema.index({ reputationScore: -1 });
creatorSchema.index({ totalEventsCreated: -1 });
creatorSchema.index({ eventsCompleted: -1 });
creatorSchema.index({ totalFeeRevenueEarned: -1 });
creatorSchema.index({ reputationTier: 1, reputationScore: -1 });
creatorSchema.index({ isFeatured: 1, reputationScore: -1 });

// Ensure virtuals are included in JSON
creatorSchema.set('toJSON', { virtuals: true });
creatorSchema.set('toObject', { virtuals: true });

const Creator = mongoose.model('Creator', creatorSchema);

export default Creator;
