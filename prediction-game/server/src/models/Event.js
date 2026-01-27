import mongoose from 'mongoose';

// Participant schema - users who joined the event
const participantSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  entryFeePaid: {
    type: Number,
    required: true,
  },
  // Transaction signature for entry fee payment
  entryTxSignature: {
    type: String,
  },
});

// Prediction schema - submitted during prediction phase
const predictionSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
  },
  predictedPrice: {
    type: Number,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  // Whether prediction was made in first 25% of prediction phase (bonus eligible)
  isEarlyPrediction: {
    type: Boolean,
    default: false,
  },
  // Time bonus multiplier (1.0 - 1.5 based on when predicted)
  timeBonus: {
    type: Number,
    default: 1.0,
  },
});

const winnerSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
  },
  rank: {
    type: Number,
    required: true,
  },
  prize: {
    type: Number,
    required: true,
  },
  predictedPrice: {
    type: Number,
    required: true,
  },
  accuracy: {
    type: Number, // Percentage error (lower is better)
  },
  timeBonus: {
    type: Number, // The bonus multiplier applied
  },
  finalScore: {
    type: Number, // Combined score used for ranking
  },
});

const eventSchema = new mongoose.Schema({
  // Token information
  token: {
    type: String,
    required: true,
    enum: ['BTC', 'SOL', 'ETH', 'DOGE', 'ADA', 'XRP', 'AVAX', 'DOT'],
  },
  tokenName: {
    type: String,
    required: true,
  },
  tokenIcon: {
    type: String,
    required: true,
  },
  
  // Creator information
  creatorWallet: {
    type: String,
    required: true,
  },
  
  // ==========================================
  // MONEY CONFIGURATION
  // ==========================================
  
  // Initial pool deposited by creator (in SOL)
  creatorDeposit: {
    type: Number,
    required: true,
    min: 0.5, // Minimum 0.5 SOL
  },
  
  // Entry fee per participant (in SOL)
  entryFee: {
    type: Number,
    required: true,
    default: 0.1,
  },
  
  // Distribution percentages of ENTRY FEES (must sum to 100)
  // Entry fees go to Creator and Platform ONLY (not to winners)
  // Winners prize comes from Creator Deposit only
  distribution: {
    creator: { type: Number, default: 70 },       // 70% of entry fees to creator (profit)
    platform: { type: Number, default: 30 },      // 30% of entry fees to platform
  },
  
  // Winner prize split percentages (of the winners' share)
  winnerSplit: {
    first: { type: Number, default: 50 },         // 50% of winners' share
    second: { type: Number, default: 30 },        // 30% of winners' share
    third: { type: Number, default: 20 },         // 20% of winners' share
  },
  
  // Actual calculated payouts (filled when event completes)
  // SYSTEM: 
  //   - Winners Prize = Creator Deposit ONLY (100%)
  //   - Entry Fees = Creator Profit (70%) + Platform Fee (30%)
  payouts: {
    // Entry fees collected from participants
    entryFeesCollected: { type: Number },
    
    // Prize pool = Creator deposit ONLY (entry fees don't go to winners)
    prizePool: { type: Number },              // = creatorDeposit
    firstPrize: { type: Number },
    secondPrize: { type: Number },
    thirdPrize: { type: Number },
    
    // Creator's profit from entry fees (70% of entry fees)
    creatorProfit: { type: Number },
    
    // Platform fee (30% of entry fees)
    platformFee: { type: Number },
    
    // Legacy fields for backward compatibility
    totalPool: { type: Number },
    winnersPool: { type: Number },
    creatorPayout: { type: Number },
    platformPayout: { type: Number },
  },
  
  // Legacy fields for backward compatibility (deprecated)
  rewardPool: { type: Number }, // Use creatorDeposit instead
  platformFee: { type: Number },
  creatorReward: { type: Number },
  prizeDistribution: {
    first: { type: Number },
    second: { type: Number },
    third: { type: Number },
  },
  
  // ==========================================
  // PARTICIPANTS CONFIGURATION
  // ==========================================
  
  minParticipants: {
    type: Number,
    required: true,
    default: 10,
  },
  maxParticipants: {
    type: Number,
    required: true,
    default: 25,
  },
  
  // Participants who joined (paid entry fee)
  participants: [participantSchema],
  
  // Predictions (submitted during prediction phase)
  predictions: [predictionSchema],
  
  // ==========================================
  // PHASE STATUS
  // ==========================================
  
  // joining: Users can join and pay entry fee
  // predicting: All participants submit predictions (hidden until phase ends)
  // waiting: Predictions locked, waiting for resolution time
  // completed: Event resolved, winners determined
  // cancelled: Event cancelled, refunds issued
  status: {
    type: String,
    enum: ['joining', 'predicting', 'waiting', 'completed', 'cancelled'],
    default: 'joining',
  },
  
  // Phase timing configuration
  joiningEndsAt: {
    type: Date,
    required: true,
  },
  
  predictionPhaseDuration: {
    type: Number,
    required: true,
    default: 4, // 4 hours default
  },
  
  predictionStartsAt: { type: Date },
  predictionEndsAt: { type: Date },
  
  waitingPhaseDuration: {
    type: Number,
    required: true,
    default: 24, // 24 hours default
  },
  
  resolutionAt: { type: Date },
  
  // Legacy timing fields
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: { type: Date },
  
  // ==========================================
  // RESULTS
  // ==========================================
  
  finalPrice: { type: Number },
  winners: [winnerSchema],
  predictionsRevealed: {
    type: Boolean,
    default: false,
  },
  
  // Cancellation
  cancellationReason: { type: String },
  
  // Transaction references (Solana)
  creationTxSignature: { type: String },
  resolutionTxSignature: { type: String },
  
}, {
  timestamps: true,
});

