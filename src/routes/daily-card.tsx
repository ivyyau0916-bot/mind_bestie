import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type TransitionEvent } from "react";
import { toast } from "sonner";
import {
  DailyCardBackOrnament,
  DailyCardStarDivider,
  formatSoulInsight,
} from "@/components/daily-card/DailyCardVisuals";
import { BestieAppBrandLine } from "@/components/BestieAppLogo";
import { DailyCardPersonaPicker } from "@/components/daily-card/DailyCardPersonaPicker";
import { SoulCardSavePreviewDialog } from "@/components/daily-card/SoulCardSavePreviewDialog";
import {
  DailyCardPersonaLockDialog,
  DAILY_CARD_VIP_UNLOCK_TITLE,
} from "@/components/DailyCardPersonaLockDialog";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { VipUnlockDialog } from "@/components/VipUnlockDialog";
import { Button } from "@/components/ui/button";
import { dailyCardThemeTransitionClass, getDailyCardPersonaTheme } from "@/lib/daily-card-persona-theme";
import { drawNextSoulCard, resolveSavedDailyCard } from "@/lib/daily-card-draw";
import type { DailySoulCard } from "@/lib/daily-card-types";
import {
  DAILY_CARD_ROLE_CLAIMED_HINT,
  getDailyCardDrawState,
  saveDailyCardDraw,
  todayDateKey,
} from "@/lib/freemium";
import { getPersona, type PersonaId } from "@/lib/chat-personas";
import { appendUserCardHistory } from "@/lib/bestie-account";
import { useBestieAccount } from "@/lib/bestie-account-context";
import { useMood } from "@/lib/mood-store";
import { displayDailyCardText } from "@/lib/hk-traditional";
import { SOUL_CARD_DOWNLOAD_BUSY_LABEL, preloadSoulCardCaptureForExport, preloadSoulCardCaptureModule } from "@/lib/soul-card-share";
import { useSoulCardSave } from "@/hooks/use-soul-card-save";
import { cn } from "@/lib/utils";
import { canAccessCharacter, CharacterId } from "@/lib/trial-limits";
import { useBestieAuth } from "@/lib/bestie-auth-context";

export const Route = createFileRoute("/daily-card")({
  head: () => ({
    meta: [
      { title: "靈魂抽卡治療室 · 心事 Bestie" },
      { name: "description", content: "靈魂抽卡治療室 — 每日靈魂金句，給自己一句廣東話溫暖提醒。" },
    ],
  }),
  component: DailyCardPage,
});

const cardBase = "daily-card-canvas overflow-hidden rounded-3xl";

