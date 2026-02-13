import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

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

    return (
      <div className="flex items-center justify-between border-t p-4">
        <div className="text-sm text-muted-foreground">
          {t('showing_machines')
            .replace('{start}', (startIndex + 1).toString())
            .replace('{end}', Math.min(endIndex, totalItems).toString())
            .replace('{total}', totalItems.toString())
            .replace('máquinas', t('alert_list').split(' ')[2] || 'alertas') // Quick hack or better add a generic showing_items key
          }
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            {t('previous')}
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={currentPage === totalPages}
          >
            {t('next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
);

AlertsPagination.displayName = "AlertsPagination";
