import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BellRing,
  Check,
  CheckCircle,
  Clock,
  RefreshCw,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  fetchAlerts,
  acknowledgeAlert,
  resolveAlert,
  Alert,
} from "@/services/spcApi";
import { useAlertsWebSocket } from "@/hooks/useAlertsWebSocket";

interface AlertsSectionProps {
  machineId?: string;
  onNewRealtimeAlert?: (alert: Alert) => void;
}

export const AlertsSection = ({
  machineId,
  onNewRealtimeAlert,
}: AlertsSectionProps) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAlertId, setProcessingAlertId] = useState<string | null>(null);

  // WebSocket for real-time alerts
  const {
    isConnected,
    realtimeAlerts,
    clearRealtimeAlerts,
    connectionError,
    reconnect,
  } = useAlertsWebSocket({
    machineId,
    onNewAlert: onNewRealtimeAlert,
  });

  const loadAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAlerts(machineId, undefined, 1, 50);
      setAlerts(response.data || []);
    } catch (err) {
      console.error("Error loading alerts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [machineId]);

  // Combine realtime alerts with fetched alerts
  const allAlerts = [...realtimeAlerts, ...alerts].reduce((acc, alert) => {
    if (!acc.find((a) => a.alert_id === alert.alert_id)) {
      acc.push(alert);
    }
    return acc;
  }, [] as Alert[]);

  const handleAcknowledge = async (alertId: string) => {
    setProcessingAlertId(alertId);
    try {
      await acknowledgeAlert(alertId, "operator");
      // Update local state
      setAlerts((prev) =>
        prev.map((a) =>
          a.alert_id === alertId
            ? { ...a, status: "acknowledged", acknowledged_at: new Date().toISOString() }
            : a
        )
      );
    } catch (err) {
      console.error("Error acknowledging alert:", err);
    } finally {
      setProcessingAlertId(null);
    }
  };

  const handleResolve = async (alertId: string) => {
    setProcessingAlertId(alertId);
    try {
      await resolveAlert(alertId, "operator");
      // Update local state
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

  const getSeverityIcon = (severity: string | null) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
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

  const formatAlertTitle = (alert: Alert) => {
    const value = alert.value?.toFixed(4);
    const machineName = alert.item || "Item";

    switch (alert.alert_type) {
      case "below_lower_limit":
        return `${machineName}: El valor ${value} debajo del límite inferior`;
      case "above_upper_limit":
        return `${machineName}: El valor ${value} supera el límite superior`;
      case "out_of_spec":
        return `${machineName}: El valor ${value} fuera de especificación`;
      case "out_of_control":
        return `${machineName}: El valor ${value} fuera de control`;
      case "trend":
        return `${machineName}: Tendencia detectada en valor ${value}`;
      default:
        return `${machineName}: Alerta - ${alert.alert_type}`;
    }
  };

  const pendingAlerts = allAlerts.filter(
    (a) => a.status !== "resolved" && a.status !== "acknowledged"
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <BellRing className="h-6 w-6 text-primary" />
              {pendingAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {pendingAlerts.length > 9 ? "9+" : pendingAlerts.length}
                </span>
              )}
            </div>
            <div>
              <CardTitle>Alertas en Tiempo Real</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">Conectado</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-500" />
                    <span className="text-red-600">Desconectado</span>
                  </>
                )}
                {connectionError && (
                  <span className="text-red-500 text-xs ml-2">
                    {connectionError}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {realtimeAlerts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRealtimeAlerts}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar nuevas
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadAlerts}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`}
              />
              Actualizar
            </Button>
            {!isConnected && (
              <Button variant="outline" size="sm" onClick={reconnect}>
                <Wifi className="h-4 w-4 mr-1" />
                Reconectar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && alerts.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando alertas...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-destructive">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={loadAlerts} className="mt-2">
                Reintentar
              </Button>
            </div>
          </div>
        ) : allAlerts.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">Sin alertas activas</p>
              <p className="text-sm">
                El sistema está funcionando correctamente
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {allAlerts.map((alert, index) => {
                const isRealtime = realtimeAlerts.some(
                  (a) => a.alert_id === alert.alert_id
                );
                return (
                  <div
                    key={alert.alert_id}
                    className={`p-4 rounded-lg border transition-all ${isRealtime
                        ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 animate-pulse"
                        : alert.status === "resolved"
                          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                          : alert.status === "acknowledged"
                            ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                            : "bg-card border-border hover:bg-muted/50"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">
                            {formatAlertTitle(alert)}
                          </span>
                          {getSeverityBadge(alert.severity)}
                          {getStatusBadge(alert.status)}
                          {isRealtime && (
                            <Badge className="bg-red-500 animate-pulse">
                              ¡Nueva!
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground space-y-1">
                          <p>
                            <span className="font-medium">Item:</span>{" "}
                            {alert.item || "N/A"} - {alert.column_name || "N/A"}
                          </p>
                          <p>
                            <span className="font-medium">Valor:</span>{" "}
                            <span className="text-destructive font-semibold">
                              {alert.value?.toFixed(4)}
                            </span>{" "}
                            | Nominal: {alert.nominal?.toFixed(4)} | Límites: [
                            {alert.lower_limit?.toFixed(4)},{" "}
                            {alert.upper_limit?.toFixed(4)}]
                          </p>
                          <p>
                            <span className="font-medium">Desviación:</span>{" "}
                            <span
                              className={
                                Math.abs(alert.deviation) > 0.05
                                  ? "text-destructive"
                                  : "text-yellow-600"
                              }
                            >
                              {alert.deviation > 0 ? "+" : ""}
                              {alert.deviation?.toFixed(4)}
                            </span>
                          </p>
                          <p className="text-xs">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {format(
                              new Date(alert.created_at),
                              "dd/MM/yyyy HH:mm:ss",
                              { locale: es }
                            )}
                          </p>
                        </div>
                      </div>
                      {alert.status !== "resolved" && (
                        <div className="flex flex-col gap-2">
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
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
