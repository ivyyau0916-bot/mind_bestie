import type { PersonaId } from "@/lib/chat-personas";
import { DAILY_SOUL_CARDS_CORE } from "@/lib/daily-card-quotes-core";
import { DAILY_SOUL_CARDS_EXTENDED } from "@/lib/daily-card-quotes-extended";
import { DAILY_SOUL_CARDS_FIERCE_EXTRA } from "@/lib/daily-card-quotes-fierce-extra";
import { DAILY_SOUL_CARDS_WISE_EXTRA } from "@/lib/daily-card-quotes-wise-extra";
export type { DailySoulCard } from "@/lib/daily-card-types";
import type { DailySoulCard } from "@/lib/daily-card-types";

export const DAILY_SOUL_CARDS: DailySoulCard[] = [
  ...DAILY_SOUL_CARDS_CORE,
  ...DAILY_SOUL_CARDS_EXTENDED,
  ...DAILY_SOUL_CARDS_FIERCE_EXTRA,
  ...DAILY_SOUL_CARDS_WISE_EXTRA,
];

export function getSoulCardsForPersona(persona: PersonaId): DailySoulCard[] {
  return DAILY_SOUL_CARDS.filter((card) => card.persona === persona);
}

export function findDailySoulCard(by: { id?: string; quote?: string }): DailySoulCard | undefined {
  if (by.id) {
    const hit = DAILY_SOUL_CARDS.find((card) => card.id === by.id);
    if (hit) return hit;
  }
  if (by.quote) return DAILY_SOUL_CARDS.find((card) => card.quote === by.quote);
  return undefined;
}

/** @deprecated Use drawNextSoulCard */
export function pickRandomDailyCard(excludeQuote?: string): DailySoulCard {
  const pool = excludeQuote ? DAILY_SOUL_CARDS.filter((c) => c.quote !== excludeQuote) : DAILY_SOUL_CARDS;
  return pool[Math.floor(Math.random() * pool.length)] ?? DAILY_SOUL_CARDS[0];
}

export const DAILY_SOUL_QUOTES = DAILY_SOUL_CARDS.map((c) => c.quote);

export function pickRandomDailyQuote(exclude?: string): string {
  return pickRandomDailyCard(exclude).quote;
}
