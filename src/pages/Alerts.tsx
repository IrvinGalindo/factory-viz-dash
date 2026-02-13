import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAlerts, fetchSPCMachines, Alert } from "@/services/spcApi";
import { useAlertsFiltering } from "@/hooks/useAlertsFiltering";
import { useAlertsPagination } from "@/hooks/useAlertsPagination";
import { useAlertsActions } from "@/hooks/useAlertsActions";
import { useAlertsStats } from "@/hooks/useAlertsStats";
import { AlertsStats } from "@/components/alerts/AlertsStats";
import { AlertsFilters } from "@/components/alerts/AlertsFilters";
import { AlertsTable } from "@/components/alerts/AlertsTable";
import { AlertsPagination } from "@/components/alerts/AlertsPagination";

const AlertsPage = () => {
  // State management
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    page: 1,
    page_size: 20,
    total_pages: 1,
  });
  const [machines, setMachines] = useState<
    Array<{ machine_id: string; line: string; cmm_name: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [dateOpen, setDateOpen] = useState(false);

  // Custom hooks for filtering, pagination, actions and stats
  const {
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
  } = useAlertsFiltering(alerts);

  const {
    currentPage,
    totalPages,
    paginationInfo,
    handleNextPage,
    handlePreviousPage,
    handlePageChange,
    resetPage,
  } = useAlertsPagination(filteredAlerts.length);

  const {
    processingAlertId,
    alertComments,
    resolveNotes,
    handleAcknowledge,
    handleResolve,
    handleCommentChange,
    handleResolveNoteChange,
  } = useAlertsActions(alerts, setAlerts);

  const stats = useAlertsStats(filteredAlerts);

  // Compute paginated alerts
  const paginatedAlerts = filteredAlerts.slice(
    paginationInfo.startIndex,
    paginationInfo.endIndex
  );

  // Load machines on mount
  useEffect(() => {
    const loadMachines = async () => {
      try {
        const data = await fetchSPCMachines();
        setMachines(data);
      } catch (err) {
        console.error("Error loading machines:", err);
      }
    };
    loadMachines();
  }, []);

  const loadAlerts = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const machineId =
        selectedMachineId === "all" ? undefined : selectedMachineId;
      const status = selectedStatus === "all" ? undefined : selectedStatus;
      const response = await fetchAlerts(machineId, status, page, 20);


      // New PaginatedResponse structure: response.data contains the array directly
      console.log("Alerts API Response:", response);
      console.log("Alerts data array:", response.data);
      const alertsData = response.data || [];
      console.log("Setting alerts to:", alertsData);
      setAlerts(alertsData);

      // Save pagination metadata from API
      if (response.pagination) {
        setPaginationMeta(response.pagination);
        console.log("Pagination metadata:", response.pagination);
      }
    } catch (err) {
      console.error("Error loading alerts:", err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMachineId, selectedStatus]);

  useEffect(() => {
    loadAlerts(1);
  }, [selectedMachineId, selectedStatus]);

  // Debug logging
  useEffect(() => {
    console.log("Alerts state:", alerts);
    console.log("Filtered alerts:", filteredAlerts);
    console.log("Filtered alerts length:", filteredAlerts.length);
  }, [alerts, filteredAlerts]);

  // Custom pagination handlers that call API
  const handlePageChangeCustom = useCallback((page: number) => {
    loadAlerts(page);
  }, [loadAlerts]);

  const handleNextPageCustom = useCallback(() => {
    if (paginationMeta.page < paginationMeta.total_pages) {
      loadAlerts(paginationMeta.page + 1);
    }
  }, [paginationMeta.page, paginationMeta.total_pages, loadAlerts]);

  const handlePreviousPageCustom = useCallback(() => {
    if (paginationMeta.page > 1) {
      loadAlerts(paginationMeta.page - 1);
    }
  }, [paginationMeta.page, loadAlerts]);

  // Handle clearing filters and resetting pagination
  const handleClearFilters = useCallback(() => {
    clearFilters();
    resetPage();
  }, [clearFilters, resetPage]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gestión de Alertas
            </h1>
            <p className="text-muted-foreground">
              Historial completo de alertas del sistema
            </p>
          </div>
          <Button onClick={() => loadAlerts()} disabled={loading}>
            <RefreshCw
              className={cn("h-4 w-4 mr-2", loading && "animate-spin")}
            />
            Actualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <AlertsStats
          total={stats.total}
          pending={stats.pending}
          acknowledged={stats.acknowledged}
          resolved={stats.resolved}
        />

        {/* Filters Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertsFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedMachineId={selectedMachineId}
              onMachineChange={setSelectedMachineId}
              machines={machines}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
              dateOpen={dateOpen}
              onDateOpenChange={setDateOpen}
            />
          </CardContent>
        </Card>

        {/* Alerts Table Card */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Alertas</CardTitle>
            <CardDescription>
              Total: {paginationMeta.total} alertas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Cargando alertas...</p>
                </div>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">No hay alertas</p>
                  <p className="text-sm">
                    {hasActiveFilters
                      ? "No se encontraron alertas con los filtros seleccionados"
                      : "El sistema está funcionando correctamente"}
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <AlertsTable
                  alerts={paginatedAlerts}
                  machines={machines}
                  processingAlertId={processingAlertId}
                  alertComments={alertComments}
                  resolveNotes={resolveNotes}
                  onCommentChange={handleCommentChange}
                  onResolveNoteChange={handleResolveNoteChange}
                  onAcknowledge={handleAcknowledge}
                  onResolve={handleResolve}
                />
              </ScrollArea>
            )}
          </CardContent>
          {!loading && filteredAlerts.length > 0 && (
            <AlertsPagination
              currentPage={paginationMeta.page}
              totalPages={paginationMeta.total_pages}
              startIndex={(paginationMeta.page - 1) * paginationMeta.page_size + 1}
              endIndex={Math.min(paginationMeta.page * paginationMeta.page_size, paginationMeta.total)}
              totalItems={paginationMeta.total}
              onPreviousPage={handlePreviousPageCustom}
              onNextPage={handleNextPageCustom}
              onPageChange={handlePageChangeCustom}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default AlertsPage;
