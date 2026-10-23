import type { PersonaId } from "@/lib/chat-personas";
import { fetchGeneratedSoulCard } from "@/lib/daily-card-openrouter";
import { DAILY_SOUL_CARDS, findDailySoulCard, getSoulCardsForPersona } from "@/lib/daily-card-quotes";
import type { DailySoulCard } from "@/lib/daily-card-types";

export const DRAWN_CARD_IDS_KEY = "drawn_card_ids";
export const DRAWN_CARDS_BY_PERSONA_KEY = "drawn_card_ids_by_persona";
export const DYNAMIC_SOUL_CARDS_KEY = "bestie_dynamic_soul_cards";
export const DAILY_CARD_ID_KEY = "bestie_daily_card_id";

const PERSONA_IDS: PersonaId[] = ["gentle", "fierce", "wise"];

function readStorage(key: string): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(key);
}

function writeStorage(key: string, value: string) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, value);
}

function emptyDrawnByPersona(): Record<PersonaId, string[]> {
  return { gentle: [], fierce: [], wise: [] };
}

function readDrawnByPersona(): Record<PersonaId, string[]> {
  try {
    const raw = readStorage(DRAWN_CARDS_BY_PERSONA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Record<PersonaId, string[]>>;
      return {
        gentle: Array.isArray(parsed.gentle) ? parsed.gentle.filter((id): id is string => typeof id === "string") : [],
        fierce: Array.isArray(parsed.fierce) ? parsed.fierce.filter((id): id is string => typeof id === "string") : [],
        wise: Array.isArray(parsed.wise) ? parsed.wise.filter((id): id is string => typeof id === "string") : [],
      };
    }
  } catch {
    /* fall through */
  }
  return emptyDrawnByPersona();
}

function writeDrawnByPersona(store: Record<PersonaId, string[]>) {
  writeStorage(DRAWN_CARDS_BY_PERSONA_KEY, JSON.stringify(store));
}

/** @deprecated Legacy flat queue; migrated away on first read. */
export function getDrawnCardIds(): string[] {
  return readDrawnByPersona().gentle;
}

export function getDrawnCardIdsForPersona(persona: PersonaId): string[] {
  return readDrawnByPersona()[persona];
}

export function setDrawnCardIdsForPersona(persona: PersonaId, ids: string[]) {
  const store = readDrawnByPersona();
  store[persona] = ids;
  writeDrawnByPersona(store);
}

export function setDrawnCardIds(ids: string[]) {
  setDrawnCardIdsForPersona("gentle", ids);
}

export function clearDrawnCardIds(persona?: PersonaId) {
  if (persona) {
    setDrawnCardIdsForPersona(persona, []);
    return;
  }
  writeDrawnByPersona(emptyDrawnByPersona());
  writeStorage(DRAWN_CARD_IDS_KEY, JSON.stringify([]));
}

export function markCardDrawn(id: string, persona: PersonaId) {
  const store = readDrawnByPersona();
  const ids = store[persona];
  if (ids.includes(id)) return;
  store[persona] = [...ids, id];
  writeDrawnByPersona(store);
}

export function getDynamicSoulCards(): DailySoulCard[] {
  try {
    const raw = readStorage(DYNAMIC_SOUL_CARDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is DailySoulCard =>
        !!item
        && typeof item === "object"
        && typeof (item as DailySoulCard).id === "string"
        && typeof (item as DailySoulCard).quote === "string"
        && PERSONA_IDS.includes((item as DailySoulCard).persona),
    );
  } catch {
    return [];
  }
}

export function addDynamicSoulCard(card: DailySoulCard) {
  const existing = getDynamicSoulCards();
  if (existing.some((c) => c.id === card.id || c.quote === card.quote)) return;
  writeStorage(DYNAMIC_SOUL_CARDS_KEY, JSON.stringify([...existing, card]));
}

export function getAllSoulCards(persona: PersonaId): DailySoulCard[] {
  const dynamic = getDynamicSoulCards().filter((c) => c.persona === persona);
  const builtin = getSoulCardsForPersona(persona);
  const seen = new Set<string>();
  const merged: DailySoulCard[] = [];
  for (const card of [...builtin, ...dynamic]) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    merged.push(card);
  }
  return merged;
}

/** Pick a local card for this persona, not yet drawn; reset persona queue when exhausted. */
export function drawLocalSoulCard(persona: PersonaId): DailySoulCard {
  const all = getAllSoulCards(persona);
  const store = readDrawnByPersona();
  let drawn = store[persona];
  let pool = all.filter((card) => !drawn.includes(card.id));

  if (pool.length === 0) {
    drawn = [];
    store[persona] = [];
    writeDrawnByPersona(store);
    pool = [...all];
  }

  const picked = pool[Math.floor(Math.random() * pool.length)] ?? all[0];
  if (picked) markCardDrawn(picked.id, persona);
  return picked;
}

export function isLocalDeckExhausted(persona: PersonaId): boolean {
  const all = getAllSoulCards(persona);
  const drawn = getDrawnCardIdsForPersona(persona);
  return all.length > 0 && drawn.length >= all.length;
}

export type DrawSoulCardResult = {
  card: DailySoulCard;
  source: "local" | "ai";
};

/** VIP → AI gold card; otherwise local no-duplicate queue per persona; AI fallback when deck was fully drawn. */
export async function drawNextSoulCard(options: {
  isVip: boolean;
  persona: PersonaId;
  forceAi?: boolean;
}): Promise<DrawSoulCardResult> {
  const { isVip, persona } = options;
  const deckExhausted = isLocalDeckExhausted(persona);

  if (isVip || options.forceAi || deckExhausted) {
    try {
      const recent = getAllSoulCards(persona).map((c) => c.quote).slice(-12);
      const card = await fetchGeneratedSoulCard({ persona, recentQuotes: recent });
      addDynamicSoulCard(card);
      markCardDrawn(card.id, persona);
      return { card, source: "ai" };
    } catch {
      if (deckExhausted) clearDrawnCardIds(persona);
    }
  }

  const card = drawLocalSoulCard(persona);
  return { card, source: "local" };
}

export function resolveSavedDailyCard(savedId: string | null, savedQuote: string | null): DailySoulCard | null {
  if (savedId) {
    const byId = findDailySoulCard({ id: savedId });
    if (byId) return byId;
    const dynamic = getDynamicSoulCards().find((c) => c.id === savedId);
    if (dynamic) return dynamic;
  }
  if (savedQuote) {
    return findDailySoulCard({ quote: savedQuote }) ?? {
      id: `legacy-${savedQuote.slice(0, 12)}`,
      persona: "gentle",
      quote: savedQuote,
      icon: "✨",
      vipReading: "",
    };
  }
  return null;
}
