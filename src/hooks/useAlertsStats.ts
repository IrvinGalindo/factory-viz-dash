import { useMemo } from "react";
import { Alert } from "@/services/spcApi";

export const useAlertsStats = (filteredAlerts: Alert[]) => {
  return useMemo(
    () => ({
      total: filteredAlerts.length,
      pending: filteredAlerts.filter(
        (a) => a.status !== "resolved" && a.status !== "acknowledged"
      ).length,
      acknowledged: filteredAlerts.filter((a) => a.status === "acknowledged")
        .length,
      resolved: filteredAlerts.filter((a) => a.status === "resolved").length,
    }),
    [filteredAlerts]
  );
};
