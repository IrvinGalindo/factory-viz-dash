import { memo } from "react";
import { Button } from "@/components/ui/button"; // Keep button for consistency if needed, but we are replacing it.
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface AlertsPaginationProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageChange: (page: number) => void;
}

export const AlertsPagination = memo(

  ({
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
    onPreviousPage,
    onNextPage,
    onPageChange,
  }: AlertsPaginationProps) => {
    const { t } = useLanguage();
    if (totalPages === 0) return null;

    const getPageNumbers = () => {
      const pages = [];
      const showMax = 5;

      if (totalPages <= showMax) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);

        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);

        if (currentPage <= 3) {
          endPage = 4;
          startPage = 2;
        } else if (currentPage >= totalPages - 2) {
          startPage = totalPages - 3;
          endPage = totalPages - 1;
        }

        if (startPage > 2) {
          pages.push('ellipsis-start');
        }

        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }

        if (endPage < totalPages - 1) {
          pages.push('ellipsis-end');
        }

        pages.push(totalPages);
      }
      return pages;
    };

    return (
      <div className="flex flex-col md:flex-row items-center justify-between border-t p-4 gap-4 md:gap-0">
        <div className="text-sm text-muted-foreground text-center md:text-left">
          {t('showing_machines')
            .replace('{start}', (startIndex + 1).toString())
            .replace('{end}', Math.min(endIndex, totalItems).toString())
            .replace('{total}', totalItems.toString())
            .replace('máquinas', t('alert_list').split(' ')[2] || 'alertas')
          }
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) onPreviousPage();
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {getPageNumbers().map((page, index) => {
              if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              return (
                <PaginationItem key={page} className="hidden md:block">
                  <PaginationLink
                    href="#"
                    isActive={currentPage === page}
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(page as number);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            {/* Mobile current page indicator - simplified */}
            <PaginationItem className="md:hidden">
              <span className="flex h-9 min-w-9 items-center justify-center text-sm font-medium">
                {currentPage} / {totalPages}
              </span>
            </PaginationItem>

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) onNextPage();
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  }
);

AlertsPagination.displayName = "AlertsPagination";
