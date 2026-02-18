import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Filter } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface AlertsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedMachineId: string;
  onMachineChange: (machineId: string) => void;
  machines: Array<{ machine_id: string; line: string; cmm_name: string }>;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  dateOpen: boolean;
  onDateOpenChange: (open: boolean) => void;
}

export const AlertsFilters = memo(
  ({
    searchQuery,
    onSearchChange,
    selectedMachineId,
    onMachineChange,
    machines,
    selectedStatus,
    onStatusChange,
    dateRange,
    onDateRangeChange,
    hasActiveFilters,
    onClearFilters,
    dateOpen,
    onDateOpenChange,
  }: AlertsFiltersProps) => {
    const { t } = useLanguage();
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t('filters')}
          </h3>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-1" />
              {t('clear_filters')}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Machine filter */}
          <Select value={selectedMachineId} onValueChange={onMachineChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('all_machines')} />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">{t('all_machines')}</SelectItem>
              {machines.map((machine) => (
                <SelectItem key={machine.machine_id} value={machine.machine_id}>
                  {machine.line}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('all_statuses')} />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">{t('all_statuses')}</SelectItem>
              <SelectItem value="active">{t('status_pending')}</SelectItem>
              <SelectItem value="acknowledged">{t('status_acknowledged')}</SelectItem>
              <SelectItem value="resolved">{t('status_resolved')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Date range filter */}
          <Popover open={dateOpen} onOpenChange={onDateOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy")} -{" "}
                      {format(dateRange.to, "dd/MM/yy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy")
                  )
                ) : (
                  t('date_range')
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) =>
                  onDateRangeChange({
                    from: range?.from,
                    to: range?.to,
                  })
                }
                numberOfMonths={2}
                locale={es}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );
  }
);

AlertsFilters.displayName = "AlertsFilters";
