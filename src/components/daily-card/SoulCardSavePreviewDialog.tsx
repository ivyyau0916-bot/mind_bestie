import { X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SOUL_CARD_SAVE_PREVIEW_HINT } from "@/lib/soul-card-share";
import { cn } from "@/lib/utils";

type SoulCardSavePreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Blob object URL or data URL for the generated card PNG */
  previewUrl: string | null;
};

export function SoulCardSavePreviewDialog({ open, onOpenChange, previewUrl }: SoulCardSavePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "z-[100] max-w-[min(100vw-2rem,22rem)] gap-0 overflow-hidden rounded-3xl border-violet-200/60 p-0",
          "bg-gradient-to-b from-violet-50/95 via-white to-fuchsia-50/90 dark:from-stone-900 dark:via-stone-900 dark:to-violet-950/40",
          "[&>button.absolute]:hidden",
        )}
      >
        <DialogTitle className="sr-only">靈魂卡片預覽</DialogTitle>
        <DialogDescription className="sr-only">{SOUL_CARD_SAVE_PREVIEW_HINT}</DialogDescription>

        <div className="relative px-4 pb-5 pt-5">
          <button
            type="button"
            aria-label="關閉預覽"
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full border border-violet-200/60 bg-white/95 text-stone-600 shadow-sm active:scale-95 dark:border-violet-500/30 dark:bg-stone-800/95 dark:text-stone-100"
          >
            <X className="size-4" strokeWidth={2} aria-hidden />
          </button>

          <p className="mb-3 pr-10 text-center text-sm font-semibold tracking-wide text-violet-800 dark:text-violet-200">
            ✨ 你的靈魂卡片
          </p>

          {previewUrl ? (
            <img
              src={previewUrl}
              alt="心事 Bestie 靈魂卡片"
              draggable={false}
              className="mx-auto w-full rounded-2xl shadow-lg ring-1 ring-violet-200/50 dark:ring-violet-500/30"
              style={{ WebkitTouchCallout: "default" }}
            />
          ) : (
            <div className="mx-auto aspect-[3/4] w-full animate-pulse rounded-2xl bg-violet-100/80 dark:bg-stone-800" />
          )}

          <p className="mt-4 text-center text-[13px] leading-relaxed text-stone-600 dark:text-stone-300">
            {SOUL_CARD_SAVE_PREVIEW_HINT}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
