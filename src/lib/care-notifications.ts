import { todayDateKey } from "@/lib/freemium";

export const ENABLE_MORNING_NOTIF_KEY = "enable_morning_notif";
export const ENABLE_EVENING_NOTIF_KEY = "enable_evening_notif";
export const LAST_MORNING_NOTIF_DATE_KEY = "bestie_last_morning_notif_date";
export const LAST_EVENING_NOTIF_DATE_KEY = "bestie_last_evening_notif_date";

export const MORNING_AT = { hour: 8, minute: 30 } as const;
export const EVENING_AT = { hour: 22, minute: 30 } as const;

export const MORNING_NOTIF_HOUR_KEY = "bestie_morning_notif_hour";
export const MORNING_NOTIF_MINUTE_KEY = "bestie_morning_notif_minute";
export const EVENING_NOTIF_HOUR_KEY = "bestie_evening_notif_hour";
export const EVENING_NOTIF_MINUTE_KEY = "bestie_evening_notif_minute";

export type CareNotifTime = { hour: number; minute: number };

export const MORNING_NOTIFICATION = {
  title: "心事 Bestie · 打卡提醒",
  body: "早安呀！新的一天開始了，記得來點擊微光打卡，留下今天的專屬心情吧 🌸",
  tag: "bestie-care-morning",
} as const;

export const EVENING_NOTIFICATION = {
  title: "心事 Bestie · 晚安陪伴",
  body: "辛苦咗一日喇 🫂 今晚有咩心事？去【🌱 每日微光打卡】照顧一下自己，好好睡一覺 🌙",
  tag: "bestie-care-evening",
} as const;

export type CareNotifSlot = "morning" | "evening";

function readStorage(key: string): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(key);
}

function writeStorage(key: string, value: string) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, value);
}

function readEnabled(key: string): boolean {
  const raw = readStorage(key);
  if (raw === null) return true;
  return raw === "true";
}

function readSchedulePart(key: string, fallback: number, max: number): number {
  const raw = readStorage(key);
  if (raw === null) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0 || n > max) return fallback;
  return n;
}

function clampScheduleTime(hour: number, minute: number): CareNotifTime {
  const h = Math.min(23, Math.max(0, Math.floor(hour)));
  const m = Math.min(59, Math.max(0, Math.floor(minute)));
  return { hour: h, minute: m };
}

export function getMorningNotifTime(): CareNotifTime {
  return clampScheduleTime(
    readSchedulePart(MORNING_NOTIF_HOUR_KEY, MORNING_AT.hour, 23),
    readSchedulePart(MORNING_NOTIF_MINUTE_KEY, MORNING_AT.minute, 59),
  );
}

export function getEveningNotifTime(): CareNotifTime {
  return clampScheduleTime(
    readSchedulePart(EVENING_NOTIF_HOUR_KEY, EVENING_AT.hour, 23),
    readSchedulePart(EVENING_NOTIF_MINUTE_KEY, EVENING_AT.minute, 59),
  );
}

export function setMorningNotifTime(hour: number, minute: number) {
  const { hour: h, minute: m } = clampScheduleTime(hour, minute);
  writeStorage(MORNING_NOTIF_HOUR_KEY, String(h));
  writeStorage(MORNING_NOTIF_MINUTE_KEY, String(m));
}

export function setEveningNotifTime(hour: number, minute: number) {
  const { hour: h, minute: m } = clampScheduleTime(hour, minute);
  writeStorage(EVENING_NOTIF_HOUR_KEY, String(h));
  writeStorage(EVENING_NOTIF_MINUTE_KEY, String(m));
}

export function formatNotifTimeValue({ hour, minute }: CareNotifTime): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseNotifTimeValue(value: string): CareNotifTime | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return clampScheduleTime(hour, minute);
}

export function isCareNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getMorningNotifEnabled(): boolean {
  return readEnabled(ENABLE_MORNING_NOTIF_KEY);
}

export function getEveningNotifEnabled(): boolean {
  return readEnabled(ENABLE_EVENING_NOTIF_KEY);
}

export function setMorningNotifEnabled(enabled: boolean) {
  writeStorage(ENABLE_MORNING_NOTIF_KEY, enabled ? "true" : "false");
}

