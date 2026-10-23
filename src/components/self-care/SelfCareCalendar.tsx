import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RefObject } from "react";
import {
  buildCalendarCells,
  compareDateKeys,
  getCalendarMonthMeta,
  getTodayGlowProgress,
  isRealTodayInView,
  SELF_CARE_WEEKDAY_LABELS,
  toDateKey,
} from "@/lib/self-care-calendar";
import { todayDateKey } from "@/lib/freemium";
import { getSelfCareDayGlowSteps, hasSelfCareCheckInHistory } from "@/lib/self-care-checkin";
import { cn } from "@/lib/utils";

type SelfCareCalendarProps = {
  viewDate: Date;
  isViewingCurrentMonth: boolean;
  selectedDateKey: string;
  calendarRef?: RefObject<HTMLDivElement | null>;
  todayCellRef?: RefObject<HTMLButtonElement | null>;
  todayGlowSteps: number;
  allCompleteToday: boolean;
  pulseToken: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onBackToToday: () => void;
  onSelectDay: (dateKey: string) => void;
  ownerCalendarLabel?: string | null;
};

function glowStepsForDay(viewDate: Date, day: number, liveTodaySteps: number): number {
  if (isRealTodayInView(viewDate, day)) return Math.min(liveTodaySteps, 3);
  const { year, month } = getCalendarMonthMeta(viewDate);
  return getSelfCareDayGlowSteps(toDateKey(year, month, day));
}

