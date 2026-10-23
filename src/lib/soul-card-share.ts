import {
  getSoulCardExportBackgroundColor,
  readSoulCardPersonaFromExportRoot,
  resolveSoulCardExportColorScheme,
  withSoulCardExportCaptureTone,
} from "@/lib/soul-card-export-capture";

export const SOUL_CARD_FILE_NAME = "soul-card.png";
export const SOUL_CARD_DOWNLOAD_SUCCESS_TOAST = "✨ 靈魂卡片已成功儲存至您的裝置！";
export const SOUL_CARD_DOWNLOAD_BUSY_LABEL = "正在生成卡片... ✨";
export const SOUL_CARD_SAVE_PREVIEW_HINT =
  "👆 請長按上方圖片，選擇「加入照片」或「儲存影像」";

export type SoulCardSaveResult =
  | { mode: "download" }
  | { mode: "preview"; previewUrl: string; revokePreviewUrl: () => void };

type HtmlToImageModule = typeof import("html-to-image");

let htmlToImageModulePromise: Promise<HtmlToImageModule> | null = null;
let cachedFontEmbedCss: string | null = null;
let fontEmbedWarmupPromise: Promise<void> | null = null;

function loadHtmlToImageModule(): Promise<HtmlToImageModule> {
  if (!htmlToImageModulePromise) {
    htmlToImageModulePromise = import("html-to-image");
  }
  return htmlToImageModulePromise;
}

/** Let the UI paint loading state before heavy canvas work (mobile jank fix). */
export function yieldToBrowserForCapture(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/** Fetch & cache the capture library chunk (safe to call many times). */
export function preloadSoulCardCaptureModule(): void {
  void loadHtmlToImageModule();
}

function scheduleIdleWork(work: () => void): void {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(work, { timeout: 2500 });
    return;
  }
  window.setTimeout(work, 0);
}

/** Precompute webfont embed CSS (desktop only — mobile skips to save seconds). */
export async function warmupSoulCardFontEmbed(element: HTMLElement): Promise<void> {
  if (shouldUseSoulCardSavePreview()) return;
  if (cachedFontEmbedCss) return;
  if (fontEmbedWarmupPromise) {
    await fontEmbedWarmupPromise;
    return;
  }

  fontEmbedWarmupPromise = (async () => {
    try {
      const { getFontEmbedCSS } = await loadHtmlToImageModule();
      cachedFontEmbedCss = await getFontEmbedCSS(element, { cacheBust: false });
    } catch {
      cachedFontEmbedCss = null;
    } finally {
      fontEmbedWarmupPromise = null;
    }
  })();

  await fontEmbedWarmupPromise;
}

/** Module preload immediately; font warmup when idle (desktop). */
export function preloadSoulCardCaptureForExport(element: HTMLElement): void {
  preloadSoulCardCaptureModule();
  if (shouldUseSoulCardSavePreview()) return;
  scheduleIdleWork(() => {
    void warmupSoulCardFontEmbed(element);
  });
}

/** Applied on the cloned node so 3D flip transforms never mirror exported PNGs. */
export function getSoulCardCaptureStyle(): Partial<CSSStyleDeclaration> {
  return {
    transform: "none",
    webkitTransform: "none",
    transformOrigin: "center center",
    backfaceVisibility: "visible",
    webkitBackfaceVisibility: "visible",
  };
}

const SKIP_CAPTURE_TAGS = new Set(["SCRIPT", "STYLE", "LINK", "NOSCRIPT"]);

export function shouldIncludeInSoulCardCapture(node: Node): boolean {
  if (!(node instanceof HTMLElement)) return true;

  const tag = node.tagName;
  if (SKIP_CAPTURE_TAGS.has(tag)) return false;
  if (node.hasAttribute("hidden")) return false;
  if (node.getAttribute("aria-hidden") === "true") return false;

  const style = window.getComputedStyle(node);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (style.opacity === "0") return false;

  return true;
}

/** Mobile: lower DPR + skip font network embed for faster capture. Desktop: 2x + optional font cache. */
export function getSoulCardCapturePixelRatio(): number {
  if (shouldUseSoulCardSavePreview()) {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    return Math.min(1.5, Math.max(1, dpr));
  }
  return 2;
}

export async function captureSoulCardBlob(element: HTMLElement): Promise<Blob> {
  const persona = readSoulCardPersonaFromExportRoot(element);
  const scheme = resolveSoulCardExportColorScheme(element);
  const backgroundColor = getSoulCardExportBackgroundColor(persona, scheme);
  const mobile = shouldUseSoulCardSavePreview();

  return withSoulCardExportCaptureTone(element, async () => {
    const { toBlob } = await loadHtmlToImageModule();
    const blob = await toBlob(element, {
      type: "image/png",
      pixelRatio: getSoulCardCapturePixelRatio(),
      cacheBust: false,
      skipFonts: mobile,
      backgroundColor,
      style: {
        ...getSoulCardCaptureStyle(),
        backgroundColor,
      },
      filter: shouldIncludeInSoulCardCapture,
      ...(!mobile && cachedFontEmbedCss ? { fontEmbedCSS: cachedFontEmbedCss } : {}),
    });
    if (!blob) throw new Error("無法產生卡片圖片");
    return blob;
  });
}

/** Mobile / touch browsers often block programmatic download — use long-press save preview. */
export function shouldUseSoulCardSavePreview(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  if (mobileUa) return true;

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 768px)").matches;
  return coarse && narrow;
}

export function downloadSoulCardBlob(blob: Blob, filename = SOUL_CARD_FILE_NAME): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function buildSoulCardBlob(element: HTMLElement): Promise<Blob> {
  preloadSoulCardCaptureModule();
  await warmupSoulCardFontEmbed(element);
  return captureSoulCardBlob(element);
}

export async function saveSoulCardFromElement(element: HTMLElement): Promise<SoulCardSaveResult> {
  await yieldToBrowserForCapture();
  const blob = await buildSoulCardBlob(element);

  if (shouldUseSoulCardSavePreview()) {
    const previewUrl = URL.createObjectURL(blob);
    return {
      mode: "preview",
      previewUrl,
      revokePreviewUrl: () => URL.revokeObjectURL(previewUrl),
    };
  }

  try {
    downloadSoulCardBlob(blob);
    return { mode: "download" };
  } catch {
    const previewUrl = URL.createObjectURL(blob);
    return {
      mode: "preview",
      previewUrl,
      revokePreviewUrl: () => URL.revokeObjectURL(previewUrl),
    };
  }
}

/** @deprecated Prefer saveSoulCardFromElement for mobile-aware flow */
export async function downloadSoulCardFromElement(element: HTMLElement): Promise<void> {
  const result = await saveSoulCardFromElement(element);
  if (result.mode === "download") return;
  result.revokePreviewUrl();
  throw new Error("PREVIEW_REQUIRED");
}
