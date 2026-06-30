import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";

import { DISCOVERY_PAGE_SIZE } from "@/components/discovery/constants";
import { fetchEvents, type EventRecord } from "@/lib/eventsApi";
import { fetchHackathons, type HackathonRecord } from "@/lib/hackathonApi";
import { fetchJobs, type JobListing } from "@/lib/jobsApi";

type DiscoveryKind = "jobs" | "events" | "hackathons";

interface UseDiscoveryDetailResult<T> {
  record: T | null;
  isLoading: boolean;
  isNotFound: boolean;
  fromState: boolean;
}

function readStateRecord<T>(locationState: unknown): T | null {
  if (!locationState || typeof locationState !== "object") return null;
  const record = (locationState as { record?: T }).record;
  return record ?? null;
}

async function findJobById(id: string): Promise<JobListing | null> {
  let skip = 0;
  const limit = DISCOVERY_PAGE_SIZE;

  for (let page = 0; page < 20; page += 1) {
    const result = await fetchJobs({ limit, skip });
    const match = result.jobs.find((job) => job.jobIdentityKey === id);
    if (match) return match;
    if (result.jobs.length < limit) break;
    skip += limit;
  }

  return null;
}

async function findEventById(
  wallet: string | null,
  id: string,
): Promise<EventRecord | null> {
  let skip = 0;
  const limit = DISCOVERY_PAGE_SIZE;

  for (let page = 0; page < 20; page += 1) {
    const result = await fetchEvents(wallet, { limit, skip });
    const match = result.items.find((item) => item._id === id);
    if (match) return match;
    if (result.items.length < limit) break;
    skip += limit;
  }

  return null;
}

async function findHackathonById(
  wallet: string | null,
  id: string,
): Promise<HackathonRecord | null> {
  let skip = 0;
  const limit = DISCOVERY_PAGE_SIZE;

  for (let page = 0; page < 20; page += 1) {
    const result = await fetchHackathons(wallet, { limit, skip });
    const match = result.items.find((item) => item._id === id);
    if (match) return match;
    if (result.items.length < limit) break;
    skip += limit;
  }

  return null;
}

export function useDiscoveryDetail<T extends JobListing | EventRecord | HackathonRecord>(
  kind: DiscoveryKind,
): UseDiscoveryDetailResult<T> {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const wallet = useWallet();
  const address = wallet.publicKey?.toBase58() ?? null;

  const stateRecord = useMemo(
    () => readStateRecord<T>(location.state),
    [location.state],
  );

  const [resolved, setResolved] = useState<T | null>(stateRecord);
  const [fromState, setFromState] = useState(Boolean(stateRecord));

  useEffect(() => {
    if (stateRecord) {
      setResolved(stateRecord);
      setFromState(true);
    }
  }, [stateRecord]);

  const needsFetch = Boolean(id) && !stateRecord;

  const query = useQuery({
    queryKey: ["discovery-detail", kind, id, address],
    queryFn: async () => {
      if (!id) return null;
      if (kind === "jobs") return findJobById(id);
      if (kind === "events") return findEventById(address, id);
      return findHackathonById(address, id);
    },
    enabled: needsFetch,
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (query.data) {
      setResolved(query.data as T);
      setFromState(false);
    }
  }, [query.data]);

  const record = resolved;
  const isLoading = needsFetch && query.isLoading;
  const isNotFound = Boolean(id) && !isLoading && !record;

  return { record, isLoading, isNotFound, fromState };
}
