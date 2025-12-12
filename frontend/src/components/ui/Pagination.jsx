import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Pagination component for navigating through pages
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Current active page
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {number} props.siblingCount - Number of page buttons to show on each side (default: 1)
 * @param {boolean} props.showFirstLast - Show first/last page buttons (default: true)
 */
const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    siblingCount = 1,
    showFirstLast = true,
    className = ''
}) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
        const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

        const showLeftDots = leftSiblingIndex > 2;
        const showRightDots = rightSiblingIndex < totalPages - 1;

        // Always show first page
        pages.push(1);

        if (showLeftDots) {
            pages.push('...');
        }

        // Show middle pages
        for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
            if (i !== 1 && i !== totalPages) {
                pages.push(i);
            }
        }

        if (showRightDots) {
            pages.push('...');
        }

        // Always show last page
        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className={`pagination ${className}`}>
            <div className="pagination-container">
                {/* First page button */}
                {showFirstLast && (
                    <button
                        className="pagination-button"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        aria-label="First page"
                    >
                        <ChevronsLeft size={18} />
                    </button>
                )}

                {/* Previous page button */}
                <button
                    className="pagination-button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                >
                    <ChevronLeft size={18} />
                </button>

                {/* Page numbers */}
                <div className="pagination-numbers">
                    {pageNumbers.map((page, index) => {
                        if (page === '...') {
                            return (
                                <span key={`dots-${index}`} className="pagination-dots">
                                    ...
                                </span>
                            );
                        }

                        return (
                            <button
                                key={page}
                                className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                                onClick={() => onPageChange(page)}
                                aria-label={`Page ${page}`}
                                aria-current={currentPage === page ? 'page' : undefined}
                            >
                                {page}
                            </button>
                        );
                    })}
                </div>

                {/* Next page button */}
                <button
                    className="pagination-button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                >
                    <ChevronRight size={18} />
                </button>

                {/* Last page button */}
                {showFirstLast && (
                    <button
                        className="pagination-button"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        aria-label="Last page"
                    >
                        <ChevronsRight size={18} />
                    </button>
                )}
            </div>

            {/* Page info */}
            <div className="pagination-info">
                Page {currentPage} of {totalPages}
            </div>
        </div>
    );
};

export default Pagination;
