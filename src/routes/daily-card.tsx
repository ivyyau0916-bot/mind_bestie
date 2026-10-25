import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useBestieAuth } from "@/lib/bestie-auth-context";
import { canAccessCharacter, CharacterId } from "@/lib/trial-limits";
import { drawNextSoulCard, resolveSavedDailyCard } from "@/lib/daily-card-draw";
import { PersonaTrialExhaustedDialog } from "@/components/PersonaTrialExhaustedDialog";
import { VipUnlockDialog } from "@/components/VipUnlockDialog";

export const Route = createFileRoute("/daily-card")({
  component: DailyCardRoute,
});

function DailyCardRoute() {
  const { isVip, user } = useBestieAuth();
  const [drawing, setDrawing] = useState(false);
  const [trialExhaustedOpen, setTrialExhaustedOpen] = useState(false);
  const [vipOpen, setVipOpen] = useState(false);
  
  // 假設目前選擇的角色狀態（若專案中有對應的 state 也可以替換）
  const [persona, setPersona] = useState<"gentle" | "fierce" | "wise">("gentle");

  // 轉換成 CharacterId 型別以便檢查試用期
  const characterId: CharacterId = 
    persona === "fierce" ? "sarcastic" : 
    persona === "wise" ? "rational" : "gentle";

  const handleDraw = async () => {
    // 1. 檢查 3 天試用期與 VIP 權限
    const access = canAccessCharacter(characterId, isVip, user?.created_at);
    if (!access.allowed) {
      setTrialExhaustedOpen(true);
      return;
    }

    setDrawing(true);
    try {
      await drawNextSoulCard({ isVip, persona });
    } finally {
      setDrawing(false);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      <h1 className="text-xl font-bold mb-4">每日靈魂卡片抽取</h1>
      
      {/* 角色選擇按鈕範例 */}
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setPersona("gentle")} 
          className={`px-4 py-2 rounded-full text-sm ${persona === "gentle" ? "bg-indigo-600 text-white" : "bg-slate-200"}`}
        >
          溫柔 Bestie
        </button>
        <button 
          onClick={() => setPersona("fierce")} 
          className={`px-4 py-2 rounded-full text-sm ${persona === "fierce" ? "bg-indigo-600 text-white" : "bg-slate-200"}`}
        >
          毒舌 Bestie 🔒
        </button>
        <button 
          onClick={() => setPersona("wise")} 
          className={`px-4 py-2 rounded-full text-sm ${persona === "wise" ? "bg-indigo-600 text-white" : "bg-slate-200"}`}
        >
          理智 Bestie 🔒
        </button>
      </div>

      {/* 抽卡按鈕 */}
      <button
        onClick={handleDraw}
        disabled={drawing}
        className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-2xl shadow-md hover:bg-indigo-500 disabled:opacity-50"
      >
        {drawing ? "Bestie 準備緊..." : "輕觸卡片 · 抽取今日的靈魂語錄"}
      </button>

      {/* 試用期結束或權限不足時彈出的引導對話框 */}
      <PersonaTrialExhaustedDialog
        open={trialExhaustedOpen}
        persona={persona === "wise" ? "wise" : "fierce"}
        onOpenChange={setTrialExhaustedOpen}
      />
      <VipUnlockDialog open={vipOpen} onOpenChange={setVipOpen} />
    </div>
  );
}
