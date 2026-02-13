import { useState, useCallback } from "react";
import { Alert, acknowledgeAlert, resolveAlert } from "@/services/spcApi";
import { useGlobalAlertsContext } from "@/hooks/useGlobalAlerts";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logger } from "@/utils/logger";
import { useLanguage } from "@/components/language-provider";

export const useAlertsActions = (alerts: Alert[], setAlerts: (alerts: Alert[]) => void) => {
  const [processingAlertId, setProcessingAlertId] = useState<string | null>(null);
  const [alertComments, setAlertComments] = useState<Record<string, string>>({});
  const [resolveNotes, setResolveNotes] = useState<Record<string, string>>({});
  const { sendMessage } = useGlobalAlertsContext();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Get the user's display name, fallback to 'operator' if not available
  const userName = user?.full_name || 'operator';

  const sendAlertAcknowledgmentViaWebSocket = useCallback(
    (alert: Alert, comment: string) => {
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
          acknowledged_by: userName,
          acknowledged_at: new Date().toISOString(),
        },
      };

      sendMessage(message);
    },
    [sendMessage, userName]
  );

  const handleAcknowledge = useCallback(
    async (alertId: string) => {
      const comment = alertComments[alertId];
      if (!comment || comment.trim() === "") {
        toast.error("Debes agregar un comentario antes de reconocer la alerta");
        return;
      }

      setProcessingAlertId(alertId);

      try {
        const alertToAcknowledge = alerts.find((a) => a.alert_id === alertId);

        const response = await acknowledgeAlert(alertId, userName, comment.trim());
        const updatedAlert = response.data; // Extract from SuccessResponse

        if (alertToAcknowledge) {
          sendAlertAcknowledgmentViaWebSocket(alertToAcknowledge, comment);
        }

        setAlerts(
          alerts.map((a) =>
            a.alert_id === alertId
              ? {
                ...a,
                status: "acknowledged",
                acknowledged_at: new Date().toISOString(),
                notes: comment,
              }
              : a
          )
        );

        setAlertComments((prev) => {
          const updated = { ...prev };
          delete updated[alertId];
          return updated;
        });

        toast.success("Alerta reconocida correctamente");
      } catch (err) {
        console.error("Error acknowledging alert:", err);
        toast.error(err instanceof Error ? err.message : "Error al reconocer la alerta");
      } finally {
        setProcessingAlertId(null);
      }
    },
    [alerts, alertComments, sendAlertAcknowledgmentViaWebSocket, setAlerts, userName]
  );

  const handleResolve = useCallback(
    async (alertId: string) => {
      const note = resolveNotes[alertId];
      if (!note || note.trim() === "") {
        toast.error("Debes agregar una nota antes de resolver la alerta");
        return;
      }

      setProcessingAlertId(alertId);
      try {
        // Send to API with the notes
        const response = await resolveAlert(alertId, userName, note.trim());
        const updatedAlert = response; // Response is the Alert object directly

        setAlerts(
          alerts.map((a) =>
            a.alert_id === alertId
              ? {
                ...a,
                status: "resolved",
                resolved_at: new Date().toISOString(),
                notes: note,
              }
              : a
          )
        );

        setResolveNotes((prev) => {
          const updated = { ...prev };
          delete updated[alertId];
          return updated;
        });

        toast.success(t('alert_resolved'), {
          description: t('success'),
        });
      } catch (err) {
        logger.error("Error resolving alert:", err);
        toast.error(err instanceof Error ? err.message : "Error al resolver la alerta");
      } finally {
        setProcessingAlertId(null);
      }
    },
    [alerts, resolveNotes, setAlerts, userName]
  );

  const handleCommentChange = useCallback((alertId: string, comment: string) => {
    setAlertComments((prev) => ({
      ...prev,
      [alertId]: comment,
    }));
  }, []);

  const handleResolveNoteChange = useCallback((alertId: string, note: string) => {
    setResolveNotes((prev) => ({
      ...prev,
      [alertId]: note,
    }));
  }, []);

  return {
    processingAlertId,
    alertComments,
    resolveNotes,
    handleAcknowledge,
    handleResolve,
    handleCommentChange,
    handleResolveNoteChange,
  };
};
