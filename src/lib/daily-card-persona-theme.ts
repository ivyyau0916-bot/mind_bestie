import type { PersonaId } from "@/lib/chat-personas";

export type DailyCardPersonaTheme = {
  cardPaper: string;
  cardShell: string;
  ornament: string;
  divider: string;
  avatarRing: string;
  quoteMark: string;
  /** Main quote typography (includes dark-mode soft glow). */
  quoteText: string;
  cardTitle: string;
  cardMuted: string;
  cardBody: string;
  insightBox: string;
  insightTitle: string;
  outlineBtn: string;
  pickerIdle: string;
  pickerSelected: string;
};

export const dailyCardThemeTransitionClass = "daily-card-theme-transition";

export const DAILY_CARD_PERSONA_THEME: Record<PersonaId, DailyCardPersonaTheme> = {
  gentle: {
    cardPaper:
      "bg-gradient-to-br from-[#FFFDF9] via-[#FAF2EE] to-[#FBE8E5] dark:bg-gradient-to-br dark:from-rose-950/60 dark:via-purple-900/50 dark:to-slate-900/80",
    cardShell:
      "border border-rose-200/60 shadow-md shadow-rose-100/30 dark:border-pink-400/40 dark:shadow-[0_0_15px_rgba(244,114,182,0.25)] dark:backdrop-blur-md max-md:dark:shadow-md max-md:dark:backdrop-blur-none max-md:dark:bg-slate-900/92",
    ornament: "text-rose-400/50 dark:text-pink-300/55",
    divider: "text-rose-400/55 dark:text-pink-300/60",
    avatarRing: "ring-rose-200/70 dark:ring-pink-400/45",
    quoteMark: "text-rose-300/50 dark:text-pink-300/50",
    quoteText:
      "text-stone-800 dark:text-rose-50/95 dark:[text-shadow:0_0_14px_rgba(244,114,182,0.38)]",
    cardTitle: "text-stone-800 dark:text-slate-100",
    cardMuted: "text-stone-400 dark:text-slate-300/90",
    cardBody: "text-stone-600 dark:text-slate-200/95",
    insightBox:
      "bg-rose-50/70 border-l-2 border-rose-300 dark:bg-white/8 dark:border-l-2 dark:border-pink-400/45 dark:backdrop-blur-sm max-md:dark:bg-slate-900/85 max-md:dark:backdrop-blur-none",
    insightTitle: "text-rose-900/75 dark:text-pink-100/95",
    outlineBtn:
      "border-rose-200/70 bg-white/45 hover:bg-rose-50/85 dark:border-pink-400/35 dark:bg-slate-900/35 dark:hover:bg-purple-950/40 dark:text-slate-100",
    pickerIdle:
      "border-rose-200/50 bg-white/50 dark:border-pink-500/30 dark:bg-slate-900/45 dark:backdrop-blur-sm max-md:dark:bg-slate-900/88 max-md:dark:backdrop-blur-none",
    pickerSelected:
      "border-rose-300/80 bg-rose-50/90 ring-1 ring-rose-200/50 dark:border-pink-400/50 dark:bg-purple-950/50 dark:ring-pink-500/35 dark:backdrop-blur-md max-md:dark:bg-purple-950/88 max-md:dark:backdrop-blur-none",
  },
  fierce: {
    cardPaper:
      "bg-gradient-to-br from-[#FFFBF7] via-[#FDF1E6] to-[#FBE2D3] dark:bg-gradient-to-br dark:from-amber-950/60 dark:via-orange-900/50 dark:to-slate-900/80",
    cardShell:
      "border border-amber-300/60 shadow-md shadow-amber-100/30 dark:border-amber-400/40 dark:shadow-[0_0_15px_rgba(251,191,36,0.25)] dark:backdrop-blur-md max-md:dark:shadow-md max-md:dark:backdrop-blur-none max-md:dark:bg-slate-900/92",
    ornament: "text-amber-600/45 dark:text-amber-300/55",
    divider: "text-amber-500/60 dark:text-amber-300/60",
    avatarRing: "ring-amber-300/70 dark:ring-amber-400/45",
    quoteMark: "text-amber-400/45 dark:text-amber-300/50",
    quoteText:
      "text-stone-800 dark:text-amber-50/95 dark:[text-shadow:0_0_14px_rgba(251,191,36,0.38)]",
    cardTitle: "text-stone-800 dark:text-slate-100",
    cardMuted: "text-stone-400 dark:text-slate-300/90",
    cardBody: "text-stone-600 dark:text-slate-200/95",
    insightBox:
      "bg-amber-50/80 border-l-2 border-amber-400 dark:bg-white/8 dark:border-l-2 dark:border-amber-400/45 dark:backdrop-blur-sm max-md:dark:bg-slate-900/85 max-md:dark:backdrop-blur-none",
    insightTitle: "text-amber-900/80 dark:text-amber-100/95",
    outlineBtn:
      "border-amber-300/70 bg-white/45 hover:bg-amber-50/90 dark:border-amber-400/35 dark:bg-slate-900/35 dark:hover:bg-amber-950/40 dark:text-slate-100",
    pickerIdle:
      "border-amber-200/55 bg-white/50 dark:border-amber-500/30 dark:bg-slate-900/45 dark:backdrop-blur-sm max-md:dark:bg-slate-900/88 max-md:dark:backdrop-blur-none",
    pickerSelected:
      "border-amber-400/85 bg-amber-50/95 ring-1 ring-amber-300/45 dark:border-amber-400/50 dark:bg-orange-950/45 dark:ring-amber-500/35 dark:backdrop-blur-md max-md:dark:bg-orange-950/88 max-md:dark:backdrop-blur-none",
  },
  wise: {
    cardPaper:
      "bg-gradient-to-br from-[#F8FAFC] via-[#EDF4F8] to-[#E1EAF0] dark:bg-gradient-to-br dark:from-cyan-950/60 dark:via-teal-900/50 dark:to-slate-900/80",
    cardShell:
      "border border-sky-200/60 shadow-md shadow-sky-100/30 dark:border-cyan-400/40 dark:shadow-[0_0_15px_rgba(34,211,238,0.25)] dark:backdrop-blur-md max-md:dark:shadow-md max-md:dark:backdrop-blur-none max-md:dark:bg-slate-900/92",
    ornament: "text-sky-400/50 dark:text-cyan-300/55",
    divider: "text-sky-400/55 dark:text-cyan-300/60",
    avatarRing: "ring-sky-200/70 dark:ring-cyan-400/45",
    quoteMark: "text-sky-300/55 dark:text-cyan-300/50",
    quoteText:
      "text-stone-800 dark:text-slate-50/95 dark:[text-shadow:0_0_14px_rgba(34,211,238,0.38)]",
    cardTitle: "text-stone-800 dark:text-slate-100",
    cardMuted: "text-stone-400 dark:text-slate-300/90",
    cardBody: "text-stone-600 dark:text-slate-200/95",
    insightBox:
      "bg-sky-50/70 border-l-2 border-sky-300 dark:bg-white/8 dark:border-l-2 dark:border-cyan-400/45 dark:backdrop-blur-sm max-md:dark:bg-slate-900/85 max-md:dark:backdrop-blur-none",
    insightTitle: "text-sky-900/75 dark:text-cyan-100/95",
    outlineBtn:
      "border-sky-200/70 bg-white/45 hover:bg-sky-50/85 dark:border-cyan-400/35 dark:bg-slate-900/35 dark:hover:bg-teal-950/40 dark:text-slate-100",
    pickerIdle:
      "border-sky-200/50 bg-white/50 dark:border-cyan-500/30 dark:bg-slate-900/45 dark:backdrop-blur-sm max-md:dark:bg-slate-900/88 max-md:dark:backdrop-blur-none",
    pickerSelected:
      "border-sky-300/80 bg-sky-50/90 ring-1 ring-sky-200/50 dark:border-cyan-400/50 dark:bg-teal-950/45 dark:ring-cyan-500/35 dark:backdrop-blur-md max-md:dark:bg-teal-950/88 max-md:dark:backdrop-blur-none",
  },
};

export function getDailyCardPersonaTheme(persona: PersonaId): DailyCardPersonaTheme {
  return DAILY_CARD_PERSONA_THEME[persona];
}
