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
【深入用戶講述的細節】
必須直接回應用戶提到的具體事情（例如用戶提到「專注聽唔到人講嘢」，就要針對專注/聽到聲音這點回應，不要只講空泛安慰大道理）。
【像真正的 WhatsApp 訊息】
說話要自然、隨性、短小精悍（1–3 句話即可，約 30–80 字）。
不要像寫文章一樣分成開頭、內文、結尾三個標準段落。
【口語變化豐富】
根據情境靈活使用廣東話嘆詞（如：「下？」、「唔係呀嘛？」、「真心咩？」、「🫂」、「哎呀…」），每一次回應的句型都要不一樣！`;

/** Cantonese particle / exclamation usage — all AI personas must follow. */
export const CANTONESE_CHARACTER_USAGE_RULE = `【粵語用字規範】：
- 表示「一下子／一下子做某事」嘅口語助詞（例如：睇下、試下、識下），請統一使用「吓」或「下」，絕對禁止使用「嚇」（例如：「識吓新朋友」、「試吓」、「等吓」）。
- 表示驚訝嘅感嘆詞，請使用「下！」或「吓！」，請勿誤用「嚇」。`;

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
  /問嚇|聽嚇|睇嚇|試嚇|试嚇|識嚇|识嚇|等嚇|食咗飯未嚇|嚇！|嚇!|黎緊|返黎|過黎|你既|佢既|我既|我地既|沉日|甘樣|种係|种意/;

export function fixCantoneseOrthography(text: string): string {
  return text
    .replace(/問嚇/g, "問吓")
    .replace(/聽嚇/g, "聽吓")
    .replace(/睇嚇/g, "睇吓")
    .replace(/試嚇/g, "試吓")
    .replace(/试嚇/g, "试吓")
    .replace(/識嚇/g, "識吓")
    .replace(/识嚇/g, "识吓")
    .replace(/等嚇/g, "等吓")
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
