import { describe, expect, it, vi } from "vitest";

vi.mock("html-to-image", () => ({
  toBlob: vi.fn(),
  getFontEmbedCSS: vi.fn().mockResolvedValue("/* mock fonts */"),
}));

import {
  getSoulCardExportBackgroundColor,
  resolveSoulCardExportColorScheme,
  SOUL_CARD_EXPORT_LIGHT_BACKGROUND,
} from "@/lib/soul-card-export-capture";
import {
  SOUL_CARD_DOWNLOAD_BUSY_LABEL,
  SOUL_CARD_FILE_NAME,
  SOUL_CARD_SAVE_PREVIEW_HINT,
  getSoulCardCapturePixelRatio,
  getSoulCardCaptureStyle,
  preloadSoulCardCaptureModule,
  shouldIncludeInSoulCardCapture,
  shouldUseSoulCardSavePreview,
} from "@/lib/soul-card-share";

describe("soul card export helpers", () => {
  it("uses soul-card.png as default filename", () => {
    expect(SOUL_CARD_FILE_NAME).toBe("soul-card.png");
  });

  it("exposes UX copy for save flow", () => {
    expect(SOUL_CARD_DOWNLOAD_BUSY_LABEL).toContain("生成");
    expect(SOUL_CARD_SAVE_PREVIEW_HINT).toContain("長按");
  });

  it("resets flip transforms for export capture", () => {
    const style = getSoulCardCaptureStyle();
    expect(style.transform).toBe("none");
    expect(style.webkitTransform).toBe("none");
  });

  it("allows preloading capture module without throwing", () => {
    expect(() => {
      preloadSoulCardCaptureModule();
      preloadSoulCardCaptureModule();
    }).not.toThrow();
  });

  it("skips aria-hidden and hidden elements in capture filter", () => {
    const visible = document.createElement("p");
    visible.textContent = "quote";

    const grain = document.createElement("div");
    grain.setAttribute("aria-hidden", "true");

    const hidden = document.createElement("span");
    hidden.hidden = true;

    expect(shouldIncludeInSoulCardCapture(visible)).toBe(true);
    expect(shouldIncludeInSoulCardCapture(grain)).toBe(false);
    expect(shouldIncludeInSoulCardCapture(hidden)).toBe(false);
  });

  it("uses dawn background for light export and persona night bases for dark", () => {
    expect(getSoulCardExportBackgroundColor("gentle", "light")).toBe(SOUL_CARD_EXPORT_LIGHT_BACKGROUND);
    expect(getSoulCardExportBackgroundColor("wise", "dark")).not.toBe(
      getSoulCardExportBackgroundColor("fierce", "dark"),
    );
  });

  it("reads export color scheme from data attribute", () => {
    const el = document.createElement("div");
    el.dataset.soulCardExportScheme = "light";
    expect(resolveSoulCardExportColorScheme(el)).toBe("light");
  });

  it("prefers save preview on iPhone user agents", () => {
    const ua = vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    );
    expect(shouldUseSoulCardSavePreview()).toBe(true);
    expect(getSoulCardCapturePixelRatio()).toBeLessThanOrEqual(1.5);
    ua.mockRestore();
  });

  it("uses 2x pixel ratio on desktop capture", () => {
    const ua = vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Macintosh; Intel Mac OS X)");
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("max-width") ? false : false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    expect(shouldUseSoulCardSavePreview()).toBe(false);
    expect(getSoulCardCapturePixelRatio()).toBe(2);
    ua.mockRestore();
  });
});
