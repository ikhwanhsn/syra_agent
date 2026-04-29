import { API_BASE, getApiHeaders } from "../../config/global";

export type NewsRow = {
  title?: string;
  source_name?: string;
  news_url?: string;
  date?: string;
  sentiment?: string;
  tickers?: string[];
};

export type NewsResponse = {
  success?: boolean;
  news?: NewsRow[];
  data?: NewsRow[];
  error?: string;
};

export async function getNews(ticker = "general", signal?: AbortSignal): Promise<NewsRow[]> {
  const url = `${API_BASE}/preview/news?ticker=${encodeURIComponent(ticker)}`;
  const res = await fetch(url, { method: "GET", headers: getApiHeaders(), signal });
  const json = (await res.json().catch(() => null)) as NewsResponse | null;
  if (!res.ok || !json) {
    throw new Error(`News request failed (${res.status})`);
  }
  if (json.error) {
    throw new Error(json.error);
  }
  const rows = Array.isArray(json.news) ? json.news : Array.isArray(json.data) ? json.data : [];
  return rows;
}
