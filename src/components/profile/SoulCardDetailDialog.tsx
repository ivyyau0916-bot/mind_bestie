import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  DailyCardStarDivider,
  formatSoulInsight,
} from "@/components/daily-card/DailyCardVisuals";
import { SoulCardSavePreviewDialog } from "@/components/daily-card/SoulCardSavePreviewDialog";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { UserCardHistoryEntry } from "@/lib/bestie-account";
import { getPersona } from "@/lib/chat-personas";
import { dailyCardThemeTransitionClass, getDailyCardPersonaTheme } from "@/lib/daily-card-persona-theme";
import { findDailySoulCard } from "@/lib/daily-card-quotes";
import { displayDailyCardText } from "@/lib/hk-traditional";
import { SOUL_CARD_DOWNLOAD_BUSY_LABEL, preloadSoulCardCaptureForExport } from "@/lib/soul-card-share";
import { useSoulCardSave } from "@/hooks/use-soul-card-save";
import { useMood } from "@/lib/mood-store";
import { cn } from "@/lib/utils";

function formatHistoryDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  return `${y}年${m}月${d}日`;
}

type SoulCardDetailDialogProps = {
  entry: UserCardHistoryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SoulCardDetailDialog({ entry, open, onOpenChange }: SoulCardDetailDialogProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const { theme: appTheme } = useMood();
  const { busy, saveFromElement, previewOpen, setPreviewOpen, previewUrl } = useSoulCardSave();

  useEffect(() => {
    if (!open || !entry) return;
    const node = exportRef.current;
    if (!node) return;
    preloadSoulCardCaptureForExport(node);
  }, [open, entry]);

  if (!entry) return null;

  const resolved = findDailySoulCard({ id: entry.id, quote: entry.quote });
  const persona = entry.role ?? entry.persona ?? resolved?.persona ?? "gentle";
  const active = getPersona(persona);
  const theme = getDailyCardPersonaTheme(persona);
  const quoteText = displayDailyCardText(entry.quote);
  const insightText = resolved?.vipReading ? formatSoulInsight(resolved.vipReading) : "";
  const icon = resolved?.icon ?? "🎴";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "bestie-soul-card-detail fixed inset-0 left-0 top-0 h-[100dvh] max-h-[100dvh] w-full max-w-md translate-x-0 translate-y-0",
          "border-0 bg-stone-900/40 p-0 shadow-none sm:rounded-none",
          "[&>button.absolute]:hidden",
        )}
      >
        <div className="relative flex h-full flex-col items-center justify-center px-4 py-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1rem)]">
          <button
            type="button"
            aria-label="關閉"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-[max(env(safe-area-inset-top),1rem)] z-20 flex size-10 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md dark:bg-stone-900/90 dark:text-stone-100"
          >
            <X className="size-5" />
          </button>

          <div
            ref={exportRef}
            data-soul-card-export-root
            data-soul-card-persona={persona}
            data-soul-card-export-scheme={appTheme}
            className={cn(
              "soul-card-export-root daily-card-canvas relative w-full max-w-sm overflow-hidden rounded-3xl p-5 sm:p-6",
              theme.cardShell,
              theme.cardPaper,
              dailyCardThemeTransitionClass,
            )}
          >
            <div className="daily-card-paper-grain" aria-hidden="true" />
            <DailyCardStarDivider
              className={cn(
                "soul-card-export-divider relative z-[1] mx-auto h-7 w-full max-w-[240px]",
                theme.divider,
                dailyCardThemeTransitionClass,
              )}
            />
            <div className="relative z-[1] mt-3 flex items-center gap-3">
              <PersonaAvatar personaId={persona} className={cn("size-10 shrink-0 ring-1", theme.avatarRing)} />
              <div className="min-w-0 text-left">
                <p className={cn("soul-card-export-title text-sm font-medium", theme.cardTitle, dailyCardThemeTransitionClass)}>
                  {active.shortName}
                </p>
                <p className={cn("soul-card-export-muted text-[11px]", theme.cardMuted, dailyCardThemeTransitionClass)}>
                  {formatHistoryDate(entry.dateKey)} 抽卡
                </p>
              </div>
              <span className="ml-auto text-2xl" aria-hidden="true">
                {icon}
              </span>
            </div>
            <blockquote
              className={cn(
                "soul-card-export-quote relative z-[1] mt-4 font-[family-name:var(--font-card-serif)] text-lg leading-relaxed tracking-wide sm:text-xl",
                theme.quoteText,
                dailyCardThemeTransitionClass,
              )}
              style={{ fontFamily: "var(--font-card-serif)" }}
            >
              「{quoteText}」
            </blockquote>
            {insightText && (
              <p
                className={cn(
                  "soul-card-export-body relative z-[1] mt-4 text-[13px] leading-relaxed",
                  theme.cardBody,
                  dailyCardThemeTransitionClass,
                )}
              >
                {insightText}
              </p>
            )}
          </div>

          <div className="relative z-10 mt-5 w-full max-w-sm">
            <Button
              type="button"
              className="h-11 w-full rounded-full border-0 font-medium shadow-md shadow-violet-200/40 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 dark:shadow-violet-900/40 dark:hover:from-violet-300 dark:hover:to-fuchsia-300"
              disabled={busy}
              onClick={() => void saveFromElement(exportRef.current)}
            >
              {busy ? SOUL_CARD_DOWNLOAD_BUSY_LABEL : "✨ 下載靈魂卡片"}
            </Button>
          </div>
        </div>

        <SoulCardSavePreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} previewUrl={previewUrl} />
      </DialogContent>
    </Dialog>
  );
}
