import { useState, useMemo } from 'react';

/**
 * Custom hook for client-side pagination
 * 
 * @param {Array} items - Array of items to paginate
 * @param {number} itemsPerPage - Number of items per page (default: 10)
 * @returns {Object} Pagination state and controls
 * 
 * Usage:
 * const {
 *   currentPage,
 *   totalPages,
 *   paginatedItems,
 *   goToPage,
 *   nextPage,
 *   prevPage,
 *   hasNextPage,
 *   hasPrevPage
 * } = usePagination(services, 20);
 */
export function usePagination(items = [], itemsPerPage = 10) {
    const [currentPage, setCurrentPage] = useState(1);

    // Calculate total pages
    const totalPages = Math.ceil(items.length / itemsPerPage);

    // Get current page items
    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return items.slice(startIndex, endIndex);
    }, [items, currentPage, itemsPerPage]);

    // Navigation functions
    const goToPage = (page) => {
        const pageNumber = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(pageNumber);
    };

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const goToFirstPage = () => setCurrentPage(1);
    const goToLastPage = () => setCurrentPage(totalPages);

    // Helper flags
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    // Page range for pagination UI
    const getPageRange = (delta = 2) => {
        const range = [];
        const start = Math.max(1, currentPage - delta);
        const end = Math.min(totalPages, currentPage + delta);

        for (let i = start; i <= end; i++) {
            range.push(i);
        }

        return range;
    };

    return {
        currentPage,
        totalPages,
        paginatedItems,
        goToPage,
        nextPage,
        prevPage,
        goToFirstPage,
        goToLastPage,
        hasNextPage,
        hasPrevPage,
        getPageRange,
        totalItems: items.length,
        itemsPerPage,
        startIndex: (currentPage - 1) * itemsPerPage + 1,
        endIndex: Math.min(currentPage * itemsPerPage, items.length)
    };
}

export default usePagination;
