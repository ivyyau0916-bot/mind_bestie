import type { PersonaId } from "@/lib/chat-personas";
import { todayDateKey } from "@/lib/freemium";

export const USER_NAME_KEY = "bestie_user_name";
export const USER_CARD_HISTORY_KEY = "userCardHistory";
export const MILESTONE_CLAIMED_KEY = "bestie_milestone_claimed_days";

export type UserCardHistoryEntry = {
  id: string;
  quote: string;
  dateKey: string;
  /** Bestie 角色（與 persona 相同；保留 persona 以相容舊資料） */
  persona: PersonaId;
  role: PersonaId;
};

function readStorage(key: string): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(key);
}

function writeStorage(key: string, value: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, value);
}

export function normalizeUserName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, 16);
}

export function getUserName(): string | null {
  const raw = readStorage(USER_NAME_KEY);
  if (!raw) return null;
  const name = normalizeUserName(raw);
  return name.length > 0 ? name : null;
}

export function setUserName(name: string): void {
  const normalized = normalizeUserName(name);
  if (!normalized) return;
  writeStorage(USER_NAME_KEY, normalized);
}

export function getUserCardHistory(): UserCardHistoryEntry[] {
  try {
    const raw = readStorage(USER_CARD_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is UserCardHistoryEntry & { persona?: PersonaId; role?: PersonaId } =>
          !!item
          && typeof item === "object"
          && typeof (item as UserCardHistoryEntry).id === "string"
          && typeof (item as UserCardHistoryEntry).quote === "string"
          && typeof (item as UserCardHistoryEntry).dateKey === "string",
      )
      .map((item) => {
        const role = item.role ?? item.persona ?? "gentle";
        const persona = item.persona ?? role;
        return { ...item, persona, role };
      });
  } catch {
    return [];
  }
}

export function appendUserCardHistory(entry: Omit<UserCardHistoryEntry, "dateKey"> & { dateKey?: string }): void {
  const history = getUserCardHistory();
  const dateKey = entry.dateKey ?? todayDateKey();
  const role = entry.persona;
  const next: UserCardHistoryEntry = {
    id: entry.id,
    quote: entry.quote,
    dateKey,
    persona: role,
    role,
  };
  if (history.some((h) => h.id === next.id && h.dateKey === next.dateKey && h.role === next.role)) return;
  writeStorage(USER_CARD_HISTORY_KEY, JSON.stringify([next, ...history].slice(0, 200)));
}

export function getClaimedMilestoneDays(): number[] {
  try {
    const raw = readStorage(MILESTONE_CLAIMED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  } catch {
    return [];
  }
}

export function markMilestoneClaimed(days: number): void {
  const claimed = new Set(getClaimedMilestoneDays());
  claimed.add(days);
  writeStorage(MILESTONE_CLAIMED_KEY, JSON.stringify([...claimed].sort((a, b) => a - b)));
}

export function clearBestieAccountData(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(USER_NAME_KEY);
  localStorage.removeItem(USER_CARD_HISTORY_KEY);
  localStorage.removeItem(MILESTONE_CLAIMED_KEY);
}
