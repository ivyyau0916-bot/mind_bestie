import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BestieAppBrandLine } from "@/components/BestieAppLogo";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { SelfCareCalendar } from "@/components/self-care/SelfCareCalendar";
import { SelfCareDayFootprint } from "@/components/self-care/SelfCareDayFootprint";
import { SelfCareFutureLocked } from "@/components/self-care/SelfCareFutureLocked";
import { SelfCareCompleteDialog } from "@/components/SelfCareCompleteDialog";
import { SelfCareMilestoneDialog } from "@/components/SelfCareMilestoneDialog";
import {
  SelfCareFlyingGlowLayer,
  SelfCareSparkleBurst,
  SelfCareTaskIcon,
  type FlyingGlowParticle,
} from "@/components/self-care/SelfCareVisuals";
import type { PersonaId } from "@/lib/chat-personas";
import { useBestieAccount } from "@/lib/bestie-account-context";
import { useMood } from "@/lib/mood-store";
import type { SelfCareMilestone } from "@/lib/self-care-milestones";
import { todayDateKey } from "@/lib/freemium";
import {
  addCalendarMonths,
  compareDateKeys,
  getCalendarMonthMeta,
  getTodayCellViewportCenter,
  isSameCalendarMonth,
} from "@/lib/self-care-calendar";
import {
  countSelfCareCompletedForDate,
  getDailySelfCareTasks,
  getSelfCareStreak,
  hasSelfCareCheckInHistory,
  loadSelfCareProgress,
  pickSelfCareNudge,
  toggleSelfCareTask,
  type SelfCareTask,
} from "@/lib/self-care-checkin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/relaxation")({
  head: () => ({
    meta: [
      { title: "每日微光打卡 · 心事 Bestie" },
      { name: "description", content: "每日 3 個溫柔微行動，在月曆上點亮今日微光。" },
    ],
  }),
  component: SelfCareCheckInPage,
});

type TaskNudge = {
  taskId: string;
  message: string;
  token: number;
  persona: PersonaId;
};

function SelfCareTaskCard({
  task,
  done,
  burstToken,
  nudge,
  cardRef,
  onCheckIn,
}: {
  task: SelfCareTask;
  done: boolean;
  burstToken: number;
  nudge: TaskNudge | null;
  cardRef: (el: HTMLDivElement | null) => void;
  onCheckIn: () => void;
}) {
  const showNudge = nudge?.taskId === task.id;

  return (
    <div ref={cardRef} className="relative">
      {showNudge && nudge && (
        <div
          key={nudge.token}
          className="self-care-nudge-bubble pointer-events-none absolute -top-9 left-1/2 z-20 flex w-[min(100%,17rem)] -translate-x-1/2 items-start gap-2 rounded-2xl border border-violet-200/60 bg-white/95 px-2.5 py-2 text-[11px] leading-snug text-stone-700 shadow-md dark:border-violet-500/25 dark:bg-stone-900/95 dark:text-stone-100"
        >
          <PersonaAvatar personaId={nudge.persona} className="size-7 shrink-0" />
          <span className="pt-0.5">{nudge.message}</span>
        </div>
      )}
      <button
        type="button"
        aria-pressed={done}
        onClick={() => {
          if (done) return;
          onCheckIn();
        }}
        className={cn(
          "relative flex w-full items-center gap-2.5 overflow-visible rounded-2xl border px-3 py-2 text-left transition-all duration-500",
          "border-stone-200/60 bg-white/85 shadow-sm backdrop-blur-sm max-md:backdrop-blur-none dark:border-stone-600/35 dark:bg-stone-900/88 max-md:dark:bg-slate-900/90",
          done &&
            "cursor-default border-amber-200/70 bg-gradient-to-r from-rose-50/90 via-amber-50/80 to-violet-50/70 shadow-[0_0_18px_rgba(251,191,36,0.18)] dark:border-amber-500/25 dark:from-rose-950/35 dark:via-amber-950/25 dark:to-violet-950/20",
        )}
      >
        <SelfCareSparkleBurst token={burstToken} />
        <SelfCareTaskIcon icon={task.icon} done={done} />
        <span
          className={cn(
            "text-[13px] leading-snug text-stone-700 dark:text-stone-200",
            done && "text-stone-800 dark:text-stone-100",
          )}
        >
          {task.text}
        </span>
      </button>
    </div>
  );
}

