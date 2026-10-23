import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/BottomNav";
import { WeatherIcon } from "@/components/WeatherIcon";
import { WEATHER_LABEL, scoreToWeather, toKey, useMood } from "@/lib/mood-store";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "心情日曆 · 心事 Bestie" },
      { name: "description", content: "用天氣圖示回顧每一天的心情。" },
      { property: "og:title", content: "心情日曆 · 心事 Bestie" },
      { property: "og:description", content: "用天氣圖示回顧每一天的心情。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

function CalendarPage() {
  const { entries } = useMood();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selected, setSelected] = useState<string | null>(null);
  const map = new Map(entries.map((e) => [e.date, e]));
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  const offset = new Date(y, m, 1).getDay();
  const todayKey = toKey(new Date());
  const sel = selected ? map.get(selected) : undefined;

  return (
    <div className="pb-32">
      <PageHeader title="心情日曆" subtitle="每一天，都是一片獨特的天空。" />
      <div className="glass mx-4 rounded-3xl p-4">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(y, m - 1, 1))} aria-label="上個月"><ChevronLeft /></Button>
          <div className="font-display text-lg font-semibold">{y}年 {m + 1}月</div>
          <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(y, m + 1, 1))} aria-label="下個月"><ChevronRight /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {WEEK.map((w) => <div key={w} className="py-1">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const key = toKey(new Date(y, m, i + 1));
            const e = map.get(key);
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl text-xs transition-colors ${
                  selected === key ? "bg-primary/20 ring-1 ring-primary" : e ? "bg-secondary" : "hover:bg-muted"
                } ${key === todayKey ? "font-bold text-primary" : ""}`}
              >
                <span>{i + 1}</span>
                {e && <WeatherIcon weather={scoreToWeather(e.score)} className="size-6" />}
              </button>
            );
          })}
        </div>
      </div>
      {selected && (
        <div className="glass mx-4 mt-4 flex items-center gap-4 rounded-3xl p-4">
          {sel ? (
            <>
              <WeatherIcon weather={scoreToWeather(sel.score)} className="size-14" />
              <div>
                <div className="text-sm text-muted-foreground">{selected}</div>
                <div className="font-semibold">{WEATHER_LABEL[scoreToWeather(sel.score)]} · {sel.score} 分</div>
                {sel.tags.length > 0 && <div className="mt-1 text-xs text-muted-foreground">{sel.tags.join("、")}</div>}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">{selected} 沒有紀錄。</div>
          )}
        </div>
      )}
    </div>
  );
}
