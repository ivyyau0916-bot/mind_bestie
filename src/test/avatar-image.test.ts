import { describe, expect, it } from "vitest";
import { AVATAR_JPEG_QUALITY, AVATAR_MAX_EDGE_PX } from "@/lib/avatar-image";

describe("avatar image constants", () => {
  it("uses reasonable compression defaults", () => {
    expect(AVATAR_MAX_EDGE_PX).toBe(512);
    expect(AVATAR_JPEG_QUALITY).toBeGreaterThan(0.5);
    expect(AVATAR_JPEG_QUALITY).toBeLessThanOrEqual(1);
  });
});