function SelfCareCheckInPage() {
  const { persona } = useMood();
  const { userName } = useBestieAccount();
  const dailyTasks = useMemo(() => getDailySelfCareTasks(), []);
  const initialCompleted = loadSelfCareProgress().completedIds;

  const [completedIds, setCompletedIds] = useState(() => initialCompleted);
  const [streak, setStreak] = useState(() => getSelfCareStreak());
  const [rewardOpen, setRewardOpen] = useState(false);
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [pendingMilestone, setPendingMilestone] = useState<SelfCareMilestone | null>(null);
  const [burstByTask, setBurstByTask] = useState<Record<string, number>>({});
  const [nudge, setNudge] = useState<TaskNudge | null>(null);
  const [nudgeToken, setNudgeToken] = useState(0);
  const [flyParticles, setFlyParticles] = useState<FlyingGlowParticle[]>([]);
  const [pulseToken, setPulseToken] = useState(0);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => todayDateKey());

  const calendarRef = useRef<HTMLDivElement>(null);
  const todayCellRef = useRef<HTMLButtonElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const flyIdRef = useRef(0);

  const todayKey = todayDateKey();

  const liveTodayGlowSteps = useMemo(
    () => countSelfCareCompletedForDate(todayKey, completedIds),
    [completedIds, todayKey],
  );

  const selectedDateCompletedCount = useMemo(() => {
    if (selectedDateKey === todayKey) {
      return countSelfCareCompletedForDate(todayKey, completedIds);
    }
    return countSelfCareCompletedForDate(selectedDateKey);
  }, [completedIds, selectedDateKey, todayKey]);

  const todayProgressSubtitle = `今日微光 ${selectedDateCompletedCount}/3 · 點亮屬於你嘅溫柔印記`;

  const isViewingCurrentMonth = isSameCalendarMonth(viewDate, new Date());
  const allCompleteToday = dailyTasks.every((t) => completedIds.includes(t.id));

  const selectedInViewMonth = useMemo(() => {
    const { year, month } = getCalendarMonthMeta(viewDate);
    const [sy, sm] = selectedDateKey.split("-").map(Number);
    return sy === year && sm === month;
  }, [selectedDateKey, viewDate]);

  const selectedVsToday = compareDateKeys(selectedDateKey, todayKey);
  const showInteractiveTasks = selectedVsToday === 0;
  const showDayFootprint =
    selectedInViewMonth && selectedVsToday < 0 && hasSelfCareCheckInHistory(selectedDateKey);
  const showFutureLocked = selectedInViewMonth && selectedVsToday > 0;

  useEffect(() => {
    if (selectedDateKey === todayKey) return;
    const vs = compareDateKeys(selectedDateKey, todayKey);
    if (vs > 0 || (vs < 0 && !hasSelfCareCheckInHistory(selectedDateKey))) {
      setSelectedDateKey(todayKey);
    }
  }, [selectedDateKey, todayKey]);

  const handleSelectDay = useCallback(
    (dateKey: string) => {
      const vs = compareDateKeys(dateKey, todayKey);
      if (vs > 0) return;
      if (vs < 0 && !hasSelfCareCheckInHistory(dateKey)) return;
      setSelectedDateKey(dateKey);
    },
    [todayKey],
  );

  const goBackToToday = useCallback(() => {
    setViewDate(new Date());
    setSelectedDateKey(todayDateKey());
  }, []);

  const launchFlyToToday = useCallback((taskId: string, targetGlowSteps: number) => {
    const cardEl = cardRefs.current[taskId];
    const todayEl = todayCellRef.current;
    if (!cardEl || !todayEl) {
      if (targetGlowSteps >= 3) setPulseToken((t) => t + 1);
      return;
    }

    const cardRect = cardEl.getBoundingClientRect();
    const target = getTodayCellViewportCenter(todayEl);
    const fromX = cardRect.left + cardRect.width / 2;
    const fromY = cardRect.top + cardRect.height * 0.42;
    const id = flyIdRef.current + 1;
    flyIdRef.current = id;

    setFlyParticles((prev) => [
      ...prev,
      {
        id,
        fromX,
        fromY,
        dx: target.x - fromX,
        dy: target.y - fromY,
        targetGlowSteps,
      },
    ]);
  }, []);

  const handleParticleLand = useCallback((particle: FlyingGlowParticle) => {
    setFlyParticles((prev) => prev.filter((p) => p.id !== particle.id));
    if (particle.targetGlowSteps >= 3) setPulseToken((t) => t + 1);
  }, []);

  const handleCheckIn = useCallback(
    (taskId: string) => {
      if (selectedDateKey !== todayKey) return;
      if (completedIds.includes(taskId)) return;

      const result = toggleSelfCareTask(taskId);
      if (result.state.completedIds.includes(taskId) === completedIds.includes(taskId)) return;

      setCompletedIds(result.state.completedIds);
      setStreak(result.streak);
      if (result.shouldShowReward) setRewardOpen(true);
      if (result.milestoneUnlocked) {
        setPendingMilestone(result.milestoneUnlocked);
        if (!result.shouldShowReward) setMilestoneOpen(true);
      }

      const nextGlow = countSelfCareCompletedForDate(todayKey, result.state.completedIds);
      setBurstByTask((prev) => ({ ...prev, [taskId]: (prev[taskId] ?? 0) + 1 }));
      launchFlyToToday(taskId, nextGlow);
      if (nextGlow >= 3) setPulseToken((t) => t + 1);

      const token = nudgeToken + 1;
      setNudgeToken(token);
      setNudge({ taskId, message: pickSelfCareNudge(persona, taskId), token, persona });
      window.setTimeout(() => {
        setNudge((current) => (current?.token === token ? null : current));
      }, 2600);
    },
    [completedIds, launchFlyToToday, nudgeToken, persona, selectedDateKey, todayKey],
  );

  return (
    <div className="relative flex h-dvh max-h-dvh w-full flex-col items-center overflow-hidden bg-gradient-to-b from-violet-50/40 via-background to-stone-100/50 px-4 pt-2 pb-[max(5rem,calc(5rem+env(safe-area-inset-bottom,0px)))] dark:from-violet-950/20 dark:to-stone-950/40">
      <SelfCareFlyingGlowLayer particles={flyParticles} onParticleLand={handleParticleLand} />

      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgb(196 181 253 / 0.25), transparent 60%)",
        }}
      />

      <header className="relative z-10 w-full max-w-sm shrink-0 pr-10 text-center">
        <BestieAppBrandLine />
        <h1 className="mt-0.5 font-display text-xl font-bold tracking-wide text-stone-800 dark:text-stone-100 sm:text-2xl">
          每日微光打卡
        </h1>
        <p className="mt-0.5 text-xs tracking-wide text-stone-500 dark:text-stone-400">
          每日三件簡單小事，累積屬於你嘅微光時刻 ✨
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          🔥 已連續累積 <span className="font-semibold text-violet-700 dark:text-violet-300">{streak}</span> 天溫柔微光
        </p>
      </header>

      <main className="relative z-10 flex w-full max-w-sm min-h-0 flex-1 flex-col gap-1.5 overflow-hidden py-0.5">
        <SelfCareCalendar
          viewDate={viewDate}
          isViewingCurrentMonth={isViewingCurrentMonth}
          selectedDateKey={selectedDateKey}
          calendarRef={calendarRef}
          todayCellRef={todayCellRef}
          todayGlowSteps={liveTodayGlowSteps}
          allCompleteToday={allCompleteToday}
          pulseToken={pulseToken}
          onPrevMonth={() => setViewDate((d) => addCalendarMonths(d, -1))}
          onNextMonth={() => setViewDate((d) => addCalendarMonths(d, 1))}
          onBackToToday={goBackToToday}
          onSelectDay={handleSelectDay}
          ownerCalendarLabel={userName ? `✨ ${userName} 的微光月曆` : null}
        />

        {showInteractiveTasks ? (
          <div className="bestie-scroll-touch flex min-h-0 w-full flex-1 flex-col gap-1.5">
            {dailyTasks.map((task) => (
              <SelfCareTaskCard
                key={task.id}
                task={task}
                done={completedIds.includes(task.id)}
                burstToken={burstByTask[task.id] ?? 0}
                nudge={nudge?.taskId === task.id ? nudge : null}
                cardRef={(el) => {
                  cardRefs.current[task.id] = el;
                }}
                onCheckIn={() => handleCheckIn(task.id)}
              />
            ))}
          </div>
        ) : showDayFootprint ? (
          <SelfCareDayFootprint dateKey={selectedDateKey} />
        ) : showFutureLocked ? (
          <SelfCareFutureLocked />
        ) : null}
      </main>

      {showInteractiveTasks && (
        <p className="relative z-10 mt-1 shrink-0 px-1 pb-1 pt-2 text-center text-[10px] leading-relaxed text-muted-foreground">
          {todayProgressSubtitle}
        </p>
      )}

      <SelfCareCompleteDialog
        open={rewardOpen}
        onOpenChange={(open) => {
          setRewardOpen(open);
          if (!open && pendingMilestone) setMilestoneOpen(true);
        }}
      />
      <SelfCareMilestoneDialog
        open={milestoneOpen}
        milestone={pendingMilestone}
        userName={userName}
        onOpenChange={(open) => {
          setMilestoneOpen(open);
          if (!open) setPendingMilestone(null);
        }}
      />
    </div>
  );
}