// ==========================================
// VIRTUALS
// ==========================================

// Calculate total entry fees collected
eventSchema.virtual('totalPool').get(function() {
  return this.participants.length * this.entryFee;
});

// Calculate payout breakdown dynamically
// SYSTEM FLOW:
// - Winners Prize Pool = Creator Deposit ONLY (100%)
// - Entry Fees = Creator Profit (70%) + Platform Fee (30%)
// Entry fees do NOT go to winners - they only benefit creator and platform
eventSchema.virtual('payoutBreakdown').get(function() {
  const participantCount = this.participants.length;
  const entryFeesCollected = participantCount * this.entryFee;
  
  // Entry fees distribution (ONLY to creator and platform, NOT to winners)
  const creatorProfit = entryFeesCollected * (this.distribution.creator / 100);    // 70%
  const platformFee = entryFeesCollected * (this.distribution.platform / 100);     // 30%
  
  // Prize pool = Creator's deposit ONLY (entry fees don't go to winners)
  const prizePool = this.creatorDeposit;
  
  // Prize distribution among winners (from creator deposit only)
  const firstPrize = prizePool * (this.winnerSplit.first / 100);   // 50%
  const secondPrize = prizePool * (this.winnerSplit.second / 100); // 30%
  const thirdPrize = prizePool * (this.winnerSplit.third / 100);   // 20%
  
  const round = (n) => Math.round(n * 10000) / 10000;
  
  return {
    // Entry fees collected from participants joining
    entryFeesCollected: round(entryFeesCollected),
    
    // Creator's deposit (100% goes to winners as prize)
    creatorDeposit: this.creatorDeposit,
    
    // Prize pool = Creator Deposit ONLY
    prizePool: round(prizePool),
    winnersPool: round(prizePool),                         // Backward compat
    firstPrize: round(firstPrize),
    secondPrize: round(secondPrize),
    thirdPrize: round(thirdPrize),
    
    // Creator's PROFIT from entry fees (70% of entry fees)
    creatorProfit: round(creatorProfit),
    creatorPayout: round(creatorProfit),                   // Backward compat
    
    // Platform fee (30% of entry fees)
    platformFee: round(platformFee),
    platformPayout: round(platformFee),                    // Backward compat
    
    // Legacy field
    totalPool: round(entryFeesCollected),
  };
});

// Projected payout at max participants
// Shows what creator earns and what winners get when event is fully filled
eventSchema.virtual('projectedPayoutAtMax').get(function() {
  const entryFeesCollected = this.maxParticipants * this.entryFee;
  
  // Entry fees distribution (ONLY to creator and platform)
  const creatorProfit = entryFeesCollected * (this.distribution.creator / 100);    // 70%
  const platformFee = entryFeesCollected * (this.distribution.platform / 100);     // 30%
  
  // Prize pool = Creator's deposit ONLY
  const prizePool = this.creatorDeposit;
  
  const round = (n) => Math.round(n * 10000) / 10000;
  
  return {
    entryFeesCollected: round(entryFeesCollected),
    creatorDeposit: this.creatorDeposit,
    prizePool: round(prizePool),
    firstPrize: round(prizePool * (this.winnerSplit.first / 100)),
    secondPrize: round(prizePool * (this.winnerSplit.second / 100)),
    thirdPrize: round(prizePool * (this.winnerSplit.third / 100)),
    creatorProfit: round(creatorProfit),       // Creator's profit (70% of fees)
    creatorPayout: round(creatorProfit),       // Backward compat
    platformFee: round(platformFee),           // Platform fee (30% of fees)
    platformPayout: round(platformFee),        // Backward compat
  };
});

eventSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

eventSchema.virtual('predictionCount').get(function() {
  return this.predictions.length;
});

eventSchema.virtual('isFull').get(function() {
  return this.participants.length >= this.maxParticipants;
});

