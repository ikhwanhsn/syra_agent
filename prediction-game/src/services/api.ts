// API Base URL - change this for production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface Participant {
  walletAddress: string;
  joinedAt: string;
  entryFeePaid: number;
  entryTxSignature?: string;
}

export interface Prediction {
  walletAddress: string;
  predictedPrice?: number; // Hidden during prediction phase
  submittedAt: string;
  isEarlyPrediction: boolean;
  timeBonus?: number;
}

export interface Winner {
  walletAddress: string;
  rank: number;
  prize: number;
  predictedPrice: number;
  accuracy?: number;
  timeBonus?: number;
  finalScore?: number;
}

export interface Distribution {
  creator: number;  // Percentage of entry fees to creator (e.g., 70)
  platform: number; // Percentage of entry fees to platform (e.g., 30)
  winners?: number; // Deprecated - winners get creator deposit only
}

export interface WinnerSplit {
  first: number;   // Percentage of winners' share (e.g., 50)
  second: number;  // Percentage (e.g., 30)
  third: number;   // Percentage (e.g., 20)
}

export interface Payouts {
  totalPool: number;
  winnersPool: number;
  firstPrize: number;
  secondPrize: number;
  thirdPrize: number;
  creatorPayout: number;
  platformPayout: number;
}

export interface PayoutBreakdown {
  totalPool: number;
  entryFeesCollected: number;
  creatorDeposit: number;
  winnersPool: number;
  firstPrize: number;
  secondPrize: number;
  thirdPrize: number;
  creatorPayout: number;
  platformPayout: number;
  totalOut: number;
}

export interface PhaseInfo {
  phase: 'joining' | 'predicting' | 'waiting' | 'completed' | 'cancelled';
  endsAt?: string;
  startsAt?: string;
  timeRemaining?: number;
  spotsRemaining?: number;
  canJoin?: boolean;
  canPredict?: boolean;
  earlyBonusEndsAt?: string;
  isEarlyBonusPeriod?: boolean;
  resolutionAt?: string;
  resolvedAt?: string;
  reason?: string;
}

export interface Event {
  _id: string;
  id?: string;
  token: string;
  tokenName: string;
  tokenIcon: string;
  creatorWallet: string;
  
  // Money configuration
  creatorDeposit: number;
  entryFee: number;
  distribution: Distribution;
  winnerSplit: WinnerSplit;
  payouts?: Payouts;
  
  // Legacy fields
  rewardPool?: number;
  platformFee?: number;
  creatorReward?: number;
  prizeDistribution?: {
    first: number;
    second: number;
    third: number;
  };
  
  // Participants
  minParticipants: number;
  maxParticipants: number;
  participants: Participant[];
  predictions: Prediction[];
  
  // Status
  status: 'joining' | 'predicting' | 'waiting' | 'completed' | 'cancelled';
  
  // Phase timing
  joiningEndsAt: string;
  predictionPhaseDuration: number;
  predictionStartsAt?: string;
  predictionEndsAt?: string;
  waitingPhaseDuration: number;
  resolutionAt?: string;
  
  // Legacy timing
  startDate: string;
  endDate?: string;
  
  // Results
  finalPrice?: number;
  winners?: Winner[];
  predictionsRevealed: boolean;
  cancellationReason?: string;
  
  // Transaction references
  creationTxSignature?: string;
  resolutionTxSignature?: string;
  
  // Virtual fields
  totalPool?: number;
  payoutBreakdown?: PayoutBreakdown;
  projectedPayoutAtMax?: {
    totalPool: number;
    firstPrize: number;
    secondPrize: number;
    thirdPrize: number;
    creatorPayout: number;
  };
  participantCount?: number;
  predictionCount?: number;
  isFull?: boolean;
  hasMinParticipants?: boolean;
  phaseInfo?: PhaseInfo;
  
  createdAt: string;
  updatedAt: string;
}

