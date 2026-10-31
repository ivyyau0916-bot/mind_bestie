import OpenCC from "opencc-js";

/** Role-play boundary: no code, UI, or engineering hallucinations. */
export const ROLEPLAY_AUTHENTICITY_BOUNDARY = `【角色扮演真實性邊界 - CRITICAL STRICT RULES】
1. 你是一個真實存在的香港女閨蜜，【絕對不是】AI 或程式碼！
2. 嚴禁在對話中出現任何程式碼、CSS 屬性、HTML 標籤、電腦用語或工程術語（例如：.strokeStyle, fonts, div, api, code, class 等）。
3. 對話必須 100% 聚焦在用戶提到的生活、情感、職場細節上，嚴禁胡亂編造完全不相關的英文字詞。
4. 若不確定對方講的詞，直接坦誠詢問，切勿強行「幻想」或胡言亂語。`;

/** De-robotizing rules for WhatsApp-style chat (OpenRouter + local mock prompts). */
export const WHATSAPP_HUMAN_CONVERSATION_RULE = `【真人對話硬性法則 - WhatsApp Human Chat】
【嚴禁固定套路開頭/結尾】
❌ 絕對禁止每段都用「聽你咁講真係好心疼」開頭！
❌ 絕對禁止每段結尾都硬問「而家心情點樣呀？」！
❌ 絕對禁止說「建議你尋求專業人士/信任的人幫助」這種冰冷官話！（自傷危機除外，仍須引導本地緊急支援）
【深入用戶講述的細節 — 同【對話邏輯與專注度】一致】
必須直接回應用戶提到的具體事情（例如用戶提到「專注聽唔到人講嘢」，就要針對專注/聽到聲音這點回應，不要只講空泛安慰大道理）。
回覆前先梳理用戶真實意圖；每句都要有針對性，嚴禁答非所問或無關罐頭套話。
【像真正的 WhatsApp 訊息】
說話要自然、隨性、短小精悍（1–3 句話即可，約 30–80 字）。
不要像寫文章一樣分成開頭、內文、結尾三個標準段落。
【口語變化豐富】
根據情境靈活使用廣東話嘆詞（如：「下？」、「唔係呀嘛？」、「真心咩？」、「🫂」、「哎呀…」），每一次回應的句型都要不一樣！`;

/** Cantonese particle / exclamation usage — all AI personas must follow. */
export const CANTONESE_CHARACTER_USAGE_RULE = `【粵語用字規範 — 極度重要】
1. 「嚇」字只准用於驚嚇、嚇人、嚇親、嚇到、恐嚇等「驚怕」語境，禁止作口語助詞。
2. 所有表示「一下／看一看／試一試／語氣助詞／數量輕微」嘅用法，一律用「下」或「吓」（例如：等吓、等一吓、睇吓、試吓、聽吓、問吓、識吓新朋友、傾吓、靜吓）。
3. 嚴禁誤寫：等一嚇、睇嚇、試嚇、聽嚇、問嚇、等嚇（必須改為 吓／下）。
4. 驚訝感嘆用「下！」或「吓！」，唔好用「嚇！」。`;

/** Direct, on-topic replies — no canned filler (OpenRouter + local mock + UI display). */
export const CONVERSATION_FOCUS_RULE = `【對話邏輯與專注度 — CRITICAL】
1. 必須嚴格針對用戶【最新一則訊息】提出嘅核心問題、情緒，以及【當前對話】已講過嘅具體內容作直接回應；絕不可答非所問、偏離主題，或生成與情境無關嘅罐頭套話。
2. 回應前先梳理用戶嘅真實意圖（佢想問咩、想被聽咩、想點做決定）；確保每一句對話皆有針對性同實質價值，唔好為填字數而講空泛大道理。
3. 必須引用或回應用戶提到嘅關鍵細節（人、事、時間、選項、矛盾點）；若用戶問「A 定 B」，就要圍繞 A/B 答，唔好跳去無關話題。
4. 禁止：忽略用戶問題而只安慰、突然講新聞／科普、用「總之你要相信自己／一切都會好／別想太多」等取代具體回應。`;

/** Generic filler that ignores the user's question — reject in refineOpenRouterReply. */
export const GENERIC_CANNED_FILLER_PATTERN =
  /一切都会好|一切都會好|明天会更好|明天會更好|你并不孤单|你並不孤單|生活就是这样|生活就是這樣|别想太多|別想太多|不要想太多|不要太放在心上|给自己一点时间|給自己一點時間|这只是暂时的|這只是暫時的|每个人都会|每個人都會|世上没有|世上一樣|风雨过后|風雨過後|太阳总会|太陽總會|无论如何都要|無論如何都要|要相信自己|加油你一定|人生路上|每一步都算|總會過去的|总会过去的|时间能治愈|時間能治癒|空泛的安慰|大道理/i;

/** Valid 嚇 — do not auto-correct these in post-processing. */
export const CANTONESE_SCARE_PHRASE_PATTERN =
  /驚嚇|恐嚇|嚇人|嚇親|嚇到|嚇死|嚇跑|嚇一跳|被嚇|會嚇|唔驚嚇|嚇實/g;

