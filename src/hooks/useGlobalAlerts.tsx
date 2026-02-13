import { useCallback, createContext, useContext, useRef, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { useAlertSound } from "@/hooks/useAlertSound";
import { Alert, getAlertsWebSocketUrl } from "@/services/spcApi";
import { logger } from "@/utils/logger";

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

  // Unique Session ID for this client instance (prevents self-echo)
  const sessionId = useRef(Math.random().toString(36).substring(2, 9)).current;

  const handleNewRealtimeAlert = useCallback((alert: Alert) => {
    // Evitar pop-ups para alertas modificadas (reconocidas, resueltas o actualizadas)
    // console.log("Alerta recibida:", alert);
    // console.log("Tipo de Alerta:", alert.alert_type);
    if (
      alert.alert_type === "alert_acknowledgment" ||
      alert.alert_type === "alert_resolved" ||
      alert.alert_type === "alert_updated" ||
      alert.status === "acknowledged" ||
      alert.status === "resolved"
    ) {
      logger.debug("Alerta modificada ignorada:", alert);
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
    const value = typeof alert.value === 'number' ? alert.value.toFixed(4) : "N/A";
    const nominal = typeof alert.nominal === 'number' ? alert.nominal.toFixed(4) : "N/A";
    const deviation = typeof alert.deviation === 'number' ? Math.abs(alert.deviation).toFixed(4) : "0.0000";

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
    const lowerLimit = typeof alert.lower_limit === 'number' ? alert.lower_limit.toFixed(4) : "N/A";
    const upperLimit = typeof alert.upper_limit === 'number' ? alert.upper_limit.toFixed(4) : "N/A";
    const description = `Valor: ${value} | Nominal: ${nominal} | Desviación: ${deviation} | Límites: [${lowerLimit}, ${upperLimit}]`;

    logger.info("✅ Mostrando toast para alerta válida:", { type: alert.alert_type, title, description });
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
      logger.info("🔌 [Global] Conectando al WebSocket de alertas:", wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        logger.info(`✅ [Global] WebSocket de alertas conectado (Session ID: ${sessionId})`);
        setIsConnected(true);
        setConnectionError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          // logger.debug("Mensaje WebSocket recibido:", message);

          const allowedTypes = ["alert", "connection", "pong"];
          if (!allowedTypes.includes(message.type)) {
            // logger.warn("Mensaje WebSocket ignorado: Tipo no permitido", message.type);
            return;
          }

          // Check for self-sent messages (via sender_id or sessionId) at top level
          if (message.sender_id === sessionId || message.sessionId === sessionId) {
            //  logger.debug("🛑 Ignorando mensaje enviado por esta misma sesión:", sessionId);
            return;
          }

          if (message.type === "alert" && message.data) {
            let alertData = message.data;

            // Handle case where data is a JSON string
            if (typeof alertData === 'string') {
              try {
                alertData = JSON.parse(alertData);
              } catch (e) {
                logger.error("Error parsing alert data string:", e);
              }
            }
            // Use Stringify to force full visibility in console text
            logger.debug("🔍 [Global] Processed alert data (JSON):", JSON.stringify(alertData, null, 2));

            // Handle double nesting (message.data.data)
            if (alertData && alertData.data && typeof alertData.data === 'object') {
              logger.debug("📦 [Global] Desempaquetando data anidada:", alertData.data);
              alertData = alertData.data;
            }

            // Check for self-sent messages inside data object
            if (alertData.sender_id === sessionId || alertData.sessionId === sessionId) {
              logger.debug("🛑 Ignorando mensaje (data) enviado por esta misma sesión:", sessionId);
              return;
            }

            // --- DATA EXTRACTION LOGIC ---
            // Extract from 'measurement' and 'alert_info' objects which are now confirmed in logs
            const measure = alertData.measurement || {};
            const info = alertData.alert_info || {};

            // Priority: top level -> measurement object -> defaults
            let value = alertData.value ?? measure.value;
            let nominal = alertData.nominal ?? measure.nominal;
            let upperLimit = alertData.upper_limit ?? measure.upper_limit;
            let lowerLimit = alertData.lower_limit ?? measure.lower_limit;
            let deviation = alertData.deviation ?? measure.deviation;

            // Calculate deviation if missing
            if (deviation === undefined && typeof value === 'number' && typeof nominal === 'number') {
              deviation = Math.abs(value - nominal);
            }

            // Determine alert type
            let deducedAlertType = alertData.event || alertData.alert_type || info.alert_type || "unknown";

            if (!deducedAlertType || deducedAlertType === "unknown") {
              if (value < lowerLimit) {
                deducedAlertType = "below_lower_limit";
              } else if (value > upperLimit) {
                deducedAlertType = "above_upper_limit";
              } else {
                deducedAlertType = "out_of_spec";
              }
            }

            // Extract ID with fallback
            const alertId = alertData.alert_id || alertData.id;

            // Check status at the top level or inside alert_info
            const status = alertData.status || info.status || "pending";

            if (status === "acknowledged" || status === "resolved") {
              console.log(`ℹ️ Ignorando alerta ${alertId} con estado ${status}`);
              return;
            }

            const alert: Alert = {
              alert_id: alertId,
              machine_id: alertData.machine_id || "",
              process_id: alertData.process_id || "",
              result_process_id: alertData.result_process_id || "",
              process_number: alertData.processNumber || alertData.process_number || measure.process_number || null,
              item: alertData.item || null || measure.item,
              column_name: alertData.columnName || alertData.column_name || measure.column_name || null,
              alert_type: deducedAlertType,
              value: value,
              nominal: nominal,
              upper_limit: upperLimit,
              lower_limit: lowerLimit,
              deviation: deviation,
              measurement_index: alertData.measurement_index,
              status: status,
              severity: alertData.severity || info.severity || null,
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
  }, [handleNewRealtimeAlert, sessionId]);

  const sendMessage = useCallback((message: object) => {
    // Check if event is alert_updated to prevent sending
    const msg = message as any;
    if (msg.event === 'alert_updated' || msg.type === 'alert_updated' || msg.data?.event === 'alert_updated') {
      console.log("🚫 [Global] Bloqueando envío de mensaje alert_updated:", message);
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Attach session ID to identify sender
      const messageWithId = { ...message, sender_id: sessionId };
      wsRef.current.send(JSON.stringify(messageWithId));
      console.log("📤 [Global] Mensaje enviado:", messageWithId);
    } else {
      console.warn("⚠️ WebSocket no conectado");
    }
  }, [sessionId]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        // Prevent onclose from triggering a reconnect
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
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
