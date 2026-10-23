import { displayDailyCardText } from "@/lib/hk-traditional";

/** Strip legacy insight prefixes / crystal-ball emoji from stored copy. */
export function formatSoulInsight(raw?: string): string {
  const fallback = "Bestie 喺度陪住你，慢慢嚟。";
  if (!raw?.trim()) return fallback;
  const body =
    raw
      .trim()
      .replace(/^🔮\s*今日靈魂關心解讀：\s*/u, "")
      .replace(/^🔮\s*/u, "")
      .replace(/^今日靈魂關心解讀：\s*/u, "")
      .trim() || fallback;
  return displayDailyCardText(body);
}

/** Geometric soul-spark mark for the page sub-header (Morandi tones via `currentColor`). */
export function DailyCardInspirationMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      <path
        d="M12 4.5L12.85 8.15L16.5 9L12.85 9.85L12 13.5L11.15 9.85L7.5 9L11.15 8.15L12 4.5Z"
        stroke="currentColor"
        strokeWidth="0.65"
        strokeLinejoin="round"
      />
      <path
        d="M12 10.5V14.5M10 12.5H14"
        stroke="currentColor"
        strokeWidth="0.45"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M18.2 6.8L18.55 7.95L19.7 8.3L18.55 8.65L18.2 9.8L17.85 8.65L16.7 8.3L17.85 7.95L18.2 6.8Z"
        fill="currentColor"
        opacity="0.5"
      />
      <circle cx="6.4" cy="15.2" r="0.65" fill="currentColor" opacity="0.45" />
      <circle cx="17.6" cy="16.1" r="0.5" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export function DailyCardStarDivider({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 36"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M8 18H108" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" opacity="0.45" />
      <path
        d="M140 6L143.2 15.8L153 18L143.2 20.2L140 30L136.8 20.2L127 18L136.8 15.8L140 6Z"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      <path
        d="M140 12V24M134 18H146"
        stroke="currentColor"
        strokeWidth="0.45"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path d="M172 18H272" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" opacity="0.45" />
      <circle cx="140" cy="18" r="1.2" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export function DailyCardBackOrnament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="60" cy="60" r="52" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
      <circle cx="60" cy="60" r="38" stroke="currentColor" strokeWidth="0.35" strokeDasharray="2 4" opacity="0.35" />
      <path
        d="M60 18L62.5 28L72 30.5L62.5 33L60 43L57.5 33L48 30.5L57.5 28L60 18Z"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path
        d="M60 77L62 85L70 87L62 89L60 97L58 89L50 87L58 85L60 77Z"
        stroke="currentColor"
        strokeWidth="0.55"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}
