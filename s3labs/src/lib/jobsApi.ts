import { API_BASE } from "../../config/global";

export type JobCategory = "web3" | "crypto" | "tech";

export interface JobListing {
  jobIdentityKey: string;
  dedupeKey: string;
  externalId?: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  salaryLabel: string;
  salaryScore: number;
  url: string;
  source: string;
  sourceId: string;
  category: JobCategory;
  description: string;
  publishedAt: string | null;
  postedToTelegram: boolean;
  postedAt: string | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
}

export interface JobsApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FetchJobsParams {
  category?: JobCategory | "all";
  remote?: boolean;
  search?: string;
  sort?: string;
  limit?: number;
  skip?: number;
}

function normalizeSalaryLabel(label: string | undefined | null): string {
  const trimmed = String(label ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  if (
    lower === "gaji tidak disebutkan" ||
    lower === "gaji tidak tersedia" ||
    lower === "gaji belum disebutkan"
  ) {
    return "";
  }

  return trimmed;
}

function normalizeJobListing(job: JobListing): JobListing {
  return {
    ...job,
    salaryLabel: normalizeSalaryLabel(job.salaryLabel),
  };
}

async function jobsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = (await res.json().catch(() => ({}))) as JobsApiResponse<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (body.data === undefined) {
    throw new Error("Empty API response");
  }
  return body.data;
}

export function fetchJobs(
  params: FetchJobsParams = {},
): Promise<{ jobs: JobListing[] }> {
  const qs = new URLSearchParams();

  if (params.category && params.category !== "all") {
    qs.set("category", params.category);
  }
  if (params.remote) {
    qs.set("remote", "true");
  }
  if (params.search?.trim()) {
    qs.set("search", params.search.trim());
  }
  if (params.sort) {
    qs.set("sort", params.sort);
  }
  if (params.limit) {
    qs.set("limit", String(params.limit));
  }
  if (params.skip) {
    qs.set("skip", String(params.skip));
  }

  const query = qs.toString();
  return jobsFetch<{ jobs: JobListing[]; total: number }>(
    `/jobs${query ? `?${query}` : ""}`,
  ).then((data) => ({
    ...data,
    jobs: data.jobs.map(normalizeJobListing),
  }));
}
