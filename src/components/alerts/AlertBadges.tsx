import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/services/spcApi";
import { useLanguage } from "@/components/language-provider";

interface AlertBadgesProps {
  severity: string | null;
  status: string | null;
}

export const SeverityBadge = ({ severity }: { severity: string | null }) => {
  const { t } = useLanguage();
  return useMemo(() => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">{t('critical')}</Badge>;
      case "warning":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">{t('warning')}</Badge>
        );
      default:
        return <Badge variant="secondary">{t('info')}</Badge>;
    }
  }, [severity, t]);
};

export const StatusBadge = ({ status }: { status: string | null }) => {
  const { t } = useLanguage();
  return useMemo(() => {
    switch (status) {
      case "resolved":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <span className="mr-1">✓</span>
            {t('status_resolved')}
          </Badge>
        );
      case "acknowledged":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <span className="mr-1">✓</span>
            {t('status_acknowledged')}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">
            <span className="mr-1">⏱</span>
            {t('status_pending')}
          </Badge>
        );
    }
  }, [status, t]);
};
