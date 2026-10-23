import type { PersonaId } from "@/lib/chat-personas";
import { detectUnclaimedMilestone, type SelfCareMilestone } from "@/lib/self-care-milestones";
import { todayDateKey } from "@/lib/freemium";

export const SELF_CARE_STATE_KEY = "bestie_self_care_state";
export const SELF_CARE_DAILY_RECORDS_KEY = "bestie_self_care_daily_records";
export const SELF_CARE_STREAK_KEY = "bestie_self_care_streak";
export const SELF_CARE_LAST_COMPLETE_KEY = "bestie_self_care_last_complete_date";

export const SELF_CARE_COMPLETE_MESSAGE =
  "✨ 今日的微光已完全收集！無論今天過得如何，你都已經非常棒了 ❤️";

export type SelfCareIconId =
  | "droplet"
  | "cloud"
  | "heart"
  | "leaf"
  | "sun"
  | "feather"
  | "message"
  | "walk"
  | "sparkle"
  | "note"
  | "music"
  | "moon";

export type SelfCareTask = {
  id: string;
  text: string;
  icon: SelfCareIconId;
};

export const SELF_CARE_TASK_POOL: SelfCareTask[] = [
  { id: "warm-water", icon: "droplet", text: "喝一杯溫水，感受當下的平靜" },
  { id: "daydream", icon: "cloud", text: "允許自己無所事事發呆 5 分鐘" },
  { id: "mirror-kind", icon: "heart", text: "對鏡子裡的自己說一聲「你做得很好」" },
  { id: "deep-breath", icon: "leaf", text: "深呼吸 3 次，感受空氣進入肺部的溫度" },
  { id: "music", icon: "music", text: "聽一首喜歡的歌，閉上眼睛沉浸其中" },
  { id: "journal", icon: "note", text: "寫下一個今天值得被記住的小事" },
  { id: "window", icon: "sun", text: "望出窗外 30 秒，只留意光與顏色的變化" },
  { id: "self-hug", icon: "heart", text: "給自己一個大大的抱抱，或伸個懶腰" },
  { id: "mindful-bite", icon: "sparkle", text: "慢下來，專注享受一口食物的味道" },
  { id: "phone-free", icon: "moon", text: "放下手機 15 分鐘，給大腦一段清空的時間" },
  { id: "stretch", icon: "leaf", text: "輕輕伸展肩頸，讓緊繃慢慢鬆開" },
  { id: "tidy-one", icon: "feather", text: "整理桌面一小角，讓視線變得清爽" },
  { id: "message", icon: "message", text: "傳一句「謝謝你」給一位重要的人" },
  { id: "walk", icon: "walk", text: "慢步行 3 分鐘，感受腳掌著地" },
  { id: "early-rest", icon: "moon", text: "早十分鐘關屏幕，讓雙眼休息" },
  { id: "warm-drink", icon: "droplet", text: "沖一杯暖飲，雙手捧著感受溫度" },
  { id: "soft-shoulders", icon: "feather", text: "聳肩再放下，讓肩膀離開耳朵" },
  { id: "kind-thought", icon: "sparkle", text: "對自己說一句溫柔的肯定，不用很完美" },
  { id: "look-sky", icon: "cloud", text: "抬頭看看天空，留意雲或光的形狀" },
  { id: "favorite-scent", icon: "leaf", text: "聞一聞喜歡的香氣，停留三個呼吸" },
  { id: "unclench", icon: "feather", text: "鬆開緊咬的牙關，讓下巴自然垂放" },
  { id: "tiny-dance", icon: "music", text: "隨手播 30 秒音樂，身體輕輕晃一晃" },
  { id: "thank-body", icon: "heart", text: "摸摸手臂或雙手，謝謝身體今天的付出" },
  { id: "plant-or-pet", icon: "sun", text: "看看綠植或毛孩，停留在一個可愛細節" },
  { id: "one-line-poem", icon: "note", text: "用一句話形容現在的心情，寫下來就好" },
  { id: "listen-close", icon: "walk", text: "閉眼 20 秒，只聽環境裡最遠的聲音" },
  { id: "comfort-item", icon: "sparkle", text: "拿一樣讓你安心的物品，握三秒" },
  { id: "gratitude-ping", icon: "message", text: "在心裡點名一件今天還算順利的小事" },
];

const SELF_CARE_NUDGES: Record<PersonaId, string[]> = {
  gentle: [
    "做得好，又對自己溫柔了一點點 ❤️",
    "呢個微光好靚，你值得被好好照顧 🫂",
    "慢慢嚟，你已經好努力喇 ✨",
  ],
  fierce: [
    "正呀！對自己好啲，唔係奢侈品係必需品 💪",
    "睇，你係可以對自己好嘅！",
    "收多一粒微光，今日都唔白過 ✨",
  ],
  wise: [
    "很好，這是一步具體的自我照顧。",
    "微行動累積起來，會改變一整天的狀態。",
    "你正在為自己建立更穩定的節奏 ✨",
  ],
};

