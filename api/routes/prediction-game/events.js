import express from 'express';
import PredictionEvent from '../../models/prediction-game/Event.js';
import PredictionCreator from '../../models/prediction-game/Creator.js';

const router = express.Router();

// Token data for reference
const tokenData = {
  BTC: { name: 'Bitcoin', icon: '₿' },
  SOL: { name: 'Solana', icon: '◎' },
  ETH: { name: 'Ethereum', icon: 'Ξ' },
  DOGE: { name: 'Dogecoin', icon: 'Ð' },
  ADA: { name: 'Cardano', icon: '₳' },
  XRP: { name: 'Ripple', icon: '✕' },
  AVAX: { name: 'Avalanche', icon: '🔺' },
  DOT: { name: 'Polkadot', icon: '●' },
};

// Default distribution percentages for ENTRY FEES
// Winners prize comes from Creator Deposit ONLY (not from entry fees)
// Entry fees go to Creator and Platform ONLY
const DEFAULT_DISTRIBUTION = {
  creator: 70,   // 70% of entry fees to creator (profit)
  platform: 30,  // 30% of entry fees to platform
};

const DEFAULT_WINNER_SPLIT = {
  first: 50,     // 50% of winners' share
  second: 30,    // 30% of winners' share
  third: 20,     // 20% of winners' share
};

