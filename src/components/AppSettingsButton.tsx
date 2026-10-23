import { Settings } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { isMainTabPath } from "@/components/BottomNav";
import { useAppSettings } from "@/lib/app-settings-context";
import { cn } from "@/lib/utils";

export function AppSettingsButton() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { openPreferences } = useAppSettings();

  if (!isMainTabPath(pathname)) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[45] mx-auto max-w-md px-3 pt-[max(env(safe-area-inset-top),0.5rem)]"
      aria-hidden={false}
    >
      <div className="flex justify-end">
        <button
          type="button"
          aria-label="偏好設定"
          onClick={openPreferences}
          className={cn(
            "pointer-events-auto flex size-9 items-center justify-center rounded-full border border-stone-300/50",
            "bg-stone-100/90 text-stone-600 shadow-sm backdrop-blur-md max-md:backdrop-blur-none",
            "transition-colors hover:bg-stone-200/80 hover:text-stone-800",
            "dark:border-stone-500/35 dark:bg-stone-800/88 max-md:dark:bg-slate-900/90 dark:text-stone-300 dark:hover:bg-stone-700/80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50",
          )}
        >
          <Settings className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
