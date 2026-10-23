/** Crisis keywords and safe override for Hong Kong users. */

export const CRISIS_KEYWORDS = [
  "自殺",
  "尋死",
  "想死",
  "跳樓",
  "割脈",
  "結束生命",
  "唔想做人",
  "活著好累",
  "想消失",
  "離世",
  "厭世",
  "死咗去",
  "一走了之",
] as const;

const CRISIS_SEMANTIC_PATTERN =
  /自殺|寻死|尋死|想死|跳樓|割脈|結束生命|结束生命|唔想做人|唔想活|不想活|活著好累|活着好累|想消失|離世|离世|厭世|厌世|死咗去|一走了之|自残|自殘|傷害自己|伤害自己|想傷害自己|唔想再活|不想活|了結生命|了结生命|\b(?:suicid\w*|kill myself|hurt myself|end my life|jump off|don't want to live|do not want to live)\b/i;

export const CRISIS_SAFETY_SYSTEM_RULE =
  "若用戶表達出自殺、自殘或放棄生命的意圖，你絕對不可以給予任何輔助自殘/自殺的建議，必須立即表達關心並引導對方尋求專業熱線幫助。";

export const CRISIS_SAFE_REPLY_HK = `🫂 我聽到你依家好痛苦、好攰，但請你相信，你並不孤單，你的生命非常寶貴。我係一個 AI，可能無法給予你足夠的專業支持，但我好希望你可以給自己一個機會，尋求專業人士的幫助。

如果你需要有人傾訴，請即刻聯絡以下香港 24 小時免費求助熱線：
📞 撒瑪利亞防止自殺會：2389 2222
📞 生命熱線：2382 0000
📞 明愛向晴軒：18288
📞 醫管局 24小時精神健康專線：2466 7350
🚨 若情況緊急，請即時撥打 999 報警或前往附近醫院求助。

我會一直喺度陪住你，請答應我，先打個電話同佢哋聊聊天好嗎？❤️`;

export function detectUserCrisis(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (CRISIS_SEMANTIC_PATTERN.test(trimmed)) return true;
  return CRISIS_KEYWORDS.some((keyword) => trimmed.includes(keyword));
}

export function getCrisisSafeReply(): string {
  return CRISIS_SAFE_REPLY_HK;
}