export interface EventsResponse {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface StatsResponse {
  totalEvents: number;
  activeEvents: number;
  joiningEvents: number;
  predictingEvents: number;
  waitingEvents: number;
  completedEvents: number;
  totalParticipants: number;
  totalPredictions: number;
  totalPoolDistributed: number;
  totalWinnersPaid: number;
  totalCreatorPaid: number;
  totalPlatformEarned: number;
}

export interface CreateEventData {
  token: string;
  creatorWallet: string;
  creatorDeposit: number;
  joiningDuration?: number;
  predictionPhaseDuration?: number;
  waitingPhaseDuration?: number;
  entryFee?: number;
  minParticipants?: number;
  maxParticipants?: number;
  distribution?: Distribution;
  winnerSplit?: WinnerSplit;
  creationTxSignature?: string;
}

export interface JoinEventData {
  walletAddress: string;
  txSignature?: string;
}

export interface PredictData {
  walletAddress: string;
  predictedPrice: number;
  txSignature?: string;
}

export interface PayoutInfoResponse {
  current: PayoutBreakdown;
  projectedAtMax: {
    totalPool: number;
    firstPrize: number;
    secondPrize: number;
    thirdPrize: number;
    creatorPayout: number;
  };
  distribution: Distribution;
  winnerSplit: WinnerSplit;
  participantCount: number;
  maxParticipants: number;
  finalPayouts: Payouts | null;
}

// API Functions
class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
  }

  // Events
  async getEvents(params?: {
    status?: string;
    token?: string;
    creator?: string;
    page?: number;
    limit?: number;
  }): Promise<EventsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.token) queryParams.append('token', params.token);
    if (params?.creator) queryParams.append('creator', params.creator);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<EventsResponse>(`/events${query ? `?${query}` : ''}`);
  }

  async getEvent(id: string): Promise<Event> {
    return this.request<Event>(`/events/${id}`);
  }

  async createEvent(data: CreateEventData): Promise<Event> {
    return this.request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinEvent(eventId: string, data: JoinEventData): Promise<Event> {
    return this.request<Event>(`/events/${eventId}/join`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addPrediction(eventId: string, data: PredictData): Promise<Event> {
    return this.request<Event>(`/events/${eventId}/predict`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async startPredictionPhase(eventId: string, walletAddress: string): Promise<Event> {
    return this.request<Event>(`/events/${eventId}/start-prediction`, {
      method: 'PUT',
      body: JSON.stringify({ walletAddress }),
    });
  }

  async resolveEvent(eventId: string, finalPrice: number, txSignature?: string): Promise<Event> {
    return this.request<Event>(`/events/${eventId}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ finalPrice, resolutionTxSignature: txSignature }),
    });
  }

  async cancelEvent(eventId: string, walletAddress: string, reason?: string): Promise<{ message: string; event: Event; refundInfo: any }> {
    return this.request<{ message: string; event: Event; refundInfo: any }>(`/events/${eventId}`, {
      method: 'DELETE',
      body: JSON.stringify({ walletAddress, reason }),
    });
  }

  async getEventPayouts(eventId: string): Promise<PayoutInfoResponse> {
    return this.request<PayoutInfoResponse>(`/events/${eventId}/payouts`);
  }

  async getUserEvents(walletAddress: string, type?: 'created' | 'joined' | 'predicted'): Promise<Event[] | { created: Event[]; joined: Event[]; predicted: Event[] }> {
    const query = type ? `?type=${type}` : '';
    return this.request(`/events/user/${walletAddress}${query}`);
  }

  async processPhaseTransitions(): Promise<{ message: string; transitionedFromJoining: number; transitionedFromPredicting: number }> {
    return this.request('/events/process-transitions', {
      method: 'POST',
    });
  }

  // Stats
  async getStats(): Promise<StatsResponse> {
    return this.request<StatsResponse>('/events/stats');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }
}

// Helper functions
export function getPhaseDisplayName(status: Event['status']): string {
  const names: Record<Event['status'], string> = {
    joining: 'Joining Phase',
    predicting: 'Prediction Phase',
    waiting: 'Waiting for Resolution',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return names[status] || status;
}

export function getPhaseColor(status: Event['status']): string {
  const colors: Record<Event['status'], string> = {
    joining: 'text-blue-400',
    predicting: 'text-yellow-400',
    waiting: 'text-purple-400',
    completed: 'text-green-400',
    cancelled: 'text-red-400',
  };
  return colors[status] || 'text-muted-foreground';
}

export function getPhaseDescription(event: Event): string {
  switch (event.status) {
    case 'joining':
      return `Join now! ${event.participants?.length || 0}/${event.maxParticipants} spots filled`;
    case 'predicting':
      return 'Submit your price prediction';
    case 'waiting':
      return 'Waiting for final price';
    case 'completed':
      return 'Winners announced';
    case 'cancelled':
      return event.cancellationReason || 'Event cancelled';
    default:
      return '';
  }
}

export function calculateTimeBonus(predictionTime: Date, predictionStartsAt: Date, predictionEndsAt: Date): { bonus: number; label: string } {
  const totalTime = predictionEndsAt.getTime() - predictionStartsAt.getTime();
  const elapsed = predictionTime.getTime() - predictionStartsAt.getTime();
  const percentage = elapsed / totalTime;
  
  if (percentage <= 0.25) {
    return { bonus: 1.5, label: '50% Early Bonus!' };
  } else if (percentage <= 0.5) {
    return { bonus: 1.25, label: '25% Bonus' };
  } else if (percentage <= 0.75) {
    return { bonus: 1.0, label: 'No Bonus' };
  } else {
    return { bonus: 0.75, label: '25% Penalty' };
  }
}

// Calculate payout breakdown for display
// SYSTEM: 
//   - Winners Prize = Creator Deposit ONLY
//   - Entry Fees = Creator Profit (70%) + Platform Fee (30%)
export function calculatePayoutBreakdown(
  creatorDeposit: number,
  entryFee: number,
  participantCount: number,
  distribution: Distribution = { creator: 70, platform: 30 },
  winnerSplit: WinnerSplit = { first: 50, second: 30, third: 20 }
): PayoutBreakdown {
  const entryFeesCollected = participantCount * entryFee;
  
  // Entry fees go to creator and platform ONLY
  const creatorProfit = entryFeesCollected * (distribution.creator / 100);
  const platformFee = entryFeesCollected * (distribution.platform / 100);
  
  // Prize pool = Creator Deposit ONLY (entry fees don't go to winners)
  const prizePool = creatorDeposit;
  
  // Winner prizes from creator deposit
  const firstPrize = prizePool * (winnerSplit.first / 100);
  const secondPrize = prizePool * (winnerSplit.second / 100);
  const thirdPrize = prizePool * (winnerSplit.third / 100);
  
  const round = (n: number) => Math.round(n * 10000) / 10000;
  
  return {
    totalPool: round(entryFeesCollected),
    entryFeesCollected: round(entryFeesCollected),
    creatorDeposit,
    winnersPool: round(prizePool),
    firstPrize: round(firstPrize),
    secondPrize: round(secondPrize),
    thirdPrize: round(thirdPrize),
    creatorPayout: round(creatorProfit),
    platformPayout: round(platformFee),
    totalOut: round(prizePool + creatorProfit + platformFee),
  };
}

export const api = new ApiService();

export default api;
