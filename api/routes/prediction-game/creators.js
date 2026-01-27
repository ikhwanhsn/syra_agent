import express from 'express';
import PredictionCreator from '../../models/prediction-game/Creator.js';
import PredictionEvent from '../../models/prediction-game/Event.js';

const router = express.Router();

// ==========================================
// GET ROUTES
// ==========================================

// Get creator profile by wallet address
router.get('/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // Get or create creator profile
    const creator = await PredictionCreator.getOrCreate(walletAddress);
    
    // Get recent events by this creator
    const recentEvents = await PredictionEvent.find({ creatorWallet: walletAddress })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('token tokenName tokenIcon status participants creatorDeposit entryFee createdAt');
    
    res.json({
      creator,
      recentEvents,
    });
  } catch (error) {
    console.error('Error fetching creator profile:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch creator profile' });
  }
});

// Get creator stats summary
router.get('/:walletAddress/stats', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const creator = await PredictionCreator.findOne({ walletAddress });
    
    if (!creator) {
      return res.json({
        isNewCreator: true,
        totalEventsCreated: 0,
        eventsCompleted: 0,
        eventsCancelled: 0,
        totalParticipants: 0,
        totalFeeRevenueEarned: 0,
        reputationScore: 50,
        reputationTier: 'newcomer',
        dailyEventLimit: 3,
      });
    }
    
    res.json({
      isNewCreator: false,
      totalEventsCreated: creator.totalEventsCreated,
      eventsCompleted: creator.eventsCompleted,
      eventsCancelled: creator.eventsCancelled,
      eventsActive: creator.eventsActive,
      totalParticipants: creator.totalParticipants,
      averageParticipants: creator.averageParticipants,
      totalPredictions: creator.totalPredictions,
      totalDeposited: creator.totalDeposited,
      totalFeeRevenueEarned: creator.totalFeeRevenueEarned,
      totalEntryFeesCollected: creator.totalEntryFeesCollected,
      totalPrizePoolsGenerated: creator.totalPrizePoolsGenerated,
      completionRate: creator.completionRate,
      averageFillRate: creator.averageFillRate,
      reputationScore: creator.reputationScore,
      reputationTier: creator.reputationTier,
      currentStreak: creator.currentStreak,
      bestStreak: creator.bestStreak,
      achievements: creator.achievements,
      effectiveCreatorFee: creator.effectiveCreatorFee,
      effectivePlatformFee: creator.effectivePlatformFee,
      dailyEventLimit: creator.dailyEventLimit,
      platformFeeDiscount: creator.platformFeeDiscount,
      creatorFeeBonus: creator.creatorFeeBonus,
      isFeatured: creator.isFeatured,
      isVerified: creator.isVerified,
      firstEventAt: creator.firstEventAt,
      lastEventAt: creator.lastEventAt,
    });
  } catch (error) {
    console.error('Error fetching creator stats:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch creator stats' });
  }
});

// Get creator events history
router.get('/:walletAddress/events', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { creatorWallet: walletAddress };
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const events = await PredictionEvent.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await PredictionEvent.countDocuments(query);
    
    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching creator events:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch creator events' });
  }
});

// Get creator earnings breakdown
router.get('/:walletAddress/earnings', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const creator = await PredictionCreator.findOne({ walletAddress });
    
    if (!creator) {
      return res.json({
        totalDeposited: 0,
        totalFeeRevenueEarned: 0,
        totalEntryFeesCollected: 0,
        netProfit: 0,
        averageRevenuePerEvent: 0,
        projectedMonthlyRevenue: 0,
      });
    }
    
    const netProfit = creator.totalFeeRevenueEarned;
    const averageRevenuePerEvent = creator.eventsCompleted > 0 
      ? netProfit / creator.eventsCompleted 
      : 0;
    
    // Get events from last 30 days for projection
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEvents = await PredictionEvent.countDocuments({
      creatorWallet: walletAddress,
      status: 'completed',
      createdAt: { $gte: thirtyDaysAgo },
    });
    
    const projectedMonthlyRevenue = recentEvents * averageRevenuePerEvent;
    
    res.json({
      totalDeposited: creator.totalDeposited,
      totalFeeRevenueEarned: creator.totalFeeRevenueEarned,
      totalEntryFeesCollected: creator.totalEntryFeesCollected,
      totalPrizePoolsGenerated: creator.totalPrizePoolsGenerated,
      netProfit,
      averageRevenuePerEvent: Math.round(averageRevenuePerEvent * 10000) / 10000,
      recentEventsCompleted: recentEvents,
      projectedMonthlyRevenue: Math.round(projectedMonthlyRevenue * 10000) / 10000,
      effectiveCreatorFee: creator.effectiveCreatorFee,
      platformFeeDiscount: creator.platformFeeDiscount,
    });
  } catch (error) {
    console.error('Error fetching creator earnings:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch creator earnings' });
  }
});

