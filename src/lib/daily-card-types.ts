import type { PersonaId } from "@/lib/chat-personas";

/** Cantonese soul card for daily draw. */
export type DailySoulCard = {
  id: string;
  /** Matches chat persona: gentle / fierce / wise. */
  persona: PersonaId;
  quote: string;
  icon: string;
  vipReading: string;
};
