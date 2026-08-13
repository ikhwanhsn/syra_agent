import {apiGetJson} from './api';

export type PreviewNewsItem = {
  title?: string;
  text?: string;
  source_name?: string;
  date?: string;
  news_url?: string;
  tickers?: string[];
};

export type PreviewNewsResponse = {
  news?: PreviewNewsItem[];
};

export type PreviewSentimentDay = {
  date?: string;
  ticker?: Record<string, number>;
  Positive?: number;
  Negative?: number;
  Neutral?: number;
  sentiment_score?: number;
};

export type PreviewSentimentResponse = {
  sentimentAnalysis?: PreviewSentimentDay[];
  sentiment?: {data?: PreviewSentimentDay[]; totals?: Record<string, number>};
};

export type PreviewSignalResponse = {
  signal?: {
    metadata?: {
      TRADING_SIGNAL?: string;
      SIGNAL_STRENGTH?: string | number;
      instrument?: string;
      timestamp?: string;
    };
    recommendation?: string;
    marketOverview?: Record<string, unknown>;
    technicalIndicators?: Record<string, unknown>;
    source?: string;
  };
};

export async function fetchPreviewNews(
  ticker = 'BTC',
): Promise<PreviewNewsResponse> {
  const {status, json} = await apiGetJson<PreviewNewsResponse>(
    `/preview/news?ticker=${encodeURIComponent(ticker)}`,
  );
  if (status >= 400) throw new Error('Preview news unavailable');
  return json || {news: []};
}

export async function fetchPreviewSentiment(
  ticker = 'BTC',
): Promise<PreviewSentimentResponse> {
  const {status, json} = await apiGetJson<PreviewSentimentResponse>(
    `/preview/sentiment?ticker=${encodeURIComponent(ticker)}`,
  );
  if (status >= 400) throw new Error('Preview sentiment unavailable');
  return json || {};
}

export async function fetchPreviewSignal(
  token = 'solana',
): Promise<PreviewSignalResponse> {
  const {status, json} = await apiGetJson<PreviewSignalResponse>(
    `/preview/signal?token=${encodeURIComponent(token)}`,
  );
  if (status >= 400) throw new Error('Preview signal unavailable');
  return json || {};
}
