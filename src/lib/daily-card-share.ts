export function getDailyCardShareUrl(): string {
  if (typeof window === "undefined") return "";
  return new URL(window.location.pathname, window.location.origin).href;
}

export function buildDailyCardShareText(quote: string): string {
  const appLink = getDailyCardShareUrl();
  return `${quote}\n\n— 心事 Bestie 靈魂抽卡治療室${appLink ? `\n${appLink}` : ""}`;
}

export async function copyShareTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!ok) throw new Error("copy failed");
}