export function SelfCareCalendar({
  viewDate,
  isViewingCurrentMonth,
  calendarRef,
  todayCellRef,
  todayGlowSteps,
  allCompleteToday,
  pulseToken,
  onPrevMonth,
  onNextMonth,
  onBackToToday,
  selectedDateKey,
  onSelectDay,
  ownerCalendarLabel,
}: SelfCareCalendarProps) {
  const { year, month } = getCalendarMonthMeta(viewDate);
  const cells = buildCalendarCells(viewDate);
  const todayKey = todayDateKey();
  const showReturnToday = !isViewingCurrentMonth || selectedDateKey !== todayKey;

  return (
    <div
      ref={calendarRef}
      className="w-full shrink-0 rounded-2xl border border-stone-200/70 bg-white/88 px-2 py-1.5 shadow-sm backdrop-blur-sm max-md:backdrop-blur-none dark:border-stone-600/35 dark:bg-stone-900/88 max-md:dark:bg-slate-900/90"
    >
      {ownerCalendarLabel && (
        <p className="mb-0.5 text-center text-[10px] tracking-wide text-stone-500 dark:text-stone-400">
          {ownerCalendarLabel}
        </p>
      )}
      <div className="mb-1 flex items-center justify-between gap-1">
        <button
          type="button"
          aria-label="上個月"
          onClick={onPrevMonth}
          className="flex size-7 shrink-0 items-center justify-center rounded-full border border-stone-200/70 bg-stone-100/50 text-stone-500 transition-colors hover:bg-stone-200/40 dark:border-stone-600/40 dark:bg-stone-800/40 dark:text-stone-300"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="text-[11px] font-medium tracking-wide text-stone-600 dark:text-stone-300">
            {year} 年 {month} 月
          </p>
          {showReturnToday && (
            <button
              type="button"
              onClick={onBackToToday}
              className="mt-0.5 text-[9px] tracking-wide text-violet-600/90 underline-offset-2 hover:underline dark:text-violet-300/90"
            >
              {!isViewingCurrentMonth ? "回到本月" : "回到今日"}
            </button>
          )}
        </div>

        <button
          type="button"
          aria-label="下個月"
          onClick={onNextMonth}
          className="flex size-7 shrink-0 items-center justify-center rounded-full border border-stone-200/70 bg-stone-100/50 text-stone-500 transition-colors hover:bg-stone-200/40 dark:border-stone-600/40 dark:bg-stone-800/40 dark:text-stone-300"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mb-0.5 grid grid-cols-7 gap-0.5">
        {SELF_CARE_WEEKDAY_LABELS.map((label) => (
          <span
            key={label}
            className="text-center text-[9px] font-medium tracking-wide text-stone-400 dark:text-stone-500"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, index) => {
          if (day === null) {
            return <span key={`empty-${index}`} className="aspect-square" aria-hidden />;
          }

          const dateKey = toDateKey(year, month, day);
          const isSelected = dateKey === selectedDateKey;
          const isToday = isRealTodayInView(viewDate, day);
          const steps = glowStepsForDay(viewDate, day, todayGlowSteps);
          const dayComplete = steps >= 3;
          const glow = getTodayGlowProgress(steps);
          const hasGlow = steps > 0;

          const cellClass = cn(
            "relative flex aspect-square items-center justify-center rounded-lg text-[10px] tabular-nums transition-all duration-500",
            isSelected &&
              "ring-2 ring-violet-400/75 ring-offset-1 ring-offset-white/80 dark:ring-violet-300/55 dark:ring-offset-stone-900/80",
            !isToday && !hasGlow && "text-stone-400/80 dark:text-stone-500",
            !isToday &&
              hasGlow &&
              !dayComplete &&
              "bg-amber-50/60 text-stone-600 dark:bg-amber-950/20 dark:text-stone-300",
            !isToday &&
              dayComplete &&
              "bg-gradient-to-br from-rose-50/80 via-amber-50/70 to-violet-50/60 text-amber-900/90 dark:from-rose-950/30 dark:via-amber-950/25 dark:to-violet-950/20 dark:text-amber-100/90",
            isToday &&
              cn(
                "font-semibold text-stone-700 dark:text-stone-100",
                !allCompleteToday && "ring-1 ring-violet-300/70 dark:ring-violet-400/40",
                hasGlow && !allCompleteToday && "bg-amber-100/40 dark:bg-amber-900/20",
                allCompleteToday &&
                  "self-care-calendar-today-complete bg-gradient-to-br from-rose-100/90 via-amber-100/85 to-violet-100/80 text-amber-900 shadow-[0_0_16px_rgba(251,191,36,0.35)] dark:from-rose-950/50 dark:via-amber-950/40 dark:to-violet-950/35 dark:text-amber-100",
              ),
          );

          const cellStyle =
            hasGlow && !dayComplete
              ? {
                  backgroundColor: isToday
                    ? `rgb(251 191 36 / ${0.08 + glow * 0.28})`
                    : `rgb(251 191 36 / ${0.06 + glow * 0.18})`,
                  boxShadow:
                    glow > 0 ? `0 0 ${4 + glow * 8}px rgb(251 191 36 / ${0.12 + glow * 0.2})` : undefined,
                }
              : undefined;

          const cellContent = (
            <>
              {isToday && allCompleteToday && (
                <span
                  key={pulseToken}
                  className="self-care-calendar-pulse pointer-events-none absolute inset-0 rounded-lg"
                  aria-hidden
                />
              )}
              <span className="relative z-[1]">{day}</span>
              {dayComplete && (
                <span className="absolute -right-0.5 -top-0.5 text-[7px] leading-none" aria-hidden>
                  ✨
                </span>
              )}
              {isToday && !allCompleteToday && steps > 0 && (
                <span
                  className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-amber-400/80"
                  aria-hidden
                />
              )}
            </>
          );

          const dayLabel = isToday ? `今日 ${day} 日` : `${month} 月 ${day} 日`;
          const vsToday = compareDateKeys(dateKey, todayKey);
          const isFuture = vsToday > 0;
          const isPast = vsToday < 0;
          const hasHistory = hasSelfCareCheckInHistory(dateKey);
          const isSelectable = isToday || (isPast && hasHistory);

          if (!isSelectable) {
            return (
              <span
                key={`${day}-${index}`}
                aria-hidden={isFuture}
                aria-label={
                  isFuture
                    ? undefined
                    : `${dayLabel}，未有微光紀錄，不可選取`
                }
                className={cn(
                  cellClass,
                  "cursor-default opacity-35 saturate-50",
                  isFuture && "opacity-25",
                )}
                style={cellStyle}
              >
                {cellContent}
              </span>
            );
          }

          return (
            <button
              key={`${day}-${index}`}
              type="button"
              ref={isToday && isViewingCurrentMonth ? todayCellRef : undefined}
              aria-label={`${dayLabel}，微光進度 ${steps}/3${isSelected ? "，已選取" : ""}${isPast ? "，查看足跡" : ""}`}
              aria-pressed={isSelected}
              onClick={() => onSelectDay(dateKey)}
              className={cellClass}
              style={cellStyle}
            >
              {cellContent}
            </button>
          );
        })}
      </div>
    </div>
  );
}
