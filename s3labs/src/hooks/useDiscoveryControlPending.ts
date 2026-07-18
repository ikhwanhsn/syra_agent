import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { DISCOVERY_CONTROL_DEBOUNCE_MS } from "@/components/discovery/constants";

/**
 * Debounces discovery toolbar controls and reports when the UI should show
 * a results skeleton (pending debounce or initial query load).
 */
export function useDiscoveryControlPending(
  controls: {
    search: string;
    filter?: string;
    sort?: string;
    status?: string;
  },
  isLoading: boolean,
) {
  const search = controls.search.trim();
  const filter = controls.filter ?? "";
  const sort = controls.sort ?? "";
  const status = controls.status ?? "";

  const debouncedSearch = useDebouncedValue(search, DISCOVERY_CONTROL_DEBOUNCE_MS);
  const debouncedFilter = useDebouncedValue(filter, DISCOVERY_CONTROL_DEBOUNCE_MS);
  const debouncedSort = useDebouncedValue(sort, DISCOVERY_CONTROL_DEBOUNCE_MS);
  const debouncedStatus = useDebouncedValue(status, DISCOVERY_CONTROL_DEBOUNCE_MS);

  const isControlsPending =
    search !== debouncedSearch ||
    filter !== debouncedFilter ||
    sort !== debouncedSort ||
    status !== debouncedStatus;

  return {
    debouncedSearch,
    debouncedFilter,
    debouncedSort,
    debouncedStatus,
    isControlsPending,
    showSkeleton: isControlsPending || isLoading,
  };
}
