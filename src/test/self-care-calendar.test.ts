import { describe, expect, it } from "vitest";
import {
  addCalendarMonths,
  buildCalendarCells,
  compareDateKeys,
  getCalendarMonthMeta,
  getTodayGlowProgress,
  isSameCalendarMonth,
  toDateKey,
} from "@/lib/self-care-calendar";

describe("self-care calendar", () => {
  it("builds a 7x5 grid for the viewed month", () => {
    const cells = buildCalendarCells(new Date(2026, 9, 23));
    expect(cells).toHaveLength(35);
    expect(cells.filter(Boolean).length).toBe(31);
  });

  it("returns month meta for a view date", () => {
    const meta = getCalendarMonthMeta(new Date(2026, 9, 23));
    expect(meta).toEqual({ year: 2026, month: 10 });
  });

  it("maps completed tasks to glow progress", () => {
    expect(getTodayGlowProgress(0)).toBe(0);
    expect(getTodayGlowProgress(1)).toBeCloseTo(0.333, 2);
    expect(getTodayGlowProgress(3)).toBe(1);
  });

  it("supports month navigation helpers", () => {
    const view = new Date(2026, 9, 1);
    const prev = addCalendarMonths(view, -1);
    expect(getCalendarMonthMeta(prev)).toEqual({ year: 2026, month: 9 });
    expect(isSameCalendarMonth(view, new Date(2026, 9, 15))).toBe(true);
    expect(isSameCalendarMonth(view, new Date(2026, 8, 30))).toBe(false);
  });

  it("formats stable date keys", () => {
    expect(toDateKey(2026, 10, 3)).toBe("2026-10-03");
  });

  it("compares date keys for past, same, and future", () => {
    expect(compareDateKeys("2026-10-22", "2026-10-23")).toBeLessThan(0);
    expect(compareDateKeys("2026-10-23", "2026-10-23")).toBe(0);
    expect(compareDateKeys("2026-10-24", "2026-10-23")).toBeGreaterThan(0);
  });
});
