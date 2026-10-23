import { useEffect } from "react";
import { syncCareNotifications } from "@/lib/care-notifications";

/** Keeps morning/evening notification schedulers in sync while the app is open. */
export function CareNotificationSync() {
  useEffect(() => {
    void syncCareNotifications();
  }, []);
  return null;
}
