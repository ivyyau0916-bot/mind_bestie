import { getClaimedMilestoneDays, markMilestoneClaimed } from "@/lib/bestie-account";

export type SelfCareMilestone = {
  days: number;
  emoji: string;
  title: string;
};

export const SELF_CARE_MILESTONES: SelfCareMilestone[] = [
  { days: 3, emoji: "🌸", title: "微光初綻" },
  { days: 7, emoji: "🌱", title: "微光守護者" },
  { days: 21, emoji: "🌙", title: "微光同行者" },
  { days: 30, emoji: "✨", title: "微光收藏家" },
];

export function getMilestoneForTotalDays(totalDays: number): SelfCareMilestone | null {
  return SELF_CARE_MILESTONES.find((m) => m.days === totalDays) ?? null;
}

export function detectUnclaimedMilestone(previousTotal: number, nextTotal: number): SelfCareMilestone | null {
  if (nextTotal <= previousTotal) return null;
  const milestone = getMilestoneForTotalDays(nextTotal);
  if (!milestone) return null;
  const claimed = getClaimedMilestoneDays();
  if (claimed.includes(milestone.days)) return null;
  return milestone;
}

export function claimMilestone(milestone: SelfCareMilestone): void {
  markMilestoneClaimed(milestone.days);
}

export function milestoneThankYouMessage(userName: string | null, milestone: SelfCareMilestone): string {
  const who = userName ? userName : "你";
  if (milestone.days === 3) {
    return `${who}，三日微光已經亮咗 🌸 Bestie 好開心見到你開始用小事照顧自己。`;
  }
  if (milestone.days === 7) {
    return `${who}，一週嘅溫柔守護好靚 🌱 你正在慢慢養成屬於自己嘅節奏。`;
  }
  if (milestone.days === 21) {
    return `${who}，21 日嘅堅持好難得 🌙 呢份微光會繼續陪你行落去。`;
  }
  return `${who}，30 日微光里程碑 ✨ 你值得被好好記住同慶祝。`;
}

export function buildMilestoneShareText(userName: string | null, milestone: SelfCareMilestone): string {
  const who = userName ?? "我";
  return `${milestone.emoji} ${who} 喺「心事 Bestie」解鎖咗【${milestone.title}】— 累積 ${milestone.days} 日微光打卡！\n\n${milestoneThankYouMessage(userName, milestone)}`;
}
