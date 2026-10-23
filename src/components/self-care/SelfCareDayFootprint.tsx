import { Check } from "lucide-react";
import { useMemo } from "react";
import { SelfCareTaskIcon } from "@/components/self-care/SelfCareVisuals";
import { getDailySelfCareTasks, loadSelfCareProgress } from "@/lib/self-care-checkin";
import { cn } from "@/lib/utils";

function footprintTitle(dateKey: string): string {
  const [, month, day] = dateKey.split("-").map(Number);
  return `${month}月${day}日`;
}

type SelfCareDayFootprintProps = {
  dateKey: string;
};

export function SelfCareDayFootprint({ dateKey }: SelfCareDayFootprintProps) {
  const tasks = useMemo(() => getDailySelfCareTasks(dateKey), [dateKey]);
  const completedIds = useMemo(() => loadSelfCareProgress(dateKey).completedIds, [dateKey]);
  const completedTasks = useMemo(
    () => tasks.filter((task) => completedIds.includes(task.id)),
    [tasks, completedIds],
  );

  return (
    <div
      className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-stone-200/65 bg-white/88 px-2.5 py-2 shadow-sm backdrop-blur-sm max-md:backdrop-blur-none dark:border-stone-600/35 dark:bg-stone-900/88 max-md:dark:bg-slate-900/90"
      role="region"
      aria-label={`${footprintTitle(dateKey)}的微光足跡`}
    >
      <h2 className="shrink-0 text-center text-sm font-medium tracking-wide text-stone-700 dark:text-stone-200">
        {footprintTitle(dateKey)}
      </h2>

      <ul className="bestie-scroll-touch mt-2 flex min-h-0 flex-1 flex-col gap-1">
        {completedTasks.map((task) => (
          <li
            key={task.id}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-1.5",
              "border-amber-200/65 bg-gradient-to-r from-rose-50/85 via-amber-50/75 to-violet-50/65 dark:border-amber-500/20 dark:from-rose-950/30 dark:via-amber-950/20 dark:to-violet-950/15",
            )}
          >
            <SelfCareTaskIcon icon={task.icon} done />
            <span className="min-w-0 flex-1 text-[12px] leading-snug text-stone-800 dark:text-stone-100">
              {task.text}
            </span>
            <span
              className="flex size-5 shrink-0 items-center justify-center rounded-full border border-amber-300/70 bg-amber-100/80 text-amber-800 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-200"
              aria-hidden
            >
              <Check className="size-3 stroke-[2.5]" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