function DailyCardPage() {
  const { isVip, persona, setPersona, theme: appTheme } = useMood();
  const { user } = useBestieAuth();
  const { userName } = useBestieAccount();
  const [flipped, setFlipped] = useState(false);
  const [flipSettled, setFlipSettled] = useState(false);
  const [card, setCard] = useState<DailySoulCard | null>(null);
  const [canDraw, setCanDraw] = useState(true);
  const cardPersona: PersonaId = card?.persona ?? persona;
  const active = getPersona(cardPersona);
  const theme = getDailyCardPersonaTheme(persona);
  const frontTheme = getDailyCardPersonaTheme(cardPersona);
  const { busy: downloading, saveFromElement, previewOpen, setPreviewOpen, previewUrl } = useSoulCardSave();
  const [drawing, setDrawing] = useState(false);
  const [personaLockOpen, setPersonaLockOpen] = useState(false);
  const [vipOpen, setVipOpen] = useState(false);
  const [vipDialogTitle, setVipDialogTitle] = useState(DAILY_CARD_VIP_UNLOCK_TITLE);
  const exportRef = useRef<HTMLDivElement>(null);

  const syncCardViewForPersona = useCallback(
    (targetPersona: PersonaId) => {
      const state = getDailyCardDrawState(isVip, targetPersona);
      setCanDraw(state.canDraw);
      const restored = resolveSavedDailyCard(state.savedCardId, state.savedQuote);
      if (restored) {
        setCard(restored);
        setFlipped(true);
        setFlipSettled(true);
        return;
      }
      setCard(null);
      setFlipped(false);
      setFlipSettled(false);
    },
    [isVip],
  );

  useEffect(() => {
    syncCardViewForPersona(persona);
  }, [persona, isVip, syncCardViewForPersona]);

  useEffect(() => {
    preloadSoulCardCaptureModule();
  }, []);

  useEffect(() => {
    if (!flipped) {
      setFlipSettled(false);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFlipSettled(true);
      return;
    }
    const fallback = window.setTimeout(() => setFlipSettled(true), 950);
    return () => clearTimeout(fallback);
  }, [flipped]);

  const handleFlipTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== "transform" || event.target !== event.currentTarget) return;
    if (flipped) setFlipSettled(true);
  };

  useEffect(() => {
    if (!flipped || !card) return;
    const node = exportRef.current;
    if (!node) return;
    preloadSoulCardCaptureForExport(node);
  }, [flipped, card]);

  const handlePersonaSelect = (id: PersonaId) => {
    if (id === persona) return;

    const charId: CharacterId = id === "fierce" ? "sarcastic" : id === "wise" ? "rational" : "gentle";
    const access = canAccessCharacter(charId, isVip, user?.created_at);
    if (!access.allowed) {
      setPersonaLockOpen(true);
      return;
    }

    setPersona(id);
    syncCardViewForPersona(id);
  };

  const revealCard = useCallback(
    (next: DailySoulCard, source: "local" | "ai") => {
      setFlipSettled(false);
      setFlipped(false);
      setCard(next);
      requestAnimationFrame(() => setFlipped(true));
      appendUserCardHistory({ id: next.id, quote: next.quote, persona: next.persona });
      saveDailyCardDraw({ id: next.id, quote: next.quote }, next.persona);
      setCanDraw(false);
      if (source === "ai") toast("為你生成咗獨家靈魂金句");
    },
    [],
  );

  const runDraw = async () => {
    if (!canDraw || drawing) return;

    const charId: CharacterId = persona === "fierce" ? "sarcastic" : persona === "wise" ? "rational" : "gentle";
    const access = canAccessCharacter(charId, isVip, user?.created_at);
    if (!access.allowed) {
      setPersonaLockOpen(true);
      return;
    }

    setDrawing(true);
    try {
      const { card: next, source } = await drawNextSoulCard({ isVip, persona });
      revealCard(next, source);
    } catch {
      toast("抽卡失敗，請稍後再試");
    } finally {
      setDrawing(false);
    }
  };

  const quoteText = card ? displayDailyCardText(card.quote) : "…";
  const insightText = card ? formatSoulInsight(card.vipReading) : "";

  return (
    <div
      className={cn(
        "daily-card-page relative flex h-dvh max-h-dvh w-full flex-col items-center justify-between overflow-hidden px-4 pt-3",
        "pb-[calc(6rem+env(safe-area-inset-bottom,0px))]",
        "pt-[max(0.75rem,env(safe-area-inset-top))]",
      )}
    >
      <div className="daily-card-stars" aria-hidden="true" />

      <div className="relative z-10 mb-2 flex w-full max-w-sm shrink-0 flex-col gap-2 pr-10">
        <header className="text-center">
          <BestieAppBrandLine />
          <h1 className="mt-0.5 font-display text-xl font-bold tracking-wide text-stone-800 dark:text-stone-100 sm:text-2xl">
            靈魂抽卡治療室
          </h1>
          {userName && (
            <p className="mt-0.5 text-xs tracking-wide text-stone-500 dark:text-stone-400">
              {userName}，今日抽一張專屬靈魂金句 ✨
            </p>
          )}
        </header>

        <DailyCardPersonaPicker
          persona={persona}
          isVip={isVip}
          createdAt={user?.created_at}
          disabled={drawing}
          onSelect={handlePersonaSelect}
          onLockedSelect={() => setPersonaLockOpen(true)}
        />
      </div>

      <div className="relative z-10 my-auto flex min-h-0 w-full max-w-sm flex-1 max-h-[58vh] flex-col">
        <div className="bestie-gpu-layer perspective-[1200px] h-full min-h-0 w-full">
          <div
            className={cn(
              "daily-card-flip bestie-gpu-layer relative mx-auto h-full w-full",
              flipped && !flipSettled && "daily-card-flip-open",
              flipped && flipSettled && "daily-card-flip-settled",
            )}
            onTransitionEnd={handleFlipTransitionEnd}
          >
            {/* Card back — deck */}
            <button
              type="button"
              aria-label="點擊抽卡"
              aria-hidden={flipped && flipSettled}
              disabled={(!canDraw && flipped) || drawing}
              onClick={() => {
                if (!flipped) void runDraw();
              }}
              className={cn(
                "daily-card-face daily-card-face-back absolute inset-0 p-6",
                cardBase,
                theme.cardShell,
                theme.cardPaper,
                dailyCardThemeTransitionClass,
                flipped && "pointer-events-none",
              )}
            >
              <div className="daily-card-paper-grain" aria-hidden="true" />
              <div className="relative z-[1] flex h-full w-full flex-col items-center justify-center text-center">
                <DailyCardBackOrnament className={cn("size-20 shrink-0", theme.ornament, dailyCardThemeTransitionClass)} />
                <DailyCardStarDivider
                  className={cn("mt-3 h-7 w-44 shrink-0", theme.divider, dailyCardThemeTransitionClass)}
                />
                <p
                  className={cn(
                    "mt-3 font-[family-name:var(--font-card-hand)] text-3xl",
                    theme.cardTitle,
                    dailyCardThemeTransitionClass,
                  )}
                  style={{ fontFamily: "var(--font-card-hand)" }}
                >
                  心事 Bestie
                </p>
                <p
                  className={cn(
                    "mt-2 max-w-[16rem] text-[13px] leading-relaxed tracking-[0.12em]",
                    theme.cardMuted,
                    dailyCardThemeTransitionClass,
                  )}
                >
                  {drawing ? "Bestie 準備緊…" : "輕觸卡片 · 抽取今日的靈魂語錄"}
                </p>
              </div>
            </button>

            {/* Card front — quote (outer: 3D flip; inner: export capture without mirror transform) */}
            <div className="daily-card-face daily-card-face-front absolute inset-0">
              <div
                ref={exportRef}
                data-soul-card-export-root
                data-soul-card-persona={cardPersona}
                data-soul-card-export-scheme={appTheme}
                className={cn(
                  "soul-card-export-root flex h-full min-h-0 w-full flex-col p-5 sm:p-6",
                  cardBase,
                  frontTheme.cardShell,
                  frontTheme.cardPaper,
                  dailyCardThemeTransitionClass,
                )}
              >
                <div className="daily-card-paper-grain" aria-hidden="true" />

                <DailyCardStarDivider
                  className={cn(
                    "soul-card-export-divider relative z-[1] mx-auto h-7 w-full max-w-[240px] shrink-0",
                    frontTheme.divider,
                    dailyCardThemeTransitionClass,
                  )}
                />

                <div className="relative z-[1] mt-3 flex shrink-0 items-center gap-3">
                  <PersonaAvatar personaId={cardPersona} className={cn("size-10 shrink-0 ring-1", frontTheme.avatarRing)} />
                  <div className="min-w-0 text-left">
                    <p
                      className={cn(
                        "soul-card-export-title text-sm font-medium tracking-wide",
                        frontTheme.cardTitle,
                        dailyCardThemeTransitionClass,
                      )}
                    >
                      {active.name}
                    </p>
                    <p
                      className={cn(
                        "soul-card-export-muted text-[11px] tracking-[0.14em]",
                        frontTheme.cardMuted,
                        dailyCardThemeTransitionClass,
                      )}
                    >
                      今日靈魂語錄
                    </p>
                  </div>
                </div>

                <div className="relative z-[1] flex flex-1 flex-col items-center justify-center px-1 py-2">
                  <div className="relative w-full px-3 py-2 text-center">
                    <span
                      className={cn(
                        "soul-card-export-mark pointer-events-none absolute left-0 top-0 font-[family-name:var(--font-card-serif)] text-4xl leading-none",
                        frontTheme.quoteMark,
                        dailyCardThemeTransitionClass,
                      )}
                      style={{ fontFamily: "var(--font-card-serif)" }}
                      aria-hidden
                    >
                      “
                    </span>
                    <p
                      className={cn(
                        "soul-card-export-quote font-[family-name:var(--font-card-serif)] text-[16px] leading-relaxed tracking-wide sm:text-[17px] sm:leading-loose",
                        frontTheme.quoteText,
                        dailyCardThemeTransitionClass,
                      )}
                      style={{ fontFamily: "var(--font-card-serif)" }}
                    >
                      {quoteText}
                    </p>
                    <span
                      className={cn(
                        "soul-card-export-mark pointer-events-none absolute bottom-0 right-0 font-[family-name:var(--font-card-serif)] text-4xl leading-none",
                        frontTheme.quoteMark,
                        dailyCardThemeTransitionClass,
                      )}
                      style={{ fontFamily: "var(--font-card-serif)" }}
                      aria-hidden
                    >
                      ”
                    </span>
                  </div>
                </div>

                {card && (
                  <div
                    className={cn(
                      "soul-card-export-insight relative z-[1] shrink-0 rounded-2xl py-2.5 pl-3 pr-3",
                      frontTheme.insightBox,
                      dailyCardThemeTransitionClass,
                    )}
                  >
                    <p
                      className={cn(
                        "soul-card-export-insight-title mb-1 text-[15px] tracking-wide",
                        frontTheme.insightTitle,
                        dailyCardThemeTransitionClass,
                      )}
                      style={{ fontFamily: "var(--font-card-hand)" }}
                    >
                      ❖ Bestie 靈魂語錄
                    </p>
                    <p
                      className={cn(
                        "soul-card-export-body text-[13px] leading-relaxed",
                        frontTheme.cardBody,
                        dailyCardThemeTransitionClass,
                      )}
                    >
                      {insightText}
                    </p>
                  </div>
                )}

                {!canDraw && (
                  <p
                    className={cn(
                      "soul-card-export-muted relative z-[1] mt-2 shrink-0 text-center text-[11px] leading-relaxed",
                      frontTheme.cardMuted,
                      dailyCardThemeTransitionClass,
                    )}
                  >
                    {DAILY_CARD_ROLE_CLAIMED_HINT}
                  </p>
                )}
                <p
                  className={cn(
                    "soul-card-export-muted relative z-[1] mt-1 shrink-0 text-center text-[10px] tracking-[0.2em]",
                    frontTheme.cardMuted,
                    dailyCardThemeTransitionClass,
                  )}
                >
                  心事 Bestie · {todayDateKey()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {flipped && (
        <div className="relative z-10 mt-2 w-full max-w-sm shrink-0">
          <Button
            className={cn(
              "h-11 w-full rounded-full border-0 font-medium shadow-md shadow-violet-200/40 max-md:shadow-sm",
              "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600",
              "dark:from-violet-400 dark:to-fuchsia-400 dark:shadow-violet-900/40 max-md:dark:shadow-none dark:hover:from-violet-300 dark:hover:to-fuchsia-300",
              dailyCardThemeTransitionClass,
            )}
            disabled={downloading || !card}
            onClick={() => void saveFromElement(exportRef.current)}
          >
            {downloading ? SOUL_CARD_DOWNLOAD_BUSY_LABEL : "✨ 下載靈魂卡片"}
          </Button>
        </div>
      )}

      <SoulCardSavePreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} previewUrl={previewUrl} />

      <DailyCardPersonaLockDialog open={personaLockOpen} onOpenChange={setPersonaLockOpen} />
      <VipUnlockDialog open={vipOpen} onOpenChange={setVipOpen} title={vipDialogTitle} />
    </div>
  );
}