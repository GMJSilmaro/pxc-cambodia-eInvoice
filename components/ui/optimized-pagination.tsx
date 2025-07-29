"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from './responsive-layout';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  className?: string;
  showItemsPerPage?: boolean;
  showTotalItems?: boolean;
  itemsPerPageOptions?: number[];
  maxVisiblePages?: number;
}

export function OptimizedPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className,
  showItemsPerPage = true,
  showTotalItems = true,
  itemsPerPageOptions = [10, 25, 50, 100],
  maxVisiblePages = 5
}: PaginationProps) {
  const isMobile = useIsMobile();

  // Calculate visible page numbers
  const visiblePages = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = isMobile ? 3 : maxVisiblePages;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      const startPage = Math.max(2, currentPage - Math.floor(maxVisible / 2));
      const endPage = Math.min(totalPages - 1, startPage + maxVisible - 3);
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push('ellipsis');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push('ellipsis');
      }
      
      // Always show last page if more than 1 page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [currentPage, totalPages, maxVisiblePages, isMobile]);

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1 && !showTotalItems) {
    return null;
  }

  return (
    <div className={cn(
      'flex flex-col sm:flex-row items-center justify-between gap-4 py-4',
      className
    )}>
      {/* Items info and per-page selector */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600">
        {showTotalItems && (
          <span className="whitespace-nowrap">
            Showing {startItem} to {endItem} of {totalItems} results
          </span>
        )}
        
        {showItemsPerPage && onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">Items per page:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
            >
              <SelectTrigger className="w-20 h-8 bg-white border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {itemsPerPageOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Previous button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            {!isMobile && <span className="ml-1">Previous</span>}
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1 mx-2">
            {visiblePages.map((page, index) => (
              page === 'ellipsis' ? (
                <div
                  key={`ellipsis-${index}`}
                  className="flex items-center justify-center w-8 h-8 text-gray-400"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className={cn(
                    "w-8 h-8 p-0",
                    currentPage === page
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </Button>
              )
            ))}
          </div>

          {/* Next button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            aria-label="Go to next page"
          >
            {!isMobile && <span className="mr-1">Next</span>}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Simplified mobile pagination
export function MobilePagination({
  currentPage,
  totalPages,
  onPageChange,
  className
}: Pick<PaginationProps, 'currentPage' | 'totalPages' | 'onPageChange' | 'className'>) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn('flex items-center justify-between py-4', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>

      <span className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

// Hook for pagination state management
export function usePagination(
  totalItems: number,
  initialItemsPerPage: number = 25
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    // Reset to first page when changing items per page
    setCurrentPage(1);
  };

  const reset = () => {
    setCurrentPage(1);
  };

  // Calculate pagination slice for data
  const getSlice = <T,>(data: T[]): T[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    handlePageChange,
    handleItemsPerPageChange,
    reset,
    getSlice,
    // Pagination info
    startItem: (currentPage - 1) * itemsPerPage + 1,
    endItem: Math.min(currentPage * itemsPerPage, totalItems),
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  };
}
