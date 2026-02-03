import { useState, useCallback, useMemo } from "react";

const ITEMS_PER_PAGE = 10;

export const useAlertsPagination = (itemsCount: number) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(
    () => Math.ceil(itemsCount / ITEMS_PER_PAGE),
    [itemsCount]
  );

  const paginationInfo = useMemo(
    () => ({
      startIndex: (currentPage - 1) * ITEMS_PER_PAGE,
      endIndex: currentPage * ITEMS_PER_PAGE,
      itemsPerPage: ITEMS_PER_PAGE,
    }),
    [currentPage]
  );

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    totalPages,
    paginationInfo,
    handleNextPage,
    handlePreviousPage,
    handlePageChange,
    resetPage,
  };
};
