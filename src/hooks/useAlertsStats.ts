import { useState, useEffect } from "react";
import { toast } from "sonner";
import { fetchAlerts } from "@/services/spcApi";
import { useLanguage } from "@/components/language-provider";
import { logger } from "@/utils/logger";

export const useAlertsStats = (trigger?: any) => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    acknowledged: 0,
    resolved: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Fetch counts in parallel using page_size=1 just to get total from metadata
        const [totalRes, pendingRes, ackRes, resolvedRes] = await Promise.all([
          fetchAlerts(undefined, undefined, 1, 1),
          fetchAlerts(undefined, "active", 1, 1), // "active" corresponds to pending/triggered
          fetchAlerts(undefined, "acknowledged", 1, 1),
          fetchAlerts(undefined, "resolved", 1, 1),
        ]);

        setStats({
          total: totalRes.pagination?.total || 0,
          pending: pendingRes.pagination?.total || 0,
          acknowledged: ackRes.pagination?.total || 0,
          resolved: resolvedRes.pagination?.total || 0,
        });
      } catch (error) {
        logger.error("Error loading alert stats:", error);
        toast.error(t('error_loading_stats'));
      }
    };

    loadStats();
  }, [trigger]);

  return stats;
};