export function setEveningNotifEnabled(enabled: boolean) {
  writeStorage(ENABLE_EVENING_NOTIF_KEY, enabled ? "true" : "false");
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isCareNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function ensureNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isCareNotificationSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

function lastFireKey(slot: CareNotifSlot): string {
  return slot === "morning" ? LAST_MORNING_NOTIF_DATE_KEY : LAST_EVENING_NOTIF_DATE_KEY;
}

export function getLastNotifDate(slot: CareNotifSlot): string | null {
  return readStorage(lastFireKey(slot));
}

export function markNotifFired(slot: CareNotifSlot, date = todayDateKey()) {
  writeStorage(lastFireKey(slot), date);
}

export function msUntilNextSchedule(hour: number, minute: number, now = new Date()): number {
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

export function isPastScheduleToday(hour: number, minute: number, now = new Date()): boolean {
  if (now.getHours() > hour) return true;
  if (now.getHours() === hour && now.getMinutes() >= minute) return true;
  return false;
}

function shouldFireToday(slot: CareNotifSlot, hour: number, minute: number, now = new Date()): boolean {
  if (getLastNotifDate(slot) === todayDateKey(now)) return false;
  return isPastScheduleToday(hour, minute, now);
}

export function showCareNotification(slot: CareNotifSlot) {
  if (!isCareNotificationSupported() || Notification.permission !== "granted") return false;
  const payload = slot === "morning" ? MORNING_NOTIFICATION : EVENING_NOTIFICATION;
  const dateKey = todayDateKey();
  try {
    new Notification(payload.title, {
      body: payload.body,
      tag: `${payload.tag}-${dateKey}`,
      icon: "/logo.png",
    });
    markNotifFired(slot, dateKey);
    void pushStateToServiceWorker();
    return true;
  } catch {
    return false;
  }
}

export function getCareNotificationStateForWorker() {
  const morningTime = getMorningNotifTime();
  const eveningTime = getEveningNotifTime();
  return {
    morning: getMorningNotifEnabled(),
    evening: getEveningNotifEnabled(),
    lastMorning: getLastNotifDate("morning"),
    lastEvening: getLastNotifDate("evening"),
    morningHour: morningTime.hour,
    morningMinute: morningTime.minute,
    eveningHour: eveningTime.hour,
    eveningMinute: eveningTime.minute,
    morningTitle: MORNING_NOTIFICATION.title,
    morningBody: MORNING_NOTIFICATION.body,
    eveningTitle: EVENING_NOTIFICATION.title,
    eveningBody: EVENING_NOTIFICATION.body,
  };
}

let morningTimeout: ReturnType<typeof setTimeout> | null = null;
let eveningTimeout: ReturnType<typeof setTimeout> | null = null;
let pollInterval: ReturnType<typeof setInterval> | null = null;

function clearClientSchedulers() {
  if (morningTimeout) {
    clearTimeout(morningTimeout);
    morningTimeout = null;
  }
  if (eveningTimeout) {
    clearTimeout(eveningTimeout);
    eveningTimeout = null;
  }
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

function scheduleClientSlot(slot: CareNotifSlot, hour: number, minute: number) {
  const enabled = slot === "morning" ? getMorningNotifEnabled() : getEveningNotifEnabled();
  if (!enabled || Notification.permission !== "granted") return;

  if (shouldFireToday(slot, hour, minute)) {
    showCareNotification(slot);
  }

  const delay = msUntilNextSchedule(hour, minute);
  const timerRef = slot === "morning" ? (v: typeof morningTimeout) => { morningTimeout = v; } : (v: typeof eveningTimeout) => { eveningTimeout = v; };
  timerRef(
    setTimeout(() => {
      if (slot === "morning" ? getMorningNotifEnabled() : getEveningNotifEnabled()) {
        showCareNotification(slot);
      }
      scheduleClientSlot(slot, hour, minute);
    }, delay),
  );
}

function runClientPoll() {
  if (Notification.permission !== "granted") return;
  const morningTime = getMorningNotifTime();
  const eveningTime = getEveningNotifTime();
  if (getMorningNotifEnabled() && shouldFireToday("morning", morningTime.hour, morningTime.minute)) {
    showCareNotification("morning");
  }
  if (getEveningNotifEnabled() && shouldFireToday("evening", eveningTime.hour, eveningTime.minute)) {
    showCareNotification("evening");
  }
}

async function pushStateToServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (!reg?.active) return;
  reg.active.postMessage({
    type: "UPDATE_CARE_NOTIF",
    payload: getCareNotificationStateForWorker(),
  });
}

export async function registerCareNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/care-notifications-sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

/** (Re)start client timers + sync service worker after settings or permission change. */
export async function syncCareNotifications() {
  clearClientSchedulers();

  const anyEnabled = getMorningNotifEnabled() || getEveningNotifEnabled();
  if (!anyEnabled || Notification.permission !== "granted") {
    await pushStateToServiceWorker();
    return;
  }

  const morningTime = getMorningNotifTime();
  const eveningTime = getEveningNotifTime();
  scheduleClientSlot("morning", morningTime.hour, morningTime.minute);
  scheduleClientSlot("evening", eveningTime.hour, eveningTime.minute);
  pollInterval = setInterval(runClientPoll, 60_000);
  runClientPoll();

  await registerCareNotificationServiceWorker();
  await pushStateToServiceWorker();
}

export function stopCareNotifications() {
  clearClientSchedulers();
  void pushStateToServiceWorker();
}