eventSchema.virtual('hasMinParticipants').get(function() {
  return this.participants.length >= this.minParticipants;
});

eventSchema.virtual('phaseInfo').get(function() {
  const now = new Date();
  
  switch (this.status) {
    case 'joining':
      return {
        phase: 'joining',
        endsAt: this.joiningEndsAt,
        timeRemaining: Math.max(0, this.joiningEndsAt - now),
        spotsRemaining: this.maxParticipants - this.participants.length,
        canJoin: this.participants.length < this.maxParticipants && now < this.joiningEndsAt,
      };
    case 'predicting':
      const earlyBonusEndsAt = new Date(this.predictionStartsAt.getTime() + 
        (this.predictionEndsAt - this.predictionStartsAt) * 0.25);
      return {
        phase: 'predicting',
        startsAt: this.predictionStartsAt,
        endsAt: this.predictionEndsAt,
        timeRemaining: Math.max(0, this.predictionEndsAt - now),
        earlyBonusEndsAt,
        isEarlyBonusPeriod: now < earlyBonusEndsAt,
        canPredict: now >= this.predictionStartsAt && now < this.predictionEndsAt,
      };
    case 'waiting':
      return {
        phase: 'waiting',
        resolutionAt: this.resolutionAt,
        timeRemaining: Math.max(0, this.resolutionAt - now),
      };
    case 'completed':
      return {
        phase: 'completed',
        resolvedAt: this.resolutionAt,
      };
    case 'cancelled':
      return {
        phase: 'cancelled',
        reason: this.cancellationReason,
      };
    default:
      return { phase: this.status };
  }
});

// ==========================================
// METHODS
// ==========================================

// Method to add a participant (join event)
eventSchema.methods.addParticipant = async function(walletAddress, txSignature) {
  if (this.status !== 'joining') {
    throw new Error('Event is not in joining phase');
  }
  
  if (this.participants.length >= this.maxParticipants) {
    throw new Error('Event is full');
  }
  
  if (new Date() > this.joiningEndsAt) {
    throw new Error('Joining period has ended');
  }
  
  const existingParticipant = this.participants.find(p => p.walletAddress === walletAddress);
  if (existingParticipant) {
    throw new Error('You have already joined this event');
  }
  
  this.participants.push({
    walletAddress,
    entryFeePaid: this.entryFee,
    entryTxSignature: txSignature,
  });
  
  // If max participants reached, transition to prediction phase
  if (this.participants.length >= this.maxParticipants) {
    await this.startPredictionPhase();
  }
  
  return this.save();
};

// Method to start prediction phase
eventSchema.methods.startPredictionPhase = async function() {
  if (this.status !== 'joining') {
    throw new Error('Can only start prediction phase from joining phase');
  }
  
  if (this.participants.length < this.minParticipants) {
    throw new Error('Minimum participants not reached');
  }
  
  const now = new Date();
  this.predictionStartsAt = now;
  this.predictionEndsAt = new Date(now.getTime() + this.predictionPhaseDuration * 60 * 60 * 1000);
  this.status = 'predicting';
  
  return this.save();
};

// Method to add a prediction (during prediction phase)
eventSchema.methods.addPrediction = async function(walletAddress, predictedPrice) {
  if (this.status !== 'predicting') {
    throw new Error('Event is not in prediction phase');
  }
  
  const now = new Date();
  
  if (now < this.predictionStartsAt || now > this.predictionEndsAt) {
    throw new Error('Prediction window is not open');
  }
  
  const participant = this.participants.find(p => p.walletAddress === walletAddress);
  if (!participant) {
    throw new Error('You must join the event before making a prediction');
  }
  
  const existingPrediction = this.predictions.find(p => p.walletAddress === walletAddress);
  if (existingPrediction) {
    throw new Error('You have already made a prediction for this event');
  }
  
  // Calculate time bonus based on when prediction is made
  const totalPredictionTime = this.predictionEndsAt - this.predictionStartsAt;
  const timeElapsed = now - this.predictionStartsAt;
  const timePercentage = timeElapsed / totalPredictionTime;
  
  let timeBonus = 1.0;
  let isEarlyPrediction = false;
  
  if (timePercentage <= 0.25) {
    timeBonus = 1.5;
    isEarlyPrediction = true;
  } else if (timePercentage <= 0.5) {
    timeBonus = 1.25;
  } else if (timePercentage <= 0.75) {
    timeBonus = 1.0;
  } else {
    timeBonus = 0.75;
  }
  
  this.predictions.push({
    walletAddress,
    predictedPrice,
    isEarlyPrediction,
    timeBonus,
  });
  
  return this.save();
};

