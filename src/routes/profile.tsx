import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BestieAppBrandLine } from "@/components/BestieAppLogo";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { ProfileAvatarEditor } from "@/components/profile/ProfileAvatarEditor";
import { SoulCardDetailDialog } from "@/components/profile/SoulCardDetailDialog";
import { getUserCardHistory, type UserCardHistoryEntry } from "@/lib/bestie-account";
import { useBestieAccount } from "@/lib/bestie-account-context";
import { useBestieAuth } from "@/lib/bestie-auth-context";
import { useAppSettings } from "@/lib/app-settings-context";
import { getDailyCardPersonaTheme } from "@/lib/daily-card-persona-theme";
import { findDailySoulCard } from "@/lib/daily-card-quotes";
import { displayDailyCardText } from "@/lib/hk-traditional";
import { getSelfCareStreak, getTotalSelfCareCompleteDays } from "@/lib/self-care-checkin";
import { useMood } from "@/lib/mood-store";
import { VIP_ACTIVE_STATUS_LABEL } from "@/lib/vip-subscription";
import { cn } from "@/lib/utils";

type ProfileSearch = {
  settings?: string;
};

export const Route = createFileRoute("/profile")({
  validateSearch: (search: Record<string, unknown>): ProfileSearch => ({
    settings: typeof search.settings === "string" ? search.settings : undefined,
  }),
  head: () => ({
    meta: [
      { title: "個人 · 心事 Bestie" },
      { name: "description", content: "靈魂卡盒與你的 Bestie 檔案。" },
    ],
  }),
  component: ProfilePage,
});

function formatShortDate(dateKey: string): string {
  const [, m, d] = dateKey.split("-").map(Number);
  if (!m || !d) return dateKey;
  return `${m}/${d}`;
}

function ProfilePage() {
  const { userName } = useBestieAccount();
  const { configured: authConfigured, user: authUser, openAuth } = useBestieAuth();
  const { persona, isVip } = useMood();
  const { settings } = Route.useSearch();
  const navigate = useNavigate();
  const { openPreferences } = useAppSettings();
  const [selected, setSelected] = useState<UserCardHistoryEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collectionTick, setCollectionTick] = useState(0);

  useEffect(() => {
    if (pathname === "/profile") setCollectionTick((t) => t + 1);
  }, [pathname]);

  const history = useMemo(() => getUserCardHistory(), [collectionTick, detailOpen]);
  const cardCount = history.length;
  const checkInDays = getTotalSelfCareCompleteDays();
  const streak = getSelfCareStreak();
  const displayName = userName?.trim() || "Bestie 朋友";

  useEffect(() => {
    if (settings === "1") {
      openPreferences();
      void navigate({ to: "/profile", search: {}, replace: true });
    }
  }, [settings, openPreferences, navigate]);

  return (
    <div className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-gradient-to-b from-violet-50/35 via-background to-stone-100/60 px-4 pb-[max(5rem,env(safe-area-inset-bottom))] pt-2 dark:from-violet-950/25 dark:to-stone-950/50">
      <header className="relative z-10 w-full max-w-sm shrink-0 pr-10 pt-[max(0.25rem,env(safe-area-inset-top))]">
        <BestieAppBrandLine />
        <h1 className="mt-0.5 text-center font-display text-xl font-bold tracking-wide text-stone-800 dark:text-stone-100 sm:text-2xl">
          個人
        </h1>

        <div className="mt-3 flex items-center gap-3 rounded-3xl border border-stone-200/60 bg-white/50 p-3 dark:border-stone-600/35 dark:bg-stone-900/35">
          <ProfileAvatarEditor personaId={persona} className="pb-3" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-stone-800 dark:text-stone-100">{displayName}</p>
            {isVip && (
              <p className="mt-0.5 text-xs font-medium text-amber-700/90 dark:text-amber-300/90">
                {VIP_ACTIVE_STATUS_LABEL}
              </p>
            )}
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              微光 {checkInDays} 天 · 連續 {streak} 天 · 靈魂卡 {cardCount} 張
            </p>
            {authConfigured && !authUser && (
              <button
                type="button"
                className="mt-1.5 text-[11px] font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
                onClick={openAuth}
              >
                登入帳號以同步 VIP
              </button>
            )}
            {authUser?.email && (
              <p className="mt-1 truncate text-[10px] text-muted-foreground">{authUser.email}</p>
            )}
          </div>
        </div>
      </header>

      <section className="relative z-10 mt-3 flex min-h-0 flex-1 flex-col">
        <h2 className="shrink-0 px-0.5 text-sm font-semibold tracking-wide text-stone-700 dark:text-stone-200">
          🎴 靈魂卡盒
        </h2>
        {cardCount === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-stone-300/70 bg-white/30 px-4 py-6 text-center text-xs leading-relaxed text-muted-foreground dark:border-stone-600/50 dark:bg-stone-900/20">
            仲未抽過靈魂卡～去「靈魂抽卡」抽第一張，就會喺度收藏。
          </p>
        ) : (
          <ul className="bestie-scroll-touch mt-2 grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 pb-1">
            {history.map((entry) => {
              const resolved = findDailySoulCard({ id: entry.id, quote: entry.quote });
              const p = entry.role ?? entry.persona ?? resolved?.persona ?? "gentle";
              const theme = getDailyCardPersonaTheme(p);
              const quote = displayDailyCardText(entry.quote);
              return (
                <li key={`${entry.dateKey}-${entry.id}-${p}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(entry);
                      setDetailOpen(true);
                    }}
                    className={cn(
                      "profile-soul-card-tile flex h-full w-full flex-col rounded-2xl border p-2.5 text-left transition-transform active:scale-[0.98]",
                      theme.pickerIdle,
                      "min-h-[5.5rem]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] tabular-nums text-muted-foreground">{formatShortDate(entry.dateKey)}</span>
                      <PersonaAvatar personaId={p} className="size-5 shrink-0" />
                    </div>
                    <span className="mt-1 line-clamp-3 flex-1 text-[11px] leading-snug text-stone-700 dark:text-stone-200">
                      {quote}
                    </span>
                    <span className="mt-1 text-sm" aria-hidden="true">
                      {resolved?.icon ?? "🎴"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <SoulCardDetailDialog
        entry={selected}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
