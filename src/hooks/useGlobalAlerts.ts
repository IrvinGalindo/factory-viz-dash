import { useCallback } from "react";
import { toast } from "sonner";
import { useAlertsWebSocket } from "@/hooks/useAlertsWebSocket";
import { useAlertSound } from "@/hooks/useAlertSound";
import { Alert } from "@/services/spcApi";

interface UseGlobalAlertsOptions {
  enabled?: boolean;
}

export const useGlobalAlerts = ({ enabled = true }: UseGlobalAlertsOptions = {}) => {
  const { playAlertSound } = useAlertSound();

  const handleNewRealtimeAlert = useCallback((alert: Alert) => {
    // Play alert sound
    playAlertSound(alert.severity);
    
    // Format alert message
    const value = alert.value?.toFixed(4);
    const alertTypeText = alert.alert_type === "below_lower_limit"
      ? `El valor ${value} debajo del límite inferior`
      : alert.alert_type === "above_upper_limit"
      ? `El valor ${value} supera el límite superior`
      : alert.alert_type === "out_of_spec" 
      ? `El valor ${value} fuera de especificación` 
      : alert.alert_type === "out_of_control"
      ? `El valor ${value} fuera de control`
      : `Alerta: ${alert.alert_type}`;
    
    toast.error(`🚨 ${alert.item || "Item"}: ${alertTypeText}`, {
      description: `Límites: [${alert.lower_limit?.toFixed(4)}, ${alert.upper_limit?.toFixed(4)}] | Desviación: ${alert.deviation?.toFixed(4)}`,
      duration: 10000,
      action: {
        label: "Ver Alertas",
        onClick: () => {
          window.location.href = "/alerts";
        },
      },
    });
  }, [playAlertSound]);

  // Connect to WebSocket for real-time alerts (global, no machine filter)
  const { isConnected, realtimeAlerts, connectionError, reconnect } = useAlertsWebSocket({
    onNewAlert: enabled ? handleNewRealtimeAlert : undefined,
  });

  return {
    isConnected,
    realtimeAlerts,
    connectionError,
    reconnect,
  };
};
