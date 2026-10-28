/* eslint-disable no-restricted-globals */
/** Bestie morning/evening care notifications (PWA background, best-effort). */

const DEFAULT_STATE = {
  morning: true,
  evening: true,
  lastMorning: null,
  lastEvening: null,
  morningHour: 8,
  morningMinute: 30,
  eveningHour: 22,
  eveningMinute: 30,
  morningTitle: "心事 Bestie · 打卡提醒",
  morningBody: "",
  eveningTitle: "心事 Bestie · 晚安陪伴",
  eveningBody: "",
};

let state = { ...DEFAULT_STATE };

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isPastSchedule(hour, minute, now) {
  if (now.getHours() > hour) return true;
  if (now.getHours() === hour && now.getMinutes() >= minute) return true;
  return false;
}

async function maybeShow(slot) {
  const now = new Date();
  const key = todayKey();
  if (slot === "morning") {
    if (!state.morning) return;
    if (state.lastMorning === key) return;
    if (!isPastSchedule(state.morningHour, state.morningMinute, now)) return;
    await self.registration.showNotification(state.morningTitle, {
      body: state.morningBody,
      tag: `bestie-care-morning-${key}`,
      icon: "/logo.png",
    });
    state.lastMorning = key;
    return;
  }
  if (!state.evening) return;
  if (state.lastEvening === key) return;
  if (!isPastSchedule(state.eveningHour, state.eveningMinute, now)) return;
  await self.registration.showNotification(state.eveningTitle, {
    body: state.eveningBody,
    tag: `bestie-care-evening-${key}`,
    icon: "/logo.png",
  });
  state.lastEvening = key;
}

async function tick() {
  try {
    await maybeShow("morning");
    await maybeShow("evening");
  } catch {
    /* ignore */
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "UPDATE_CARE_NOTIF" && event.data.payload) {
    state = { ...state, ...event.data.payload };
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow("/");
    }),
  );
});

setInterval(tick, 60_000);
