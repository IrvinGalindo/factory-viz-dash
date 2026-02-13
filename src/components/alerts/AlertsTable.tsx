import { memo } from "react";
import { Alert } from "@/services/spcApi";
import { SeverityBadge, StatusBadge } from "./AlertBadges";
import { AlertActions } from "./AlertActions";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Table,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLanguage } from "@/components/language-provider";

interface AlertsTableProps {
  alerts: Alert[];
  machines: Array<{ machine_id: string; line: string; cmm_name: string }>;
  processingAlertId: string | null;
  alertComments: Record<string, string>;
  resolveNotes: Record<string, string>;
  onCommentChange: (alertId: string, comment: string) => void;
  onResolveNoteChange: (alertId: string, note: string) => void;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
}

const getMachineName = (
  machineId: string,
  machines: Array<{ machine_id: string; line: string; cmm_name: string }>
): string => {
  const machine = machines.find((m) => m.machine_id === machineId);
  return machine?.line || machineId;
};

export const AlertsTable = memo(
  ({
    alerts,
    machines,
    processingAlertId,
    alertComments,
    resolveNotes,
    onCommentChange,
    onResolveNoteChange,
    onAcknowledge,
    onResolve,
  }: AlertsTableProps) => {
    const { t } = useLanguage();

    const formatAlertTitle = (alert: Alert): string => {
      const value = alert.value?.toFixed(4);

      if (alert.alert_type === "below_lower_limit") {
        return t('alert_below_lower').replace('{value}', value);
      } else if (alert.alert_type === "above_upper_limit") {
        return t('alert_above_upper').replace('{value}', value);
      } else if (alert.alert_type === "out_of_spec") {
        return t('alert_out_of_spec').replace('{value}', value);
      } else if (alert.alert_type === "out_of_control") {
        return t('alert_out_of_control').replace('{value}', value);
      } else if (alert.alert_type === "trend") {
        return t('alert_trend').replace('{value}', value);
      }
      return t('alert_default').replace('{type}', alert.alert_type);
    };

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">{t('alert')}</TableHead>
            <TableHead>{t('machine')}</TableHead>
            <TableHead>{t('severity')}</TableHead>
            <TableHead>{t('status')}</TableHead>
            <TableHead>{t('date')}</TableHead>
            <TableHead className="text-right">{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.alert_id} className="align-top">
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium text-sm">
                    {getMachineName(alert.machine_id, machines)}:{" "}
                    {formatAlertTitle(alert)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {alert.item} - {alert.column_name} | {t('process')}:{" "}
                    {alert.process_number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('nominal')}: {alert.nominal?.toFixed(4)} | {t('limits')}: [
                    {alert.lower_limit?.toFixed(4)}, {alert.upper_limit?.toFixed(4)}
                    ]
                  </p>
                  {alert.notes && (
                    <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                      💬 {alert.notes}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {getMachineName(alert.machine_id, machines)}
                </span>
              </TableCell>
              <TableCell>
                <SeverityBadge severity={alert.severity} />
              </TableCell>
              <TableCell>
                <StatusBadge status={alert.status} />
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {format(new Date(alert.created_at), "dd/MM/yyyy HH:mm", {
                    locale: es,
                  })}
                </div>
              </TableCell>
              <TableCell>
                <AlertActions
                  alertId={alert.alert_id}
                  status={alert.status}
                  comment={alertComments[alert.alert_id] || ""}
                  resolveNote={resolveNotes[alert.alert_id] || ""}
                  processing={processingAlertId === alert.alert_id}
                  onCommentChange={(comment) =>
                    onCommentChange(alert.alert_id, comment)
                  }
                  onResolveNoteChange={(note) =>
                    onResolveNoteChange(alert.alert_id, note)
                  }
                  onAcknowledge={() => onAcknowledge(alert.alert_id)}
                  onResolve={() => onResolve(alert.alert_id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
);

AlertsTable.displayName = "AlertsTable";
