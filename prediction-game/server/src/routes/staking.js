import express from 'express';
import Staking, { STAKING_TIERS } from '../models/Staking.js';

const router = express.Router();

// Get staking tiers configuration
router.get('/tiers', (req, res) => {
  res.json({ tiers: STAKING_TIERS });
});

// Get staking info for a wallet
router.get('/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const staking = await Staking.getOrCreate(walletAddress);
    const tierInfo = staking.getTierInfo();
    const canCreateResult = staking.canCreateEvent();
    const canUnstakeResult = staking.canUnstake();
    
    res.json({
      walletAddress: staking.walletAddress,
      stakedAmount: staking.stakedAmount,
      tier: staking.tier,
      tierInfo,
      stakedAt: staking.stakedAt,
      unlocksAt: staking.unlocksAt,
      eventsCreatedToday: staking.eventsCreatedToday,
      totalEventsCreated: staking.totalEventsCreated,
      totalSlashed: staking.totalSlashed,
      canCreate: canCreateResult,
      canUnstake: canUnstakeResult,
      stakingHistory: staking.stakingHistory.slice(-10), // Last 10 entries
    });
  } catch (error) {
    console.error('Error getting staking info:', error);
    res.status(500).json({ error: 'Failed to get staking info' });
  }
});

// Stake tokens
router.post('/:walletAddress/stake', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { amount, txSignature } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid stake amount' });
    }
    
    const staking = await Staking.getOrCreate(walletAddress);
    const previousTier = staking.tier;
    
    await staking.stake(amount, txSignature);
    
    const tierInfo = staking.getTierInfo();
    const tierChanged = previousTier !== staking.tier;
    
    res.json({
      message: tierChanged 
        ? `Staked successfully! You've upgraded to ${tierInfo.name} tier!` 
        : 'Staked successfully!',
      walletAddress: staking.walletAddress,
      stakedAmount: staking.stakedAmount,
      tier: staking.tier,
      tierInfo,
      previousTier,
      tierChanged,
      unlocksAt: staking.unlocksAt,
      canCreate: staking.canCreateEvent(),
    });
  } catch (error) {
    console.error('Error staking:', error);
    res.status(500).json({ error: error.message || 'Failed to stake tokens' });
  }
});

// Unstake tokens
router.post('/:walletAddress/unstake', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { amount, txSignature } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid unstake amount' });
    }
    
    const staking = await Staking.findOne({ walletAddress });
    
    if (!staking) {
      return res.status(404).json({ error: 'No staking record found' });
    }
    
    const previousTier = staking.tier;
    
    await staking.unstake(amount, txSignature);
    
    const tierInfo = staking.getTierInfo();
    const tierChanged = previousTier !== staking.tier;
    
    res.json({
      message: tierChanged 
        ? `Unstaked successfully. You're now at ${tierInfo.name} tier.` 
        : 'Unstaked successfully!',
      walletAddress: staking.walletAddress,
      stakedAmount: staking.stakedAmount,
      tier: staking.tier,
      tierInfo,
      previousTier,
      tierChanged,
      unlocksAt: staking.unlocksAt,
      canCreate: staking.canCreateEvent(),
    });
  } catch (error) {
    console.error('Error unstaking:', error);
    res.status(400).json({ error: error.message || 'Failed to unstake tokens' });
  }
});

// Check if wallet can create event
router.get('/:walletAddress/can-create', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const staking = await Staking.getOrCreate(walletAddress);
    const result = staking.canCreateEvent();
    
    res.json({
      ...result,
      tier: staking.tier,
      tierInfo: staking.getTierInfo(),
      stakedAmount: staking.stakedAmount,
    });
  } catch (error) {
    console.error('Error checking create permission:', error);
    res.status(500).json({ error: 'Failed to check permission' });
  }
});

// Record event creation (called after event is created)
router.post('/:walletAddress/record-event', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const staking = await Staking.getOrCreate(walletAddress);
    
    const canCreate = staking.canCreateEvent();
    if (!canCreate.canCreate) {
      return res.status(400).json({ error: canCreate.reason });
    }
    
    await staking.recordEventCreation();
    
    res.json({
      message: 'Event creation recorded',
      eventsCreatedToday: staking.eventsCreatedToday,
      remainingToday: staking.getTierInfo().dailyEvents - staking.eventsCreatedToday,
    });
  } catch (error) {
    console.error('Error recording event:', error);
    res.status(500).json({ error: 'Failed to record event creation' });
  }
});

// Get staking stats (admin)
router.get('/admin/stats', async (req, res) => {
  try {
    const stats = await Staking.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting staking stats:', error);
    res.status(500).json({ error: 'Failed to get staking stats' });
  }
});

// Get leaderboard
router.get('/leaderboard/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const topStakers = await Staking.find({ stakedAmount: { $gt: 0 } })
      .sort({ stakedAmount: -1 })
      .limit(limit)
      .select('walletAddress stakedAmount tier totalEventsCreated');
    
    res.json({ leaderboard: topStakers });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

export default router;
