import { createServerFn } from "@tanstack/react-start";
import { getPersona, type PersonaId } from "@/lib/chat-personas";
import { normalizeToHongKongTraditional } from "@/lib/hk-traditional";
import type { DailySoulCard } from "@/lib/daily-card-types";
import {
  fetchOpenRouterReplyWithResilience,
  type OpenRouterChatTurn,
} from "@/lib/openrouter-chat";

const SOUL_CARD_PERSONA_STYLE: Record<PersonaId, string> = {
  gentle:
    "語氣：溫柔暖心、治癒包容、像抱住用戶咁；多用「慢慢嚟」「辛苦晒」「值得被愛」；禁止毒舌羞辱。",
  fierce:
    "語氣：戰友毒舌、犀利一針見血、企硬用戶嗰邊；可以寸但唔好人身攻擊；多用「收皮啦」「唔好再」式直接提醒。",
  wise:
    "語氣：理性智慧、條理分析、冷靜清晰；多用「先分清楚」「列出」「下一步」；禁止空泛心靈雞湯。",
};

function buildSoulCardSystem(persona: PersonaId): string {
  const who = getPersona(persona);
  return `你係「心事 Bestie」靈魂金句設計師，而家扮演「${who.name}」。只輸出一段 JSON，唔好 markdown，唔好解釋。
格式：
{"quote":"一句香港廣東話口語靈魂金句（30-60字，含1個Emoji）","icon":"單一Emoji","vipReading":"🔮 今日靈魂關心解讀：2-3句香港廣東話關心解讀"}
規則：100%繁體廣東話；禁止簡體；禁止程式碼用語；金句同解讀必須完全符合下面人設語氣。
${SOUL_CARD_PERSONA_STYLE[persona]}`;
}

function parseSoulCardJson(raw: string, persona: PersonaId): DailySoulCard {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const payload = jsonMatch ? jsonMatch[0] : trimmed;
  const parsed = JSON.parse(payload) as { quote?: string; icon?: string; vipReading?: string };
  const quote = normalizeToHongKongTraditional(String(parsed.quote ?? "").trim());
  if (!quote) throw new Error("empty soul quote");
  const icon = String(parsed.icon ?? "✨").trim() || "✨";
  let vipReading = normalizeToHongKongTraditional(String(parsed.vipReading ?? "").trim());
  if (!vipReading.startsWith("🔮")) {
    vipReading = `🔮 今日靈魂關心解讀：${vipReading || "Bestie 喺度陪住你，慢慢嚟。"}`;
  }
  const who = getPersona(persona);
  return {
    id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    persona,
    quote: quote.includes("Bestie") ? quote : `${who.emoji} Bestie：${quote}`,
    icon,
    vipReading,
  };
}

export async function generateSoulCardViaOpenRouter(persona: PersonaId, recentQuotes: string[]): Promise<DailySoulCard> {
  const avoid = recentQuotes.length
    ? `唔好重複以下金句（意思都要唔同）：\n${recentQuotes.slice(-8).join("\n")}`
    : "生成全新、未聽過嘅金句。";
  const messages: OpenRouterChatTurn[] = [
    {
      role: "user",
      content: `${buildSoulCardSystem(persona)}\n\n${avoid}\n生成一張符合當前人設嘅廣東話靈魂金句 + Emoji + Bestie 今日關心解讀 JSON 卡片。`,
    },
  ];
  const { text } = await fetchOpenRouterReplyWithResilience({ persona, messages });
  return parseSoulCardJson(text, persona);
}

export const fetchGeneratedSoulCard = createServerFn({ method: "POST" })
  .validator((data: { persona: PersonaId; recentQuotes?: string[] }) => data)
  .handler(async ({ data }) => {
    return generateSoulCardViaOpenRouter(data.persona, data.recentQuotes ?? []);
  });
