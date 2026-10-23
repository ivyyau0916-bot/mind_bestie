import type { PersonaId } from "@/lib/chat-personas";

export type SoulCardExportColorScheme = "light" | "dark";

export const SOUL_CARD_EXPORT_CAPTURE_CLASS = "soul-card-export-capture";
export const SOUL_CARD_EXPORT_CAPTURE_LIGHT_CLASS = "soul-card-export-capture--light";
export const SOUL_CARD_EXPORT_CAPTURE_DARK_CLASS = "soul-card-export-capture--dark";

/** Opaque dawn base (晨曦) — shared across personas */
export const SOUL_CARD_EXPORT_LIGHT_BACKGROUND = "#fdf8f6";

/** Opaque night bases per persona (夜空) */
export const SOUL_CARD_EXPORT_DARK_BACKGROUND: Record<PersonaId, string> = {
  gentle: "#1a0f1f",
  fierce: "#1a1208",
  wise: "#071824",
};

export function readSoulCardPersonaFromExportRoot(element: HTMLElement): PersonaId | null {
  const raw = element.dataset.soulCardPersona;
  if (raw === "gentle" || raw === "fierce" || raw === "wise") return raw;
  return null;
}

/** Prefer data attribute from React; fall back to `<html class="dark">`. */
export function resolveSoulCardExportColorScheme(element: HTMLElement): SoulCardExportColorScheme {
  const fromData = element.dataset.soulCardExportScheme;
  if (fromData === "light" || fromData === "dark") return fromData;
  if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
    return "dark";
  }
  return "light";
}

export function getSoulCardExportBackgroundColor(
  persona: PersonaId | null,
  scheme: SoulCardExportColorScheme,
): string {
  if (scheme === "light") return SOUL_CARD_EXPORT_LIGHT_BACKGROUND;
  if (persona) return SOUL_CARD_EXPORT_DARK_BACKGROUND[persona];
  return "#0f172a";
}

export async function withSoulCardExportCaptureTone<T>(
  element: HTMLElement,
  work: () => Promise<T>,
): Promise<T> {
  const scheme = resolveSoulCardExportColorScheme(element);
  element.classList.add(SOUL_CARD_EXPORT_CAPTURE_CLASS);
  element.classList.add(
    scheme === "dark" ? SOUL_CARD_EXPORT_CAPTURE_DARK_CLASS : SOUL_CARD_EXPORT_CAPTURE_LIGHT_CLASS,
  );
  try {
    return await work();
  } finally {
    element.classList.remove(
      SOUL_CARD_EXPORT_CAPTURE_CLASS,
      SOUL_CARD_EXPORT_CAPTURE_LIGHT_CLASS,
      SOUL_CARD_EXPORT_CAPTURE_DARK_CLASS,
    );
  }
}
