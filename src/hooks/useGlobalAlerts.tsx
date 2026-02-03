import { useCallback, createContext, useContext, useRef, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { useAlertSound } from "@/hooks/useAlertSound";
import { Alert, getAlertsWebSocketUrl } from "@/services/spcApi";

interface GlobalAlertsContextType {
  isConnected: boolean;
  connectionError: string | null;
  sendMessage: (message: object) => void;
}

const GlobalAlertsContext = createContext<GlobalAlertsContextType | undefined>(undefined) as React.Context<GlobalAlertsContextType | undefined>;

export const useGlobalAlertsContext = (): GlobalAlertsContextType => {
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
    // Evitar pop-ups para alertas modificadas (reconocidas, resueltas o actualizadas)
    console.log("Alerta recibida:", alert);
    console.log("Tipo de Alerta:", alert.alert_type);
    if (
      alert.alert_type === "alert_acknowledgment" ||
      alert.alert_type === "alert_resolved" ||
      alert.alert_type === "alert_updated"
    ) {
      console.log("Alerta modificada ignorada:", alert);
      return;
    }

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
    const nominal = alert.nominal?.toFixed(4);
    const deviation = Math.abs(alert.deviation || 0).toFixed(4);
    
    let alertTypeText = "";
    if (alert.alert_type === "below_lower_limit") {
      alertTypeText = `Debajo del límite inferior`;
    } else if (alert.alert_type === "above_upper_limit") {
      alertTypeText = `Supera el límite superior`;
    } else if (alert.alert_type === "out_of_spec") {
      alertTypeText = `Fuera de especificación`;
    } else if (alert.alert_type === "out_of_control") {
      alertTypeText = `Fuera de control`;
    } else {
      alertTypeText = `Alerta`;
    }

    // Construir título con el formato solicitado
    const itemDisplay = alert.item || alert.column_name || "Sistema";
    const processInfo = alert.process_number ? `Proceso ${alert.process_number}` : "Sin proceso";
    const title = `🚨 Alerta: ${processInfo} - ${itemDisplay} - ${alertTypeText}`;
    
    // Descripción más detallada
    const description = `Valor: ${value} | Nominal: ${nominal} | Desviación: ${deviation} | Límites: [${alert.lower_limit?.toFixed(4)}, ${alert.upper_limit?.toFixed(4)}]`;
    
    console.log("✅ Mostrando toast para alerta válida:", { type: alert.alert_type, title, description });
    toast.error(title, {
      description: description,
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
          console.log("Mensaje WebSocket recibido:", message);
          
          const allowedTypes = ["alert", "connection", "pong"];
          if (!allowedTypes.includes(message.type)) {
            console.warn("Mensaje WebSocket ignorado: Tipo no permitido", message.type);
            return;
          }

          if (message.type === "alert" && message.data) {
            const alertData = message.data;
            
            // Deducir el tipo de alerta basándose en el valor y los límites
            let deducedAlertType = alertData.event || "unknown";
            if (!alertData.event) {
              if (alertData.value < alertData.lower_limit) {
                deducedAlertType = "below_lower_limit";
              } else if (alertData.value > alertData.upper_limit) {
                deducedAlertType = "above_upper_limit";
              } else {
                deducedAlertType = "out_of_spec";
              }
            }
            
            const alert: Alert = {
              alert_id: alertData.alert_id,
              machine_id: alertData.machine_id || "",
              process_id: alertData.process_id || "",
              result_process_id: alertData.result_process_id || "",
              process_number: alertData.processNumber || alertData.process_number || null,
              item: alertData.item || null,
              column_name: alertData.columnName || alertData.column_name || null,
              alert_type: deducedAlertType,
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
          } else if (message.type === "connection") {
            console.log("Conexión establecida: ", message);
          } else if (message.type === "pong") {
            console.log("Pong recibido: ", message);
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

  const contextValue: GlobalAlertsContextType = {
    isConnected,
    connectionError,
    sendMessage,
  };

  return (
    <GlobalAlertsContext.Provider
      value={{
        isConnected: isConnected,
        connectionError: connectionError,
        sendMessage: sendMessage,
      }}
    >
      {children}
    </GlobalAlertsContext.Provider>
  );
};

export { GlobalAlertsContext };
