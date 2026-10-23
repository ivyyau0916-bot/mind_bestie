import { beforeEach, describe, expect, it } from "vitest";
import { todayDateKey } from "@/lib/freemium";
import {
  computeDailySelfCareTaskIds,
  getDailySelfCareTasks,
  getSelfCareDayGlowSteps,
  hasSelfCareCheckInHistory,
  SELF_CARE_DAILY_RECORDS_KEY,
  SELF_CARE_LAST_COMPLETE_KEY,
  SELF_CARE_STREAK_KEY,
  SELF_CARE_TASK_POOL,
  shiftSelfCareDateKey,
  toggleSelfCareTask,
} from "@/lib/self-care-checkin";

describe("self-care check-in", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("picks three deterministic tasks per date", () => {
    const dateKey = "2026-10-23";
    const a = getDailySelfCareTasks(dateKey);
    const b = getDailySelfCareTasks(dateKey);
    const c = getDailySelfCareTasks("2026-10-24");
    expect(a).toHaveLength(3);
    expect(b.map((t) => t.id)).toEqual(a.map((t) => t.id));
    expect(c.map((t) => t.id)).not.toEqual(a.map((t) => t.id));
    for (const task of a) {
      expect(SELF_CARE_TASK_POOL.some((p) => p.id === task.id)).toBe(true);
    }
    const stored = JSON.parse(localStorage.getItem(SELF_CARE_DAILY_RECORDS_KEY) ?? "{}") as Record<
      string,
      { taskIds?: string[] }
    >;
    expect(stored[dateKey]?.taskIds).toEqual(a.map((t) => t.id));
  });

  it("keeps yesterday, today, and tomorrow task sets pairwise disjoint", () => {
    const today = "2026-10-23";
    const yesterday = shiftSelfCareDateKey(today, -1);
    const tomorrow = shiftSelfCareDateKey(today, 1);
    const sets = [yesterday, today, tomorrow].map((key) => new Set(computeDailySelfCareTaskIds(key)));
    expect(sets[0]!.intersection(sets[1]!).size).toBe(0);
    expect(sets[1]!.intersection(sets[2]!).size).toBe(0);
    expect(sets[0]!.intersection(sets[2]!).size).toBe(0);
  });

  it("has a rich task pool", () => {
    expect(SELF_CARE_TASK_POOL.length).toBeGreaterThanOrEqual(20);
  });

  it("increments streak when all daily tasks are completed", () => {
    const tasks = getDailySelfCareTasks(todayDateKey());
    toggleSelfCareTask(tasks[0]!.id);
    toggleSelfCareTask(tasks[1]!.id);
    const result = toggleSelfCareTask(tasks[2]!.id);
    expect(result.allComplete).toBe(true);
    expect(result.streak).toBe(1);
    expect(result.shouldShowReward).toBe(true);
    expect(result.totalCompleteDays).toBe(1);
    expect(result.milestoneUnlocked).toBeNull();
    expect(localStorage.getItem(SELF_CARE_LAST_COMPLETE_KEY)).toBeTruthy();
    expect(localStorage.getItem(SELF_CARE_STREAK_KEY)).toBe("1");
    expect(localStorage.getItem(SELF_CARE_DAILY_RECORDS_KEY)).toContain('"rewardShown":true');
    expect(getSelfCareDayGlowSteps(todayDateKey())).toBe(3);
  });

  it("reports check-in history only when at least one task was completed", () => {
    const dateKey = todayDateKey();
    expect(hasSelfCareCheckInHistory(dateKey)).toBe(false);
    const tasks = getDailySelfCareTasks(dateKey);
    toggleSelfCareTask(tasks[0]!.id);
    expect(hasSelfCareCheckInHistory(dateKey)).toBe(true);
  });

  it("caps glow steps at 3 when legacy completed ids exceed daily tasks", () => {
    const dateKey = "2026-10-23";
    const tasks = getDailySelfCareTasks(dateKey);
    const records = {
      [dateKey]: {
        completedIds: [...tasks.map((t) => t.id), "warm-water", "daydream", "journal"],
        rewardShown: false,
        taskIds: tasks.map((t) => t.id),
      },
    };
    localStorage.setItem(SELF_CARE_DAILY_RECORDS_KEY, JSON.stringify(records));
    expect(getSelfCareDayGlowSteps(dateKey)).toBe(3);
  });

  it("does not uncomplete a locked task on repeat toggle", () => {
    const tasks = getDailySelfCareTasks(todayDateKey());
    toggleSelfCareTask(tasks[0]!.id);
    const again = toggleSelfCareTask(tasks[0]!.id);
    expect(again.state.completedIds).toEqual([tasks[0]!.id]);
    expect(again.shouldShowReward).toBe(false);
  });
});
