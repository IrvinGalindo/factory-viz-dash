import { useCallback, createContext, useContext, useRef, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { useAlertSound } from "@/hooks/useAlertSound";
import { Alert, getAlertsWebSocketUrl } from "@/services/spcApi";

interface GlobalAlertsContextType {
  isConnected: boolean;
  connectionError: string | null;
  sendMessage: (message: object) => void;
}

const GlobalAlertsContext = createContext<GlobalAlertsContextType | null>(null);

export const useGlobalAlertsContext = () => {
  const context = useContext(GlobalAlertsContext);
  if (!context) {
    throw new Error("useGlobalAlertsContext must be used within GlobalAlertsProvider");
  }
  return context;
};

interface GlobalAlertsProviderProps {
  children: ReactNode;
}

export const GlobalAlertsProvider = ({ children }: GlobalAlertsProviderProps) => {
  const { playAlertSound } = useAlertSound();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedAlertsRef = useRef<Set<string>>(new Set());

  const handleNewRealtimeAlert = useCallback((alert: Alert) => {
    // Deduplicate alerts by alert_id
    if (processedAlertsRef.current.has(alert.alert_id)) {
      return;
    }
    processedAlertsRef.current.add(alert.alert_id);
    
    // Clean old alerts after 1 minute to prevent memory leak
    setTimeout(() => {
      processedAlertsRef.current.delete(alert.alert_id);
    }, 60000);

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

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = getAlertsWebSocketUrl();
      console.log("🔌 [Global] Conectando al WebSocket de alertas:", wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("✅ [Global] WebSocket de alertas conectado");
        setIsConnected(true);
        setConnectionError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === "alert" && message.data) {
            const alertData = message.data;
            const alert: Alert = {
              alert_id: alertData.alert_id,
              machine_id: "",
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
            handleNewRealtimeAlert(alert);
          } else if (message.alert_id) {
            handleNewRealtimeAlert(message as Alert);
          } else if (message.type === "ping" || message.type === "connection") {
            console.log("🏓 [Global] Mensaje de sistema:", message.type);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ [Global] Error en WebSocket:", error);
        setConnectionError("Error de conexión WebSocket");
      };

      ws.onclose = (event) => {
        console.log("🔌 [Global] WebSocket desconectado:", event.code);
        setIsConnected(false);
        wsRef.current = null;

        console.log("🔄 [Global] Reconectando en 5s...");
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Error al crear WebSocket:", error);
      setConnectionError("No se pudo establecer la conexión");
    }
  }, [handleNewRealtimeAlert]);

  const sendMessage = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log("📤 [Global] Mensaje enviado:", message);
    } else {
      console.warn("⚠️ WebSocket no conectado");
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return (
    <GlobalAlertsContext.Provider value={{ isConnected, connectionError, sendMessage }}>
      {children}
    </GlobalAlertsContext.Provider>
  );
};
