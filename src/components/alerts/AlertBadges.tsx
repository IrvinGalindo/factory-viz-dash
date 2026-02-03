import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/services/spcApi";

interface AlertBadgesProps {
  severity: string | null;
  status: string | null;
}

export const SeverityBadge = ({ severity }: { severity: string | null }) => {
  return useMemo(() => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Crítico</Badge>;
      case "warning":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">Advertencia</Badge>
        );
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  }, [severity]);
};

export const StatusBadge = ({ status }: { status: string | null }) => {
  return useMemo(() => {
    switch (status) {
      case "resolved":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <span className="mr-1">✓</span>
            Resuelto
          </Badge>
        );
      case "acknowledged":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <span className="mr-1">✓</span>
            Reconocido
          </Badge>
        );
      default:
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">
            <span className="mr-1">⏱</span>
            Pendiente
          </Badge>
        );
    }
  }, [status]);
};
