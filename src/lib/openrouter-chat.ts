import { createServerFn } from "@tanstack/react-start";
import { buildOpenRouterSystemPrompt, type PersonaId } from "@/lib/chat-personas";
import { detectUserCrisis, getCrisisSafeReply } from "@/lib/crisis-intervention";
import { normalizeToHongKongTraditional } from "@/lib/hk-traditional";

export type OpenRouterChatTurn = { role: "user" | "assistant"; content: string };

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
/** High-quality Cantonese-friendly default; override via VITE_OPENROUTER_MODEL. */
export const DEFAULT_OPENROUTER_MODEL = "qwen/qwen-2.5-72b-instruct";
export const DEFAULT_OPENROUTER_FALLBACK_MODELS = ["deepseek/deepseek-chat"] as const;

const MAX_RETRIES_PER_MODEL = 3;

/** Balance natural Cantonese vs. hallucination risk. */
export const OPENROUTER_CHAT_TEMPERATURE = 0.7;
export const OPENROUTER_TOP_P = 0.9;
export const OPENROUTER_FREQUENCY_PENALTY = 0.5;
/** ~150–200 繁體字以內，加快首字與整段完成時間。 */
export const OPENROUTER_CHAT_MAX_TOKENS = 180;
/** Fast chat context: system prompt + this many recent user/assistant turns (6–8). */
export const OPENROUTER_HISTORY_MIN_TURNS = 6;
export const OPENROUTER_HISTORY_MAX_TURNS = 8;
/** Per-turn cap keeps total prompt small for ~1–2s completions. */
export const OPENROUTER_TURN_CHAR_LIMIT = 320;

const UI_OR_ERROR_DUMP_PATTERN =
  /^(?:OpenRouter 回應失敗|哎呀，傾計暫時失敗|AI 通道暫時繁忙|未設定 VITE_OPENROUTER)/;

const TECH_CONTEXT_LEAK_PATTERN =
  /className=|strokeStyle|fontFamily|fontSize|__vite|localhost:\d+\/|"\s*:\s*\{[\s\S]*"persona"/i;

