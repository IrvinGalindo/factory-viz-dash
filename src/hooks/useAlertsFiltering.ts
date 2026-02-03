import { useState, useCallback, useMemo } from "react";
import { Alert } from "@/services/spcApi";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export const useAlertsFiltering = (alerts: Alert[]) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Filter by machine
      if (selectedMachineId !== "all" && alert.machine_id !== selectedMachineId) {
        return false;
      }

      // Filter by status
      if (selectedStatus !== "all" && alert.status !== selectedStatus) {
        return false;
      }

      // Filter by date range
      if (dateRange.from) {
        const alertDate = new Date(alert.created_at);
        if (alertDate < dateRange.from) return false;
        if (dateRange.to && alertDate > dateRange.to) return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesItem = alert.item?.toLowerCase().includes(query);
        const matchesColumn = alert.column_name?.toLowerCase().includes(query);
        const matchesProcess = alert.process_number?.toLowerCase().includes(query);
        if (!matchesItem && !matchesColumn && !matchesProcess) return false;
      }

      return true;
    });
  }, [alerts, selectedMachineId, selectedStatus, dateRange, searchQuery]);

  const clearFilters = useCallback(() => {
    setSelectedMachineId("all");
    setSelectedStatus("all");
    setDateRange({ from: undefined, to: undefined });
    setSearchQuery("");
  }, []);

  const hasActiveFilters = useMemo(
    () => {
      const hasDateRange = dateRange.from !== undefined || dateRange.to !== undefined;
      return (
        selectedMachineId !== "all" ||
        selectedStatus !== "all" ||
        hasDateRange ||
        searchQuery.length > 0
      );
    },
    [selectedMachineId, selectedStatus, dateRange, searchQuery]
  );

  return {
    filteredAlerts,
    selectedMachineId,
    setSelectedMachineId,
    selectedStatus,
    setSelectedStatus,
    dateRange,
    setDateRange,
    searchQuery,
    setSearchQuery,
    clearFilters,
    hasActiveFilters,
  };
};
