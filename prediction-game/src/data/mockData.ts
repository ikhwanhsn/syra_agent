import { Event } from '@/components/EventCard';

export const mockEvents: Event[] = [
  {
    id: '1',
    token: 'Bitcoin',
    tokenIcon: '₿',
    rewardPool: 2.5,
    participants: 18,
    maxParticipants: 25,
    status: 'active',
    endDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
    userPrediction: 98500,
  },
  {
    id: '2',
    token: 'Solana',
    tokenIcon: '◎',
    rewardPool: 2.5,
    participants: 25,
    maxParticipants: 25,
    status: 'completed',
    endDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    finalPrice: 245.67,
    winners: [
      { address: '7xKX...9dFe', prize: 0.5, rank: 1 },
      { address: '3mPQ...2wRt', prize: 0.3, rank: 2 },
      { address: '9nLK...4vBc', prize: 0.2, rank: 3 },
    ],
  },
  {
    id: '3',
    token: 'Ethereum',
    tokenIcon: 'Ξ',
    rewardPool: 2.5,
    participants: 8,
    maxParticipants: 25,
    status: 'pending',
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  },
  {
    id: '4',
    token: 'Dogecoin',
    tokenIcon: 'Ð',
    rewardPool: 2.5,
    participants: 22,
    maxParticipants: 25,
    status: 'active',
    endDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
  },
  {
    id: '5',
    token: 'Cardano',
    tokenIcon: '₳',
    rewardPool: 2.5,
    participants: 15,
    maxParticipants: 25,
    status: 'pending',
    endDate: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20 hours from now
    userPrediction: 0.85,
  },
];

export const mockCreatedEvents = mockEvents.filter((_, i) => i % 2 === 0);
export const mockJoinedEvents = mockEvents.filter((e) => e.userPrediction !== undefined);

export const mockStats = {
  totalEvents: 1247,
  totalParticipants: 28543,
  totalRewardsGiven: 15420,
};

export const mockAdminData = {
  totalFees: 2845.5,
  pendingWithdrawals: 125.3,
  transactions: [
    { id: '1', type: 'Fee Collection', amount: 0.2, date: '2024-01-15', event: 'BTC Prediction #1247' },
    { id: '2', type: 'Fee Collection', amount: 0.2, date: '2024-01-15', event: 'SOL Prediction #1246' },
    { id: '3', type: 'Withdrawal', amount: -50, date: '2024-01-14', event: 'Admin Withdrawal' },
    { id: '4', type: 'Fee Collection', amount: 0.2, date: '2024-01-14', event: 'ETH Prediction #1245' },
    { id: '5', type: 'Fee Collection', amount: 0.2, date: '2024-01-13', event: 'DOGE Prediction #1244' },
  ],
};

export const tokens = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'SOL', name: 'Solana', icon: '◎' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð' },
  { symbol: 'ADA', name: 'Cardano', icon: '₳' },
  { symbol: 'XRP', name: 'Ripple', icon: '✕' },
  { symbol: 'AVAX', name: 'Avalanche', icon: '🔺' },
  { symbol: 'DOT', name: 'Polkadot', icon: '●' },
];