// GET /api/prediction-game/events - Get all events with filtering
router.get('/', async (req, res) => {
  try {
    const { status, token, creator, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) {
      const statuses = status.split(',');
      if (statuses.length > 1) {
        query.status = { $in: statuses };
      } else {
        query.status = status;
      }
    }
    if (token) query.token = token;
    if (creator) query.creatorWallet = creator;
    
    const events = await PredictionEvent.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await PredictionEvent.countDocuments(query);
    
    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/prediction-game/events/stats - Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const totalEvents = await PredictionEvent.countDocuments();
    const joiningEvents = await PredictionEvent.countDocuments({ status: 'joining' });
    const predictingEvents = await PredictionEvent.countDocuments({ status: 'predicting' });
    const waitingEvents = await PredictionEvent.countDocuments({ status: 'waiting' });
    const completedEvents = await PredictionEvent.countDocuments({ status: 'completed' });
    
    // Calculate totals from completed events
    const completedAggregation = await PredictionEvent.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: { $size: '$participants' } },
          totalPredictions: { $sum: { $size: '$predictions' } },
          totalPoolDistributed: { $sum: '$payouts.totalPool' },
          totalWinnersPaid: { $sum: { $add: ['$payouts.firstPrize', '$payouts.secondPrize', '$payouts.thirdPrize'] } },
          totalCreatorPaid: { $sum: '$payouts.creatorPayout' },
          totalPlatformEarned: { $sum: '$payouts.platformPayout' },
        },
      },
    ]);
    
    // Calculate from all events for participant count
    const allAggregation = await PredictionEvent.aggregate([
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: { $size: '$participants' } },
          totalPredictions: { $sum: { $size: '$predictions' } },
          totalCreatorDeposits: { $sum: '$creatorDeposit' },
        },
      },
    ]);
    
    const completed = completedAggregation[0] || {};
    const all = allAggregation[0] || {};
    
    res.json({
      totalEvents,
      activeEvents: joiningEvents + predictingEvents + waitingEvents,
      joiningEvents,
      predictingEvents,
      waitingEvents,
      completedEvents,
      totalParticipants: all.totalParticipants || 0,
      totalPredictions: all.totalPredictions || 0,
      totalPoolDistributed: completed.totalPoolDistributed || 0,
      totalWinnersPaid: completed.totalWinnersPaid || 0,
      totalCreatorPaid: completed.totalCreatorPaid || 0,
      totalPlatformEarned: completed.totalPlatformEarned || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/prediction-game/events/process-transitions - Process phase transitions
router.post('/process-transitions', async (req, res) => {
  try {
    const result = await PredictionEvent.processPhaseTransitions();
    res.json({
      message: 'Phase transitions processed',
      ...result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/prediction-game/events/:id - Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await PredictionEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check and process phase transition if needed
    const now = new Date();
    
    if (event.status === 'joining' && now > event.joiningEndsAt) {
      if (event.participants.length >= event.minParticipants) {
        await event.startPredictionPhase();
      } else {
        event.status = 'cancelled';
        event.cancellationReason = 'Minimum participants not reached';
        await event.save();
      }
    } else if (event.status === 'predicting' && now > event.predictionEndsAt) {
      await event.startWaitingPhase();
    }
    
    // Hide predictions if not revealed yet
    const eventObj = event.toObject();
    if (!event.predictionsRevealed && event.status === 'predicting') {
      eventObj.predictions = eventObj.predictions.map(p => ({
        walletAddress: p.walletAddress,
        submittedAt: p.submittedAt,
        isEarlyPrediction: p.isEarlyPrediction,
        // predictedPrice is hidden
      }));
    }
    
    res.json(eventObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/prediction-game/events - Create new event
router.post('/', async (req, res) => {
  try {
    const {
      token,
      creatorWallet,
      creatorDeposit,
      joiningDuration = 48,
      predictionPhaseDuration = 4,
      waitingPhaseDuration = 24,
      entryFee = 0.1,
      minParticipants = 10,
      maxParticipants = 25,
      distribution = DEFAULT_DISTRIBUTION,
      winnerSplit = DEFAULT_WINNER_SPLIT,
      creationTxSignature,
    } = req.body;
    
    // Validate required fields
    if (!token || !creatorWallet || !creatorDeposit) {
      return res.status(400).json({ 
        error: 'Missing required fields: token, creatorWallet, creatorDeposit' 
      });
    }
    
    // Validate token
    if (!tokenData[token]) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    // Validate creator deposit
    if (creatorDeposit < 0.5) {
      return res.status(400).json({ error: 'Creator deposit must be at least 0.5 SOL' });
    }
    
    // Validate min/max participants
    if (minParticipants < 3) {
      return res.status(400).json({ error: 'Minimum participants must be at least 3' });
    }
    if (maxParticipants < minParticipants) {
      return res.status(400).json({ error: 'Maximum participants must be >= minimum' });
    }
    
    // Validate distribution percentages (creator + platform = 100)
    const totalDistribution = distribution.creator + distribution.platform;
    if (totalDistribution !== 100) {
      return res.status(400).json({ error: 'Distribution percentages (creator + platform) must sum to 100' });
    }
    
    // Validate winner split percentages
    const totalWinnerSplit = winnerSplit.first + winnerSplit.second + winnerSplit.third;
    if (totalWinnerSplit !== 100) {
      return res.status(400).json({ error: 'Winner split percentages must sum to 100' });
    }
    
    const joiningEndsAt = new Date(Date.now() + joiningDuration * 60 * 60 * 1000);
    
    // Get or create creator profile to check for bonuses
    const creatorProfile = await PredictionCreator.getOrCreate(creatorWallet);
    
    // Apply creator's reputation bonuses to distribution
    // Entry fees only go to creator and platform (not to winners)
    const effectiveDistribution = {
      creator: Math.min(90, distribution.creator + creatorProfile.creatorFeeBonus),  // Max 90%
      platform: Math.max(10, distribution.platform - (distribution.platform * creatorProfile.platformFeeDiscount / 100)),  // Min 10%
    };
    
    // Normalize to 100%
    const total = effectiveDistribution.creator + effectiveDistribution.platform;
    if (total !== 100) {
      effectiveDistribution.creator = 100 - effectiveDistribution.platform;
    }
    
    const event = new PredictionEvent({
      token,
      tokenName: tokenData[token].name,
      tokenIcon: tokenData[token].icon,
      creatorWallet,
      creatorDeposit,
      entryFee,
      distribution: effectiveDistribution,
      winnerSplit,
      minParticipants,
      maxParticipants,
      joiningEndsAt,
      predictionPhaseDuration,
      waitingPhaseDuration,
      creationTxSignature,
      status: 'joining',
      // Legacy fields for backward compatibility
      rewardPool: creatorDeposit,
    });
    
    await event.save();
    
    // Update creator profile stats
    await creatorProfile.onEventCreated({
      creatorDeposit,
      entryFee,
      maxParticipants,
    });
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/prediction-game/events/:id/join - Join an event (pay entry fee)
router.post('/:id/join', async (req, res) => {
  try {
    const { walletAddress, txSignature } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Missing required field: walletAddress' });
    }
    
    const event = await PredictionEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    await event.addParticipant(walletAddress, txSignature);
    
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/prediction-game/events/:id/predict - Add prediction to event
router.post('/:id/predict', async (req, res) => {
  try {
    const { walletAddress, predictedPrice } = req.body;
    
    if (!walletAddress || predictedPrice === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress, predictedPrice' 
      });
    }
    
    const event = await PredictionEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check phase transition first
    const now = new Date();
    if (event.status === 'joining' && now > event.joiningEndsAt) {
      if (event.participants.length >= event.minParticipants) {
        await event.startPredictionPhase();
      } else {
        return res.status(400).json({ error: 'Event cancelled - minimum participants not reached' });
      }
    }
    
    await event.addPrediction(walletAddress, predictedPrice);
    
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/prediction-game/events/:id/resolve - Resolve event with final price
router.put('/:id/resolve', async (req, res) => {
  try {
    const { finalPrice, resolutionTxSignature } = req.body;
    
    if (!finalPrice) {
      return res.status(400).json({ error: 'Final price is required' });
    }
    
    const event = await PredictionEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check if we need to transition from predicting to waiting
    const now = new Date();
    if (event.status === 'predicting' && now > event.predictionEndsAt) {
      await event.startWaitingPhase();
    }
    
    if (event.status !== 'waiting') {
      return res.status(400).json({ error: 'Event must be in waiting phase to resolve' });
    }
    
    await event.resolveEvent(finalPrice, resolutionTxSignature);
    
    // Update creator profile stats on event completion
    try {
      const creator = await PredictionCreator.getOrCreate(event.creatorWallet);
      await creator.onEventCompleted({
        participants: event.participants,
        predictions: event.predictions,
        creatorDeposit: event.creatorDeposit,
        entryFee: event.entryFee,
        maxParticipants: event.maxParticipants,
      });
    } catch (creatorError) {
      console.error('Failed to update creator stats:', creatorError);
      // Don't fail the request, just log the error
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/prediction-game/events/:id/start-prediction - Manually start prediction phase
router.put('/:id/start-prediction', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    const event = await PredictionEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (event.creatorWallet !== walletAddress) {
      return res.status(403).json({ error: 'Only the creator can start prediction phase' });
    }
    
    if (event.status !== 'joining') {
      return res.status(400).json({ error: 'Event must be in joining phase' });
    }
    
    if (event.participants.length < event.minParticipants) {
      return res.status(400).json({ 
        error: `Minimum ${event.minParticipants} participants required. Current: ${event.participants.length}` 
      });
    }
    
    await event.startPredictionPhase();
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/prediction-game/events/:id/payouts - Get detailed payout information
router.get('/:id/payouts', async (req, res) => {
  try {
    const event = await PredictionEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const breakdown = event.payoutBreakdown;
    const projectedMax = event.projectedPayoutAtMax;
    
    res.json({
      current: breakdown,
      projectedAtMax: projectedMax,
      distribution: event.distribution,
      winnerSplit: event.winnerSplit,
      participantCount: event.participants.length,
      maxParticipants: event.maxParticipants,
      // If completed, show final payouts
      finalPayouts: event.status === 'completed' ? event.payouts : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/prediction-game/events/user/:walletAddress - Get events for a specific user
router.get('/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { type } = req.query;
    
    let events;
    
    if (type === 'created') {
      events = await PredictionEvent.find({ creatorWallet: walletAddress }).sort({ createdAt: -1 });
    } else if (type === 'joined') {
      events = await PredictionEvent.find({ 'participants.walletAddress': walletAddress }).sort({ createdAt: -1 });
    } else if (type === 'predicted') {
      events = await PredictionEvent.find({ 'predictions.walletAddress': walletAddress }).sort({ createdAt: -1 });
    } else {
      const created = await PredictionEvent.find({ creatorWallet: walletAddress });
      const joined = await PredictionEvent.find({ 'participants.walletAddress': walletAddress });
      const predicted = await PredictionEvent.find({ 'predictions.walletAddress': walletAddress });
      events = { created, joined, predicted };
    }
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/prediction-game/events/:id - Cancel event
router.delete('/:id', async (req, res) => {
  try {
    const { walletAddress, reason } = req.body;
    
    const event = await PredictionEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    await event.cancelEvent(reason, walletAddress);
    
    // Update creator profile stats on event cancellation
    try {
      const creator = await PredictionCreator.getOrCreate(event.creatorWallet);
      await creator.onEventCancelled();
    } catch (creatorError) {
      console.error('Failed to update creator stats:', creatorError);
      // Don't fail the request, just log the error
    }
    
    // Get refund information
    const refundInfo = event.getRefundInfo();
    
    res.json({ 
      message: 'Event cancelled successfully', 
      event,
      refundInfo,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export function createPredictionEventsRouter() {
  return router;
}

export default router;
