import { useState, useEffect, useCallback, useRef } from "react";
import { getAlertsWebSocketUrl, Alert } from "@/services/spcApi";

interface UseAlertsWebSocketOptions {
  machineId?: string;
  onNewAlert?: (alert: Alert) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

interface UseAlertsWebSocketReturn {
  isConnected: boolean;
  realtimeAlerts: Alert[];
  clearRealtimeAlerts: () => void;
  connectionError: string | null;
  reconnect: () => void;
}

export const useAlertsWebSocket = ({
  machineId,
  onNewAlert,
  autoReconnect = true,
  reconnectInterval = 5000,
}: UseAlertsWebSocketOptions = {}): UseAlertsWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeAlerts, setRealtimeAlerts] = useState<Alert[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  const clearRealtimeAlerts = useCallback(() => {
    setRealtimeAlerts([]);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      let wsUrl = getAlertsWebSocketUrl();
      if (machineId) {
        wsUrl += `?machine_id=${encodeURIComponent(machineId)}`;
      }

      console.log("🔌 Conectando al WebSocket de alertas:", wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("✅ WebSocket de alertas conectado");
        setIsConnected(true);
        setConnectionError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("📨 Alerta recibida en tiempo real:", message);
          
          // Handle different message types
          if (message.type === "alert" && message.data) {
            // WebSocket sends { type: "alert", timestamp: "...", data: { alert fields } }
            const alertData = message.data;
            const alert: Alert = {
              alert_id: alertData.alert_id,
              machine_id: machineId || "",
              process_id: alertData.process_id || "",
              result_process_id: alertData.result_process_id || "",
              process_number: alertData.processNumber || alertData.process_number || null,
              item: alertData.item || null,
              column_name: alertData.columnName || alertData.column_name || null,
              alert_type: alertData.alert_type,
              value: alertData.value,
              nominal: alertData.nominal,
              upper_limit: alertData.upper_limit,
              lower_limit: alertData.lower_limit,
              deviation: alertData.deviation,
              measurement_index: alertData.measurement_index,
              status: alertData.status || "pending",
              severity: alertData.severity || null,
              notes: alertData.notes || null,
              created_at: message.timestamp || new Date().toISOString(),
              acknowledged_at: null,
              acknowledged_by: null,
              resolved_at: null,
              resolved_by: null,
            };
            setRealtimeAlerts((prev) => [alert, ...prev]);
            onNewAlert?.(alert);
          } else if (message.alert_id) {
            // Direct alert object format
            const alert: Alert = {
              ...message,
              created_at: message.created_at || new Date().toISOString(),
            };
            setRealtimeAlerts((prev) => [alert, ...prev]);
            onNewAlert?.(alert);
          } else if (message.type === "ping" || message.type === "connection") {
            // Handle ping/keep-alive and connection messages
            console.log("🏓 Mensaje de sistema recibido:", message.type);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ Error en WebSocket:", error);
        setConnectionError("Error de conexión WebSocket");
      };

      ws.onclose = (event) => {
        console.log("🔌 WebSocket desconectado:", event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        if (autoReconnect && shouldReconnectRef.current) {
          console.log(`🔄 Reconectando en ${reconnectInterval / 1000}s...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Error al crear WebSocket:", error);
      setConnectionError("No se pudo establecer la conexión");
    }
  }, [machineId, onNewAlert, autoReconnect, reconnectInterval]);

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    realtimeAlerts,
    clearRealtimeAlerts,
    connectionError,
    reconnect,
  };
};