// ==========================================
// LEADERBOARD & DISCOVERY
// ==========================================

// Get top creators leaderboard
router.get('/leaderboard/top', async (req, res) => {
  try {
    const { limit = 10, sortBy = 'reputationScore' } = req.query;
    
    const validSortFields = [
      'reputationScore',
      'totalEventsCreated',
      'eventsCompleted',
      'totalFeeRevenueEarned',
      'totalParticipants',
      'averageFillRate',
    ];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'reputationScore';
    
    const creators = await PredictionCreator.find({ eventsCompleted: { $gt: 0 } })
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .select('walletAddress displayName reputationScore reputationTier totalEventsCreated eventsCompleted totalParticipants totalFeeRevenueEarned averageFillRate achievements isFeatured isVerified');
    
    res.json({ creators });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch leaderboard' });
  }
});

// Get featured creators
router.get('/featured/list', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const creators = await PredictionCreator.getFeaturedCreators(parseInt(limit));
    
    res.json({ creators });
  } catch (error) {
    console.error('Error fetching featured creators:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch featured creators' });
  }
});

// ==========================================
// PROFILE UPDATE
// ==========================================

// Update creator profile
router.put('/:walletAddress/profile', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { displayName, bio, avatarUrl, socialLinks } = req.body;
    
    const creator = await PredictionCreator.getOrCreate(walletAddress);
    
    if (displayName !== undefined) creator.displayName = displayName;
    if (bio !== undefined) creator.bio = bio;
    if (avatarUrl !== undefined) creator.avatarUrl = avatarUrl;
    if (socialLinks !== undefined) {
      creator.socialLinks = {
        ...creator.socialLinks,
        ...socialLinks,
      };
    }
    
    creator.lastActiveAt = new Date();
    await creator.save();
    
    res.json({ creator });
  } catch (error) {
    console.error('Error updating creator profile:', error);
    res.status(500).json({ error: error.message || 'Failed to update creator profile' });
  }
});

// ==========================================
// TIER INFO
// ==========================================

// Get tier benefits info
// Base: Creator gets 70% of entry fees, Platform gets 30%
// Higher tiers get bonus creator % and platform discount
router.get('/tiers/info', async (req, res) => {
  try {
    const tiers = [
      {
        tier: 'newcomer',
        minScore: 0,
        maxScore: 39,
        dailyEventLimit: 3,
        creatorFee: 70,
        platformFee: 30,
        benefits: ['Basic event creation', '3 events per day'],
      },
      {
        tier: 'bronze',
        minScore: 40,
        maxScore: 59,
        dailyEventLimit: 5,
        creatorFee: 72,
        platformFee: 28,
        benefits: ['5 events per day', '+2% creator fee', '2% platform fee discount'],
      },
      {
        tier: 'silver',
        minScore: 60,
        maxScore: 74,
        dailyEventLimit: 7,
        creatorFee: 75,
        platformFee: 25,
        benefits: ['7 events per day', '+5% creator fee', '5% platform fee discount'],
      },
      {
        tier: 'gold',
        minScore: 75,
        maxScore: 84,
        dailyEventLimit: 10,
        creatorFee: 78,
        platformFee: 22,
        benefits: ['10 events per day', '+8% creator fee', '8% platform fee discount', 'Priority support'],
      },
      {
        tier: 'platinum',
        minScore: 85,
        maxScore: 94,
        dailyEventLimit: 12,
        creatorFee: 82,
        platformFee: 18,
        benefits: ['12 events per day', '+12% creator fee', '12% platform fee discount', 'Featured placement'],
      },
      {
        tier: 'diamond',
        minScore: 95,
        maxScore: 100,
        dailyEventLimit: 15,
        creatorFee: 85,
        platformFee: 15,
        benefits: ['15 events per day', '+15% creator fee', '15% platform fee discount', 'Featured placement', 'Verified badge'],
      },
    ];
    
    res.json({ tiers });
  } catch (error) {
    console.error('Error fetching tier info:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch tier info' });
  }
});

export function createPredictionCreatorsRouter() {
  return router;
}

export default router;
