import { describe, expect, it } from "vitest";
import {
  formatNotifTimeValue,
  getEveningNotifEnabled,
  getEveningNotifTime,
  getMorningNotifEnabled,
  getMorningNotifTime,
  isPastScheduleToday,
  msUntilNextSchedule,
  MORNING_AT,
  parseNotifTimeValue,
  setMorningNotifTime,
} from "@/lib/care-notifications";

describe("care notifications", () => {
  it("defaults morning and evening toggles to enabled", () => {
    localStorage.clear();
    expect(getMorningNotifEnabled()).toBe(true);
    expect(getEveningNotifEnabled()).toBe(true);
  });

  it("computes ms until next schedule", () => {
    const now = new Date("2026-10-22T07:00:00");
    const ms = msUntilNextSchedule(MORNING_AT.hour, MORNING_AT.minute, now);
    expect(ms).toBe(90 * 60 * 1000);
  });

  it("detects past schedule for today", () => {
    expect(isPastScheduleToday(8, 30, new Date("2026-10-22T09:00:00"))).toBe(true);
    expect(isPastScheduleToday(8, 30, new Date("2026-10-22T08:00:00"))).toBe(false);
  });

  it("persists custom notification times", () => {
    localStorage.clear();
    expect(getMorningNotifTime()).toEqual(MORNING_AT);
    setMorningNotifTime(9, 15);
    expect(getMorningNotifTime()).toEqual({ hour: 9, minute: 15 });
    expect(formatNotifTimeValue(getMorningNotifTime())).toBe("09:15");
    expect(parseNotifTimeValue("07:45")).toEqual({ hour: 7, minute: 45 });
    expect(getEveningNotifTime()).toEqual({ hour: 22, minute: 30 });
  });
});