export function pickSelfCareNudge(persona: PersonaId, taskId: string): string {
  const pool = SELF_CARE_NUDGES[persona];
  const index = hashString(`${taskId}:${persona}`) % pool.length;
  return pool[index] ?? pool[0]!;
}

export type SelfCareDayRecord = {
  completedIds: string[];
  rewardShown: boolean;
  /** Persisted daily draw; three task ids from {@link SELF_CARE_TASK_POOL}. */
  taskIds?: string[];
};

export type SelfCareState = SelfCareDayRecord & {
  dateKey: string;
};

type DailyRecordsMap = Record<string, SelfCareDayRecord>;

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const TASKS_PER_DAY = 3;

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function dayOrdinalFromDateKey(dateKey: string): number {
  const d = parseDateKey(dateKey);
  const utc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor(utc / 86_400_000);
}

export function shiftSelfCareDateKey(dateKey: string, dayDelta: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + dayDelta);
  return todayDateKey(d);
}

/** Month-scoped permutation so the same ordinal lands on different tasks each month. */
function orderedPoolForDateKey(dateKey: string): SelfCareTask[] {
  const monthKey = dateKey.slice(0, 7);
  return [...SELF_CARE_TASK_POOL].sort(
    (a, b) => hashString(`${monthKey}:perm:${a.id}`) - hashString(`${monthKey}:perm:${b.id}`),
  );
}

/**
 * Deterministic daily pick: consecutive calendar days use disjoint task triples
 * (slot indices differ by {@link TASKS_PER_DAY} in a rotated pool).
 */
export function computeDailySelfCareTaskIds(dateKey: string): string[] {
  const pool = orderedPoolForDateKey(dateKey);
  const len = pool.length;
  const daySlot = dayOrdinalFromDateKey(dateKey);
  const ids: string[] = [];
  for (let k = 0; k < TASKS_PER_DAY; k++) {
    ids.push(pool[(daySlot * TASKS_PER_DAY + k) % len]!.id);
  }
  return ids;
}

function isValidPersistedTaskIds(ids: unknown): ids is string[] {
  if (!Array.isArray(ids) || ids.length !== TASKS_PER_DAY) return false;
  const poolIds = new Set(SELF_CARE_TASK_POOL.map((t) => t.id));
  return ids.every((id) => typeof id === "string" && poolIds.has(id));
}

function ensureDailyTaskIds(dateKey: string, record: SelfCareDayRecord): string[] {
  if (isValidPersistedTaskIds(record.taskIds)) return record.taskIds;
  const taskIds = computeDailySelfCareTaskIds(dateKey);
  writeDayRecord(dateKey, { ...record, taskIds });
  return taskIds;
}

export function getDailySelfCareTasks(dateKey = todayDateKey()): SelfCareTask[] {
  const record = readDayRecord(dateKey);
  const taskIds = ensureDailyTaskIds(dateKey, record);
  const poolById = new Map(SELF_CARE_TASK_POOL.map((t) => [t.id, t]));
  return taskIds.map((id) => poolById.get(id)!);
}

function yesterdayDateKey(date = new Date()): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return todayDateKey(d);
}

function normalizeDayRecord(raw: unknown): SelfCareDayRecord {
  if (!raw || typeof raw !== "object") {
    return { completedIds: [], rewardShown: false };
  }
  const record = raw as Partial<SelfCareDayRecord>;
  const taskIds = isValidPersistedTaskIds(record.taskIds) ? record.taskIds : undefined;
  return {
    completedIds: Array.isArray(record.completedIds) ? record.completedIds.filter((id) => typeof id === "string") : [],
    rewardShown: Boolean(record.rewardShown),
    taskIds,
  };
}

function readAllRecords(): DailyRecordsMap {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(SELF_CARE_DAILY_RECORDS_KEY);
    const normalized: DailyRecordsMap = {};
    if (raw) {
      const parsed = JSON.parse(raw) as DailyRecordsMap;
      if (parsed && typeof parsed === "object") {
        for (const [key, value] of Object.entries(parsed)) {
          normalized[key] = normalizeDayRecord(value);
        }
      }
    }

    const legacyRaw = localStorage.getItem(SELF_CARE_STATE_KEY);
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw) as Partial<SelfCareState>;
        if (legacy.dateKey && Array.isArray(legacy.completedIds) && !normalized[legacy.dateKey]) {
          normalized[legacy.dateKey] = {
            completedIds: legacy.completedIds.filter((id) => typeof id === "string"),
            rewardShown: Boolean(legacy.rewardShown),
          };
          writeAllRecords(normalized);
        } else {
          localStorage.removeItem(SELF_CARE_STATE_KEY);
        }
      } catch {
        localStorage.removeItem(SELF_CARE_STATE_KEY);
      }
    }

    return normalized;
  } catch {
    return {};
  }
}

