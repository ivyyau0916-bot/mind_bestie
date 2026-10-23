import { beforeEach, describe, expect, it } from "vitest";
import { markMilestoneClaimed } from "@/lib/bestie-account";
import { detectUnclaimedMilestone, getMilestoneForTotalDays } from "@/lib/self-care-milestones";

describe("self-care milestones", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("detects milestone when total days cross threshold", () => {
    const milestone = detectUnclaimedMilestone(2, 3);
    expect(milestone?.days).toBe(3);
    expect(milestone?.title).toBe("微光初綻");
  });

  it("does not re-trigger claimed milestones", () => {
    markMilestoneClaimed(7);
    expect(detectUnclaimedMilestone(6, 7)).toBeNull();
  });

  it("maps milestone metadata", () => {
    expect(getMilestoneForTotalDays(30)?.emoji).toBe("✨");
  });
});