// Method to start waiting phase
eventSchema.methods.startWaitingPhase = async function() {
  if (this.status !== 'predicting') {
    throw new Error('Can only start waiting phase from prediction phase');
  }
  
  const now = new Date();
  this.resolutionAt = new Date(now.getTime() + this.waitingPhaseDuration * 60 * 60 * 1000);
  this.status = 'waiting';
  this.predictionsRevealed = true;
  this.endDate = this.resolutionAt;
  
  return this.save();
};

// Method to resolve event and determine winners
// SYSTEM: Winners get Creator Deposit | Creator & Platform get Entry Fees
eventSchema.methods.resolveEvent = async function(finalPrice, txSignature) {
  if (this.status !== 'waiting') {
    throw new Error('Event must be in waiting phase to resolve');
  }
  
  this.finalPrice = finalPrice;
  
  // Calculate the actual payout amounts
  const payout = this.payoutBreakdown;
  
  // Store final payout amounts
  this.payouts = {
    // Entry fees collected
    entryFeesCollected: payout.entryFeesCollected,
    totalPool: payout.entryFeesCollected,
    
    // Prize pool = Creator Deposit ONLY
    prizePool: payout.prizePool,
    winnersPool: payout.prizePool,
    firstPrize: payout.firstPrize,
    secondPrize: payout.secondPrize,
    thirdPrize: payout.thirdPrize,
    
    // Creator profit (70% of entry fees)
    creatorProfit: payout.creatorProfit,
    creatorPayout: payout.creatorProfit,
    
    // Platform fee (30% of entry fees)
    platformFee: payout.platformFee,
    platformPayout: payout.platformFee,
  };
  
  // Calculate scores for all predictions
  const scoredPredictions = this.predictions.map(p => {
    const percentageError = Math.abs(p.predictedPrice - finalPrice) / finalPrice * 100;
    const accuracyScore = Math.max(0, 100 - percentageError);
    const finalScore = accuracyScore * p.timeBonus;
    
    return {
      walletAddress: p.walletAddress,
      predictedPrice: p.predictedPrice,
      timeBonus: p.timeBonus,
      percentageError,
      finalScore,
    };
  });
  
  // Sort by final score (highest first)
  scoredPredictions.sort((a, b) => b.finalScore - a.finalScore);
  
  // Assign prizes to top 3 (from creator deposit only)
  const prizes = [payout.firstPrize, payout.secondPrize, payout.thirdPrize];
  
  this.winners = scoredPredictions.slice(0, 3).map((p, index) => ({
    walletAddress: p.walletAddress,
    rank: index + 1,
    prize: prizes[index] || 0,
    predictedPrice: p.predictedPrice,
    accuracy: p.percentageError,
    timeBonus: p.timeBonus,
    finalScore: p.finalScore,
  }));
  
  this.status = 'completed';
  this.resolutionTxSignature = txSignature;
  
  return this.save();
};

// Method to cancel event
eventSchema.methods.cancelEvent = async function(reason, walletAddress) {
  if (this.creatorWallet !== walletAddress) {
    throw new Error('Only the creator can cancel this event');
  }
  
  if (this.status !== 'joining' && this.predictions.length > 0) {
    throw new Error('Cannot cancel event after predictions have been made');
  }
  
  this.status = 'cancelled';
  this.cancellationReason = reason || 'Cancelled by creator';
  
  return this.save();
};

// Get refund info for cancelled event
eventSchema.methods.getRefundInfo = function() {
  if (this.status !== 'cancelled') {
    return null;
  }
  
  return {
    creatorRefund: this.creatorDeposit,
    participantRefunds: this.participants.map(p => ({
      walletAddress: p.walletAddress,
      amount: p.entryFeePaid,
    })),
  };
};

// Static method to check and transition events based on time
eventSchema.statics.processPhaseTransitions = async function() {
  const now = new Date();
  
  const joiningEvents = await this.find({
    status: 'joining',
    joiningEndsAt: { $lte: now },
  });
  
  for (const event of joiningEvents) {
    if (event.participants.length >= event.minParticipants) {
      await event.startPredictionPhase();
    } else {
      event.status = 'cancelled';
      event.cancellationReason = 'Minimum participants not reached';
      await event.save();
    }
  }
  
  const predictingEvents = await this.find({
    status: 'predicting',
    predictionEndsAt: { $lte: now },
  });
  
  for (const event of predictingEvents) {
    await event.startWaitingPhase();
  }
  
  return {
    transitionedFromJoining: joiningEvents.length,
    transitionedFromPredicting: predictingEvents.length,
  };
};

// Ensure virtuals are included in JSON
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

// Indexes
eventSchema.index({ status: 1, joiningEndsAt: -1 });
eventSchema.index({ status: 1, predictionEndsAt: -1 });
eventSchema.index({ status: 1, resolutionAt: -1 });
eventSchema.index({ creatorWallet: 1 });
eventSchema.index({ 'participants.walletAddress': 1 });
eventSchema.index({ 'predictions.walletAddress': 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
