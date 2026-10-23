import { Sparkles } from "lucide-react";

export function SelfCareFutureLocked() {
  return (
    <div
      className="flex w-full flex-col items-center justify-center rounded-2xl border border-stone-200/65 bg-gradient-to-b from-violet-50/80 via-white/85 to-stone-100/80 px-4 py-5 text-center shadow-sm backdrop-blur-sm max-md:backdrop-blur-none dark:border-stone-600/35 dark:from-violet-950/55 dark:via-stone-900/88 dark:to-stone-950/90 max-md:dark:from-violet-950/70"
      role="status"
      aria-live="polite"
    >
      <Sparkles className="mb-2 size-6 text-stone-400/90 dark:text-violet-300/70" aria-hidden />
      <p className="text-[12px] font-medium leading-relaxed text-stone-600 dark:text-stone-200">
        ✨ 未來的微光還在路上呢～
      </p>
      <p className="mt-1.5 max-w-[16rem] text-[11px] leading-relaxed text-muted-foreground">
        給生活留一點期待，等那天到了再來解鎖專屬你的溫柔微行動吧 ❤️
      </p>
    </div>
  );
}
