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
          const data = JSON.parse(event.data);
          console.log("📨 Alerta recibida en tiempo real:", data);
          
          // Handle different message types
          if (data.type === "alert" || data.alert_id) {
            const alert: Alert = data.alert || data;
            setRealtimeAlerts((prev) => [alert, ...prev]);
            onNewAlert?.(alert);
          } else if (data.type === "ping") {
            // Handle ping/keep-alive messages
            console.log("🏓 Ping recibido del servidor");
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