function writeAllRecords(records: DailyRecordsMap): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SELF_CARE_DAILY_RECORDS_KEY, JSON.stringify(records));
  localStorage.removeItem(SELF_CARE_STATE_KEY);
}

function readDayRecord(dateKey: string): SelfCareDayRecord {
  const records = readAllRecords();
  return records[dateKey] ?? { completedIds: [], rewardShown: false };
}

function writeDayRecord(dateKey: string, record: SelfCareDayRecord): void {
  const records = readAllRecords();
  records[dateKey] = record;
  writeAllRecords(records);
}

export function getSelfCareDayGlowSteps(dateKey: string): number {
  return countSelfCareCompletedForDate(dateKey);
}

/** Completed items for a date (0–3), only that day's three task ids count. */
export function countSelfCareCompletedForDate(
  dateKey: string,
  liveCompletedIds?: string[],
): number {
  const record = readDayRecord(dateKey);
  const taskIds = ensureDailyTaskIds(dateKey, record);
  const taskSet = new Set(taskIds);
  const source = liveCompletedIds ?? record.completedIds;
  return Math.min(source.filter((id) => taskSet.has(id)).length, TASKS_PER_DAY);
}

/** True if this date has at least one valid completed micro-action in daily records. */
export function hasSelfCareCheckInHistory(dateKey: string): boolean {
  return countSelfCareCompletedForDate(dateKey) > 0;
}

/** Days with all 3 micro-actions completed (persisted in daily records). */
export function getTotalSelfCareCompleteDays(): number {
  const records = readAllRecords();
  return Object.values(records).filter((record) => record.completedIds.length >= 3).length;
}

function isDayFullyComplete(dateKey: string): boolean {
  return getSelfCareDayGlowSteps(dateKey) >= 3;
}

export function loadSelfCareProgress(dateKey = todayDateKey()): SelfCareState {
  const record = readDayRecord(dateKey);
  return { dateKey, ...record };
}

export function getSelfCareStreak(): number {
  if (typeof localStorage === "undefined") return 0;
  const raw = localStorage.getItem(SELF_CARE_STREAK_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function setSelfCareStreak(streak: number): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SELF_CARE_STREAK_KEY, String(Math.max(0, streak)));
}

function bumpStreakOnDayComplete(dateKey: string): number {
  if (typeof localStorage === "undefined") return 0;
  const last = localStorage.getItem(SELF_CARE_LAST_COMPLETE_KEY);
  const current = getSelfCareStreak();
  if (last === dateKey) return current;

  let next = 1;
  if (last === yesterdayDateKey()) next = current + 1;
  setSelfCareStreak(next);
  localStorage.setItem(SELF_CARE_LAST_COMPLETE_KEY, dateKey);
  return next;
}

export type ToggleSelfCareResult = {
  state: SelfCareState;
  streak: number;
  totalCompleteDays: number;
  allComplete: boolean;
  shouldShowReward: boolean;
  milestoneUnlocked: SelfCareMilestone | null;
};

export function toggleSelfCareTask(taskId: string): ToggleSelfCareResult {
  const today = todayDateKey();
  const state = loadSelfCareProgress(today);
  const tasks = getDailySelfCareTasks(today);

  if (state.completedIds.includes(taskId)) {
    const allComplete = tasks.every((t) => state.completedIds.includes(t.id));
    return {
      state,
      streak: getSelfCareStreak(),
      totalCompleteDays: getTotalSelfCareCompleteDays(),
      allComplete,
      shouldShowReward: false,
      milestoneUnlocked: null,
    };
  }

  const totalBefore = getTotalSelfCareCompleteDays();
  const wasDayComplete = isDayFullyComplete(today);

  const completedIds = [...state.completedIds, taskId];
  const allComplete = tasks.every((t) => completedIds.includes(t.id));

  let rewardShown = state.rewardShown;
  let streak = getSelfCareStreak();
  let shouldShowReward = false;
  let milestoneUnlocked: SelfCareMilestone | null = null;

  if (allComplete) {
    streak = bumpStreakOnDayComplete(today);
    if (!rewardShown) {
      shouldShowReward = true;
      rewardShown = true;
    }
    if (!wasDayComplete) {
      const totalAfter = totalBefore + 1;
      milestoneUnlocked = detectUnclaimedMilestone(totalBefore, totalAfter);
    }
  }

  const nextState: SelfCareState = { dateKey: today, completedIds, rewardShown };
  const existing = readDayRecord(today);
  writeDayRecord(today, {
    ...existing,
    completedIds,
    rewardShown,
    taskIds: ensureDailyTaskIds(today, existing),
  });

  return {
    state: nextState,
    streak,
    totalCompleteDays: getTotalSelfCareCompleteDays(),
    allComplete,
    shouldShowReward,
    milestoneUnlocked,
  };
}

export function markSelfCareRewardDismissed(): void {
  const today = todayDateKey();
  const record = readDayRecord(today);
  writeDayRecord(today, { ...record, rewardShown: true });
}