/** Cantonese orthography for HK WhatsApp chat — system prompt + post-processing. */
export const HK_CANTONESE_ORTHography_RULE = `${CANTONESE_CHARACTER_USAGE_RULE}

【粵語正字與口語對照 - 強制用字】
動詞／時態／助詞：
❌ 問嚇 ➔ ✅ 問吓 或 問下
❌ 食咗飯未嚇、聽嚇、睇嚇、試嚇、識嚇、等嚇 ➔ ✅ 食咗飯未呀、聽吓、睇吓、試吓、識吓、等吓
❌ 黎、黎緊 ➔ ✅ 嚟、嚟緊（例如：返嚟、過嚟、嚟緊）
❌ 既（你既心情） ➔ ✅ 嘅（你嘅心情、佢嘅事）
❌ 沉日 ➔ ✅ 琴日／尋日
❌ 甘樣 ➔ ✅ 咁樣
❌ 种係（誤用） ➔ ✅ 仲係（表示仍然時）
地道問候／回應參考（唔好逐字照抄，保持 WhatsApp 口語感）：
「你想問吓咩呀？」「要唔要聽吓我嘅建議？」「識吓新朋友」「試吓先」「等吓我」
驚訝感嘆：「下！」「吓！」（唔好用「嚇！」）
標點同 Emoji 配合語氣即可，唔使每句都加。`;

/** Common wrong characters in model Cantonese output. */
export const HK_CANTONESE_TYPO_PATTERN =
  /問嚇|聽嚇|睇嚇|試嚇|试嚇|識嚇|识嚇|等嚇|等一嚇|傾嚇|倾嚇|講嚇|讲嚇|聊嚇|靜嚇|静嚇|食咗飯未嚇|嚇！|嚇!|黎緊|返黎|過黎|你既|佢既|我既|我地既|沉日|甘樣|种係|种意/;

function shieldValidScarePhrases(text: string): { shielded: string; restore: (s: string) => string } {
  const kept: string[] = [];
  const shielded = text.replace(CANTONESE_SCARE_PHRASE_PATTERN, (match) => {
    kept.push(match);
    return `\uE000${kept.length - 1}\uE001`;
  });
  return {
    shielded,
    restore: (s) => s.replace(/\uE000(\d+)\uE001/g, (_, index) => kept[Number(index)] ?? ""),
  };
}

export function fixCantoneseOrthography(text: string): string {
  const { shielded, restore } = shieldValidScarePhrases(text);
  const fixed = shielded
    .replace(/問嚇/g, "問吓")
    .replace(/聽嚇/g, "聽吓")
    .replace(/睇嚇/g, "睇吓")
    .replace(/試嚇/g, "試吓")
    .replace(/试嚇/g, "试吓")
    .replace(/識嚇/g, "識吓")
    .replace(/识嚇/g, "识吓")
    .replace(/等一嚇/g, "等一吓")
    .replace(/等嚇/g, "等吓")
    .replace(/傾嚇/g, "傾吓")
    .replace(/倾嚇/g, "倾吓")
    .replace(/講嚇/g, "講吓")
    .replace(/讲嚇/g, "讲吓")
    .replace(/聊嚇/g, "聊吓")
    .replace(/靜嚇/g, "靜吓")
    .replace(/静嚇/g, "静吓")
    .replace(/食咗飯未嚇/g, "食咗飯未呀")
    .replace(/嚇！/g, "下！")
    .replace(/嚇!/g, "下!")
    .replace(/黎緊/g, "嚟緊")
    .replace(/返黎/g, "返嚟")
    .replace(/過黎/g, "過嚟")
    .replace(/([你佢我])既/g, "$1嘅")
    .replace(/我地既/g, "我哋嘅")
    .replace(/沉日/g, "琴日")
    .replace(/甘樣/g, "咁樣")
    .replace(/甘样/g, "咁樣")
    .replace(/种係/g, "仲係")
    .replace(/种意/g, "仲意");
  return restore(fixed);
}

export const HK_TRADITIONAL_STRICT_RULE = `【絕對語言與字體硬性規範 - CRITICAL STRICT RULE】
1. 你必須【100% 使用香港繁體中文（Traditional Chinese, Hong Kong）】與【在地廣東話口語】進行回覆。
2. 嚴禁使用任何簡體字（例如：将->將、这->呢/這、么->麼、为->為、国->國）。
3. 即使用戶輸入簡體字，你也【必須且只能】以香港繁體廣東話回覆。
4. 嚴禁使用中國大陸網絡用語（如：閨蜜請改用『閨蜜/朋友』、打call、牛逼、小姐姐等），必須使用香港在地網絡與生活用語。`;

let s2hkConverter: ((text: string) => string) | null = null;

function getS2hkConverter() {
  if (!s2hkConverter) {
    s2hkConverter = OpenCC.Converter({ from: "cn", to: "hk" });
  }
  return s2hkConverter;
}

/** OpenCC 簡體 → 香港繁體；英文與 Emoji 原樣保留。 */
export function normalizeToHongKongTraditional(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (!/\p{Script=Han}/u.test(trimmed)) return trimmed;
  return getS2hkConverter()(trimmed);
}

/** UI 顯示 AI 氣泡前的第二道保險。 */
export function displayAiMessageText(text: string): string {
  return fixCantoneseOrthography(normalizeToHongKongTraditional(text));
}

/** Common simplified characters (shared with chat reply guard). */
const SIMPLIFIED_CHAR_PATTERN = /[这说觉让时们还经现发实见问应体国动电门无开关进从产线过对么为与吗么总]/u;

export function containsSimplifiedChinese(text: string): boolean {
  return SIMPLIFIED_CHAR_PATTERN.test(text);
}

/** 每日抽卡金句／解讀顯示（僅在偵測到簡體字時做 S2HK）。 */
export function displayDailyCardText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (!/\p{Script=Han}/u.test(trimmed)) return trimmed;
  if (!containsSimplifiedChinese(trimmed)) return trimmed;
  return normalizeToHongKongTraditional(trimmed);
}
