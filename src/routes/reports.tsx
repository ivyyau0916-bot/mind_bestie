import { createFileRoute } from "@tanstack/react-router";
import { Lock, Sparkles, Lightbulb } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/BottomNav";
import { useMood } from "@/lib/mood-store";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "心情報告 · 心事 Bestie" },
      { name: "description", content: "心情分數走勢、壓力來源與 AI 建議。" },
      { property: "og:title", content: "心情報告 · 心事 Bestie" },
      { property: "og:description", content: "心情分數走勢、壓力來源與 AI 建議。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { entries } = useMood();
  const last = entries.slice(-7);
  const data = last.map((e) => ({ day: e.date.slice(5).replace("-", "/"), score: e.score }));
  const avg = last.length ? (last.reduce((s, e) => s + e.score, 0) / last.length).toFixed(1) : "–";
  const counts: Record<string, number> = {};
  entries.slice(-14).forEach((e) => e.tags.forEach((t) => (counts[t] = (counts[t] ?? 0) + 1)));
  const tags = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const top = tags[0]?.[0];

  const recs = [
    top === "工作" ? "工作是你最近最大的壓力來源，試試為自己訂一個「下班儀式」，例如散步十分鐘。" : "每天花五分鐘寫下三件感恩的小事，有助穩定情緒。",
    "睡前一小時減少使用電子產品，讓大腦慢慢降溫。",
    Number(avg) < 5 ? "最近天氣偏陰，記得主動聯絡一位信任的朋友聊聊天。" : "你最近的心情相當穩定，繼續保持喜歡的小習慣！",
  ];

  return (
    <div className="space-y-4 px-4 pb-32">
      <PageHeader title="心情報告" subtitle="過去 7 天的心情天氣概覽" />

      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-3xl p-4">
          <div className="text-xs text-muted-foreground">平均分數</div>
          <div className="text-3xl font-bold text-primary">{avg}</div>
        </div>
        <div className="glass rounded-3xl p-4">
          <div className="text-xs text-muted-foreground">已紀錄日數</div>
          <div className="text-3xl font-bold text-sky">{entries.length}</div>
        </div>
      </div>

      <section className="glass rounded-3xl p-4">
        <h2 className="mb-3 font-semibold">分數走勢</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: -24, right: 8, top: 8 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" }} />
              <Line type="monotone" dataKey="score" name="分數" stroke="var(--amber)" strokeWidth={3} dot={{ fill: "var(--sky)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="glass rounded-3xl p-4">
        <h2 className="mb-3 font-semibold">情緒壓力來源</h2>
        <div className="flex flex-wrap gap-2">
          {tags.length ? tags.map(([t, c]) => (
            <span key={t} className="rounded-full bg-secondary px-3 py-1 text-sm">
              #{t} <span className="text-muted-foreground">×{c}</span>
            </span>
          )) : <span className="text-sm text-muted-foreground">暫時未有足夠資料</span>}
        </div>
      </section>

      <section className="glass rounded-3xl p-4">
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-amber" />AI 建議</h2>
        <ul className="space-y-3">
          {recs.map((r) => (
            <li key={r} className="flex gap-2 text-sm leading-relaxed"><Lightbulb className="mt-0.5 size-4 shrink-0 text-sky" />{r}</li>
          ))}
        </ul>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-amber/40 bg-amber/10 p-5">
        <Lock className="absolute right-4 top-4 size-5 text-amber" />
        <h2 className="font-display text-lg font-bold">解鎖 30 日深度報告</h2>
        <p className="mt-1 text-sm text-muted-foreground">情緒週期分析、觸發點預測、個人化療癒計劃。</p>
        <Button className="mt-4 rounded-2xl bg-amber text-background hover:bg-amber/90" onClick={() => toast("付費功能即將推出，敬請期待 ✨")}>
          升級 Premium · HK$38/月
        </Button>
      </section>
    </div>
  );
}
