import { useCallback, useEffect, useMemo, useState } from "react";
import { paginateSlice } from "@/lib/pagination";

export function useTablePagination<T>(items: readonly T[], defaultPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const { slice, totalItems, totalPages, safePage } = useMemo(
    () => paginateSlice(items, page, pageSize),
    [items, page, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [items.length, pageSize]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const setPageSizeAndReset = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize: setPageSizeAndReset,
    totalItems,
    totalPages,
    slice,
  };
}
