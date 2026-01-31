import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CalendarIcon,
  Check,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  fetchAlerts,
  fetchSPCMachines,
  acknowledgeAlert,
  resolveAlert,
  Alert,
  getAlertsWebSocketUrl,
} from "@/services/spcApi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const AlertsPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [machines, setMachines] = useState<Array<{ machine_id: string; line: string; cmm_name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [processingAlertId, setProcessingAlertId] = useState<string | null>(null);
  const [alertComments, setAlertComments] = useState<Record<string, string>>({});
  const wsRef = useRef<WebSocket | null>(null);

  // Filters
  const [selectedMachineId, setSelectedMachineId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [dateOpen, setDateOpen] = useState(false);

  // WebSocket connection for sending acknowledgments with comments
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = getAlertsWebSocketUrl();
      console.log("🔌 Conectando WebSocket para enviar comentarios:", wsUrl);
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log("✅ WebSocket conectado para envío de comentarios");
      };
      
      ws.onerror = (error) => {
        console.error("❌ Error en WebSocket:", error);
      };
      
      ws.onclose = () => {
        console.log("🔌 WebSocket desconectado, reconectando en 5s...");
        setTimeout(connectWebSocket, 5000);
      };
      
      wsRef.current = ws;
    };
    
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendAlertAcknowledgmentViaWebSocket = (alert: Alert, comment: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: "alert_acknowledgment",
        timestamp: new Date().toISOString(),
        data: {
          alert_id: alert.alert_id,
          machine_id: alert.machine_id,
          process_id: alert.process_id,
          result_process_id: alert.result_process_id,
          process_number: alert.process_number,
          item: alert.item,
          column_name: alert.column_name,
          alert_type: alert.alert_type,
          value: alert.value,
          nominal: alert.nominal,
          upper_limit: alert.upper_limit,
          lower_limit: alert.lower_limit,
          deviation: alert.deviation,
          comment: comment,
          acknowledged_by: "operator",
          acknowledged_at: new Date().toISOString(),
        },
      };
      
      wsRef.current.send(JSON.stringify(message));
      console.log("📤 Enviado reconocimiento por WebSocket:", message);
      toast.success("Comentario enviado correctamente");
    } else {
      console.warn("⚠️ WebSocket no conectado, no se pudo enviar el comentario");
      toast.warning("WebSocket no conectado, el comentario se guardó localmente");
    }
  };

  // Load machines
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

  // Load alerts
  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const machineId = selectedMachineId === "all" ? undefined : selectedMachineId;
      const status = selectedStatus === "all" ? undefined : selectedStatus;
      const response = await fetchAlerts(machineId, status, 1, 100);
      
      // The API might return an array directly or an object with alerts property
      const alertsData = Array.isArray(response) ? response : response.alerts || [];
      setAlerts(alertsData);
    } catch (err) {
      console.error("Error loading alerts:", err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMachineId, selectedStatus]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Filter alerts by date and search
  const filteredAlerts = alerts.filter((alert) => {
    // Date filter
    if (dateRange.from) {
      const alertDate = new Date(alert.created_at);
      if (alertDate < dateRange.from) return false;
      if (dateRange.to && alertDate > dateRange.to) return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesItem = alert.item?.toLowerCase().includes(query);
      const matchesColumn = alert.column_name?.toLowerCase().includes(query);
      const matchesProcess = alert.process_number?.toLowerCase().includes(query);
      if (!matchesItem && !matchesColumn && !matchesProcess) return false;
    }

    return true;
  });

  const handleAcknowledge = async (alertId: string) => {
    setProcessingAlertId(alertId);
    const comment = alertComments[alertId] || "";
    
    try {
      // Find the alert to send via WebSocket
      const alertToAcknowledge = alerts.find(a => a.alert_id === alertId);
      
      await acknowledgeAlert(alertId, "operator");
      
      // Send via WebSocket with the comment
      if (alertToAcknowledge) {
        sendAlertAcknowledgmentViaWebSocket(alertToAcknowledge, comment);
      }
      
      setAlerts((prev) =>
        prev.map((a) =>
          a.alert_id === alertId
            ? { ...a, status: "acknowledged", acknowledged_at: new Date().toISOString(), notes: comment }
            : a
        )
      );
      
      // Clear the comment after acknowledging
      setAlertComments((prev) => {
        const updated = { ...prev };
        delete updated[alertId];
        return updated;
      });
    } catch (err) {
      console.error("Error acknowledging alert:", err);
    } finally {
      setProcessingAlertId(null);
    }
  };

  const handleCommentChange = (alertId: string, comment: string) => {
    setAlertComments((prev) => ({
      ...prev,
      [alertId]: comment,
    }));
  };

  const handleResolve = async (alertId: string) => {
    setProcessingAlertId(alertId);
    try {
      await resolveAlert(alertId, "operator");
      setAlerts((prev) =>
        prev.map((a) =>
          a.alert_id === alertId
            ? { ...a, status: "resolved", resolved_at: new Date().toISOString() }
            : a
        )
      );
    } catch (err) {
      console.error("Error resolving alert:", err);
    } finally {
      setProcessingAlertId(null);
    }
  };

  const getMachineName = (machineId: string) => {
    const machine = machines.find((m) => m.machine_id === machineId);
    return machine?.line || machineId;
  };

  const formatAlertTitle = (alert: Alert) => {
    const machineName = getMachineName(alert.machine_id);
    const value = alert.value?.toFixed(4);
    
    if (alert.alert_type === "below_lower_limit") {
      return `${machineName}: El valor ${value} debajo del límite inferior`;
    } else if (alert.alert_type === "above_upper_limit") {
      return `${machineName}: El valor ${value} supera el límite superior`;
    } else if (alert.alert_type === "out_of_spec") {
      return `${machineName}: El valor ${value} fuera de especificación`;
    } else if (alert.alert_type === "out_of_control") {
      return `${machineName}: El valor ${value} fuera de control`;
    } else if (alert.alert_type === "trend") {
      return `${machineName}: Tendencia detectada en valor ${value}`;
    }
    return `${machineName}: Alerta - ${alert.alert_type}`;
  };

  const getSeverityBadge = (severity: string | null) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Crítico</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Advertencia</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "resolved":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resuelto
          </Badge>
        );
      case "acknowledged":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <Check className="h-3 w-3 mr-1" />
            Reconocido
          </Badge>
        );
      default:
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
    }
  };

  const clearFilters = () => {
    setSelectedMachineId("all");
    setSelectedStatus("all");
    setDateRange({ from: undefined, to: undefined });
    setSearchQuery("");
  };

  const hasActiveFilters = selectedMachineId !== "all" || selectedStatus !== "all" || dateRange.from || searchQuery;

  const pendingCount = filteredAlerts.filter(a => a.status !== "resolved" && a.status !== "acknowledged").length;
  const acknowledgedCount = filteredAlerts.filter(a => a.status === "acknowledged").length;
  const resolvedCount = filteredAlerts.filter(a => a.status === "resolved").length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Alertas</h1>
            <p className="text-muted-foreground">
              Historial completo de alertas del sistema
            </p>
          </div>
          <Button onClick={loadAlerts} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Actualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{filteredAlerts.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-orange-500">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Check className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reconocidas</p>
                <p className="text-2xl font-bold text-blue-500">{acknowledgedCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resueltas</p>
                <p className="text-2xl font-bold text-green-500">{resolvedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por item, columna..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Machine filter */}
              <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las máquinas" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">Todas las máquinas</SelectItem>
                  {machines.map((machine) => (
                    <SelectItem key={machine.machine_id} value={machine.machine_id}>
                      {machine.line}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Pendiente</SelectItem>
                  <SelectItem value="acknowledged">Reconocido</SelectItem>
                  <SelectItem value="resolved">Resuelto</SelectItem>
                </SelectContent>
              </Select>

              {/* Date range filter */}
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      "Rango de fechas"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    locale={es}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Alertas</CardTitle>
            <CardDescription>
              {filteredAlerts.length} alertas encontradas
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Alerta</TableHead>
                      <TableHead>Máquina</TableHead>
                      <TableHead>Severidad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlerts.map((alert) => (
                      <TableRow key={alert.alert_id} className="align-top">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {formatAlertTitle(alert)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {alert.item} - {alert.column_name} | Proceso: {alert.process_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Nominal: {alert.nominal?.toFixed(4)} | Límites: [{alert.lower_limit?.toFixed(4)}, {alert.upper_limit?.toFixed(4)}]
                            </p>
                            {alert.notes && (
                              <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                                💬 {alert.notes}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{getMachineName(alert.machine_id)}</span>
                        </TableCell>
                        <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                        <TableCell>{getStatusBadge(alert.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(alert.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {alert.status !== "resolved" && (
                            <div className="space-y-2 min-w-[200px]">
                              {alert.status !== "acknowledged" && (
                                <Textarea
                                  placeholder="Agregar comentario..."
                                  value={alertComments[alert.alert_id] || ""}
                                  onChange={(e) => handleCommentChange(alert.alert_id, e.target.value)}
                                  className="min-h-[60px] text-xs"
                                />
                              )}
                              <div className="flex justify-end gap-2">
                                {alert.status !== "acknowledged" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAcknowledge(alert.alert_id)}
                                    disabled={processingAlertId === alert.alert_id}
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Reconocer
                                  </Button>
                                )}
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleResolve(alert.alert_id)}
                                  disabled={processingAlertId === alert.alert_id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resolver
                                </Button>
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AlertsPage;