/** Strip non-dialogue or leaked UI/state from API context. */
export function sanitizeOpenRouterChatTurns(turns: OpenRouterChatTurn[]): OpenRouterChatTurn[] {
  return turns
    .filter((turn) => (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string")
    .map((turn) => ({ role: turn.role, content: turn.content.trim() }))
    .filter((turn) => turn.content.length > 0)
    .filter((turn) => !UI_OR_ERROR_DUMP_PATTERN.test(turn.content))
    .filter((turn) => !TECH_CONTEXT_LEAK_PATTERN.test(turn.content));
}

export type OpenRouterHistoryMessage = {
  role: "user" | "ai";
  text: string;
  time: number;
  persona?: PersonaId;
};

function truncateDialogueContent(content: string, maxChars = OPENROUTER_TURN_CHAR_LIMIT): string {
  const trimmed = content.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars)}…`;
}

export const OPENROUTER_MEMORY_SUMMARY_CHAR_LIMIT = 180;

function mapChatMessagesToTurns(messages: OpenRouterHistoryMessage[], replyPersona: PersonaId): OpenRouterChatTurn[] {
  return messages
    .filter(
      (message) =>
        message.role === "user"
        || (message.role === "ai" && message.time > 0 && message.persona === replyPersona),
    )
    .map((message) => ({
      role: message.role === "user" ? ("user" as const) : ("assistant" as const),
      content: truncateDialogueContent(message.text),
    }));
}

/** Condense older dialogue into one short line for the model (UI history stays full). */
export function buildDialogueMemorySummary(olderTurns: OpenRouterChatTurn[]): string | null {
  if (olderTurns.length === 0) return null;

  const userSnippets = olderTurns
    .filter((turn) => turn.role === "user")
    .map((turn) => turn.content.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const assistantSnippets = olderTurns
    .filter((turn) => turn.role === "assistant")
    .map((turn) => turn.content.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const parts: string[] = [];
  if (userSnippets.length > 0) {
    const lead = userSnippets[0]!;
    const tail = userSnippets.length > 1 ? userSnippets.at(-1)! : "";
    parts.push(tail && tail !== lead ? `曾講過「${lead}…」同「${tail}…」` : `曾講過「${lead}」`);
  }
  if (assistantSnippets.length > 0 && parts.length < 2) {
    parts.push(`Bestie 曾回應關於${assistantSnippets.at(-1)!.slice(0, 36)}…`);
  }

  if (parts.length === 0) return null;

  let line = `用戶最近提到嘅背景：${parts.join("；")}`;
  if (line.length > OPENROUTER_MEMORY_SUMMARY_CHAR_LIMIT) {
    line = `${line.slice(0, OPENROUTER_MEMORY_SUMMARY_CHAR_LIMIT - 1)}…`;
  }
  return line;
}

export type OpenRouterContextPack = {
  memorySummary: string | null;
  recentMessages: OpenRouterChatTurn[];
};

/**
 * Fast API context: system prompt (in {@link buildOpenRouterChatMessages}) + last 6–8 turns only.
 * UI / localStorage keeps the full thread; older turns are not sent to the model.
 */
export function buildOpenRouterContextFromChat(
  messages: OpenRouterHistoryMessage[],
  replyPersona: PersonaId,
  maxRecentTurns = OPENROUTER_HISTORY_MAX_TURNS,
): OpenRouterContextPack {
  const clamped = Math.min(
    OPENROUTER_HISTORY_MAX_TURNS,
    Math.max(OPENROUTER_HISTORY_MIN_TURNS, maxRecentTurns),
  );
  const allTurns = sanitizeOpenRouterChatTurns(mapChatMessagesToTurns(messages, replyPersona));
  const recentMessages = allTurns.slice(-clamped);
  return { memorySummary: null, recentMessages };
}

/** @deprecated Prefer {@link buildOpenRouterContextFromChat} for summary + recent split. */
export function buildOpenRouterHistoryFromChat(
  messages: OpenRouterHistoryMessage[],
  replyPersona: PersonaId,
  maxTurns = OPENROUTER_HISTORY_MAX_TURNS,
): OpenRouterChatTurn[] {
  return buildOpenRouterContextFromChat(messages, replyPersona, maxTurns).recentMessages;
}

export type OpenRouterChatRequest = {
  persona: PersonaId;
  messages: OpenRouterChatTurn[];
  memorySummary?: string | null;
  userName?: string | null;
};

export function buildOpenRouterChatMessages(data: OpenRouterChatRequest) {
  const dialogue = sanitizeOpenRouterChatTurns(data.messages);
  const lastUser = [...dialogue].reverse().find((message) => message.role === "user")?.content ?? "";
  let systemContent = buildOpenRouterSystemPrompt(data.persona, lastUser, data.userName);
  const summary = data.memorySummary?.trim();
  if (summary) {
    systemContent += `\n\n【記憶摘要】${summary}\n（以上係較早對話嘅濃縮；下面係最近完整對話，請一併參考。）`;
  }
  return [
    {
      role: "system" as const,
      content: systemContent,
    },
    ...dialogue,
  ];
}

/** Parse one OpenRouter SSE `data:` line into text delta (for tests + streaming). */
export function parseOpenRouterSseDataLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;
  const payload = trimmed.slice(5).trim();
  if (!payload || payload === "[DONE]") return null;
  try {
    const json = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
    };
    const delta = json.choices?.[0]?.delta?.content;
    if (typeof delta === "string" && delta.length > 0) return delta;
    const full = json.choices?.[0]?.message?.content;
    if (typeof full === "string" && full.length > 0) return full;
  } catch {
    return null;
  }
  return null;
}

export async function consumeOpenRouterSseStream(
  body: ReadableStream<Uint8Array>,
  onDelta: (chunk: string) => void,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let acc = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim() === "data: [DONE]") return acc;
      const piece = parseOpenRouterSseDataLine(line);
      if (!piece) continue;
      acc += piece;
      onDelta(piece);
    }
  }
  return acc;
}

function resolveApiKey() {
  return (process.env.VITE_OPENROUTER_API_KEY ?? import.meta.env.VITE_OPENROUTER_API_KEY)?.trim();
}

function resolvePrimaryModel() {
  return (process.env.VITE_OPENROUTER_MODEL ?? import.meta.env.VITE_OPENROUTER_MODEL)?.trim() || DEFAULT_OPENROUTER_MODEL;
}

function resolveFallbackModels(): string[] {
  const raw = (process.env.VITE_OPENROUTER_MODEL_FALLBACK ?? import.meta.env.VITE_OPENROUTER_MODEL_FALLBACK)?.trim();
  if (!raw) return [...DEFAULT_OPENROUTER_FALLBACK_MODELS];
  return raw.split(",").map((part) => part.trim()).filter(Boolean);
}

export function resolveOpenRouterModelChain(): string[] {
  const primary = resolvePrimaryModel();
  const fallbacks = resolveFallbackModels();
  return [...new Set([primary, ...fallbacks])];
}

export function isRetryableOpenRouterStatus(status: number, detail = ""): boolean {
  if (status === 429 || status === 502 || status === 503 || status === 529) return true;
  return /rate limit|too many requests|temporarily unavailable|overloaded/i.test(detail);
}

export function retryDelayMs(attemptIndex: number): number {
  return 700 * 2 ** attemptIndex;
}

export function formatOpenRouterUserMessage(status: number, detail: string, retried: boolean): string {
  const normalized = detail.trim();
  if (status === 429 || /rate limit|too many requests/i.test(normalized)) {
    return retried
      ? "OpenRouter 而家請求太密（429），系統已自動重試同換備用模型都未接通。請等 1–2 分鐘再發訊息。"
      : "OpenRouter 請求太密（429），請稍等幾秒再試。";
  }
  if (status === 403 && /region/i.test(normalized)) {
    return "OpenRouter 話呢個模型喺你所在地區暫時用唔到。可試 VPN，或喺 .env.local 改 VITE_OPENROUTER_MODEL。";
  }
  if (retried && isRetryableOpenRouterStatus(status, normalized)) {
    return `AI 通道暫時繁忙（${status}），已重試仍失敗。請等一陣再試。`;
  }
  return normalized ? `OpenRouter 回應失敗（${status}）：${normalized}` : `OpenRouter 回應失敗（${status}）。`;
}

export function isOpenRouterRateLimitMessage(message: string): boolean {
  return /429|rate limit|too many requests|請求太密/i.test(message);
}

export class OpenRouterChatError extends Error {
  readonly status?: number;
  readonly retried: boolean;

  constructor(message: string, options?: { status?: number; retried?: boolean }) {
    super(message);
    this.name = "OpenRouterChatError";
    this.status = options?.status;
    this.retried = options?.retried ?? false;
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

type CompletionPayload = {
  error?: { message?: string };
  choices?: Array<{ message?: { content?: string } }>;
};

function openRouterHeaders(apiKey: string, referer: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": referer,
    "X-Title": "Mood Weather Bestie",
  };
}

function completionBody(model: string, data: OpenRouterChatRequest, stream: boolean) {
  return {
    model,
    stream,
    temperature: OPENROUTER_CHAT_TEMPERATURE,
    top_p: OPENROUTER_TOP_P,
    frequency_penalty: OPENROUTER_FREQUENCY_PENALTY,
    max_tokens: OPENROUTER_CHAT_MAX_TOKENS,
    messages: buildOpenRouterChatMessages(data),
  };
}

async function requestCompletion(model: string, apiKey: string, referer: string, data: OpenRouterChatRequest) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: openRouterHeaders(apiKey, referer),
    body: JSON.stringify(completionBody(model, data, false)),
  });

  const payload = (await response.json()) as CompletionPayload;
  return { response, payload };
}

async function requestCompletionStream(
  model: string,
  apiKey: string,
  referer: string,
  data: OpenRouterChatRequest,
  onDelta: (chunk: string) => void,
) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: openRouterHeaders(apiKey, referer),
    body: JSON.stringify(completionBody(model, data, true)),
  });
  if (!response.ok || !response.body) {
    let detail = response.statusText;
    try {
      const err = (await response.json()) as CompletionPayload;
      detail = err.error?.message ?? detail;
    } catch {
      /* ignore */
    }
    return { response, text: "", detail };
  }
  const text = await consumeOpenRouterSseStream(response.body, onDelta);
  return { response, text, detail: "" };
}

export async function streamOpenRouterReplyWithResilience(
  data: OpenRouterChatRequest,
  onDelta: (chunk: string) => void,
): Promise<{ text: string; model: string }> {
  const messages = sanitizeOpenRouterChatTurns(data.messages);
  const lastUser = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  if (detectUserCrisis(lastUser)) {
    const text = getCrisisSafeReply();
    onDelta(text);
    return { text, model: "crisis-safe-override" };
  }

  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new OpenRouterChatError("未設定 VITE_OPENROUTER_API_KEY，請檢查 .env.local。");
  }

  const referer =
    (process.env.VITE_OPENROUTER_HTTP_REFERER ?? import.meta.env.VITE_OPENROUTER_HTTP_REFERER)?.trim()
    || "http://localhost:8080";
  const models = resolveOpenRouterModelChain();
  let lastStatus = 0;
  let lastDetail = "";
  let anyRetry = false;

  for (const model of models) {
    for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
      if (attempt > 0) {
        anyRetry = true;
        await sleep(retryDelayMs(attempt - 1));
      }

      const { response, text, detail } = await requestCompletionStream(model, apiKey, referer, { ...data, messages }, onDelta);
      if (response.ok && text.trim()) {
        return { text: normalizeToHongKongTraditional(text.trim()), model };
      }

      lastStatus = response.status;
      lastDetail = detail || "empty stream";

      if (response.status === 403 && /region/i.test(lastDetail)) {
        throw new OpenRouterChatError(formatOpenRouterUserMessage(response.status, lastDetail, anyRetry), {
          status: response.status,
          retried: anyRetry,
        });
      }

      if (!isRetryableOpenRouterStatus(response.status, lastDetail)) {
        break;
      }
      anyRetry = true;
    }
  }

  throw new OpenRouterChatError(formatOpenRouterUserMessage(lastStatus, lastDetail, anyRetry), {
    status: lastStatus,
    retried: anyRetry,
  });
}

export async function fetchOpenRouterReplyWithResilience(data: OpenRouterChatRequest) {
  const messages = sanitizeOpenRouterChatTurns(data.messages);
  const lastUser = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  if (detectUserCrisis(lastUser)) {
    return { text: getCrisisSafeReply(), model: "crisis-safe-override" };
  }

  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new OpenRouterChatError("未設定 VITE_OPENROUTER_API_KEY，請檢查 .env.local。");
  }

  const referer = (process.env.VITE_OPENROUTER_HTTP_REFERER ?? import.meta.env.VITE_OPENROUTER_HTTP_REFERER)?.trim() || "http://localhost:8080";
  const models = resolveOpenRouterModelChain();
  let lastStatus = 0;
  let lastDetail = "";
  let anyRetry = false;

  for (const model of models) {
    for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
      if (attempt > 0) {
        anyRetry = true;
        await sleep(retryDelayMs(attempt - 1));
      }

      const { response, payload } = await requestCompletion(model, apiKey, referer, { persona: data.persona, messages });
      if (response.ok) {
        const text = payload.choices?.[0]?.message?.content?.trim();
        if (!text) {
          lastStatus = response.status;
          lastDetail = "empty completion";
          continue;
        }
        return { text: normalizeToHongKongTraditional(text), model };
      }

      lastStatus = response.status;
      lastDetail = payload.error?.message ?? response.statusText;

      if (response.status === 403 && /region/i.test(lastDetail)) {
        throw new OpenRouterChatError(formatOpenRouterUserMessage(response.status, lastDetail, anyRetry), {
          status: response.status,
          retried: anyRetry,
        });
      }

      if (!isRetryableOpenRouterStatus(response.status, lastDetail)) {
        break;
      }
      anyRetry = true;
    }
  }

  throw new OpenRouterChatError(formatOpenRouterUserMessage(lastStatus, lastDetail, anyRetry), {
    status: lastStatus,
    retried: anyRetry,
  });
}

export const fetchOpenRouterReply = createServerFn({ method: "POST" })
  .validator((data: { persona: PersonaId; messages: OpenRouterChatTurn[]; userName?: string | null }) => data)
  .handler(async ({ data }) => {
    const { text } = await fetchOpenRouterReplyWithResilience(data);
    return { text };
  });
