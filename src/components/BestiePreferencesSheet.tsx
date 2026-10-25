import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Crown, MessageSquareOff, Moon, Phone, Shield, Sun, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { DailyCardPersonaPicker } from "@/components/daily-card/DailyCardPersonaPicker";
import { DailyCardPersonaLockDialog } from "@/components/DailyCardPersonaLockDialog";
import { VipUnlockDialog } from "@/components/VipUnlockDialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useAppSettings } from "@/lib/app-settings-context";
import { clearBestieAccountData, normalizeUserName } from "@/lib/bestie-account";
import { clearDailyCardDrawHistory, clearTrialChatCounts } from "@/lib/freemium";
import { useBestieAccount } from "@/lib/bestie-account-context";
import {
  ensureNotificationPermission,
  getEveningNotifEnabled,
  formatNotifTimeValue,
  getEveningNotifTime,
  getMorningNotifEnabled,
  getMorningNotifTime,
  getNotificationPermission,
  isCareNotificationSupported,
  parseNotifTimeValue,
  setEveningNotifEnabled,
  setEveningNotifTime,
  setMorningNotifEnabled,
  setMorningNotifTime,
  syncCareNotifications,
} from "@/lib/care-notifications";
import { getFreeUserAccountStatus, VIP_PRICE_LABEL } from "@/lib/freemium";
import { VIP_ACTIVE_STATUS_LABEL } from "@/lib/vip-subscription";
import { AUTH_PRIVACY_NOTE } from "@/lib/auth-privacy";
import { useBestieAuth } from "@/lib/bestie-auth-context";
import { useMood } from "@/lib/mood-store";

const HOTLINES = [
  { name: "撒瑪利亞防止自殺會（24小時）", tel: "2389 2222" },
  { name: "生命熱線（24小時）", tel: "2382 0000" },
  { name: "情緒通 精神健康支援熱線", tel: "18111" },
  { name: "緊急求助", tel: "999" },
] as const;

export function BestiePreferencesSheet() {
  const { preferencesOpen, setPreferencesOpen } = useAppSettings();
  const {
    theme,
    setTheme,
    clearAll,
    clearChat,
    isVip,
    dailyChatCount,
    freeChatsRemaining,
    persona,
    setPersona,
    trialUsageRevision,
  } = useMood();
  const { userName, setUserName } = useBestieAccount();
  const { configured: authConfigured, user: authUser, loading: authLoading, openAuth, signOut } = useBestieAuth();
  const [nicknameDraft, setNicknameDraft] = useState(userName ?? "");
  const [vipOpen, setVipOpen] = useState(false);
  const [personaLockOpen, setPersonaLockOpen] = useState(false);
  const [clearChatConfirmOpen, setClearChatConfirmOpen] = useState(false);
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);
  const [morningNotif, setMorningNotif] = useState(true);
  const [eveningNotif, setEveningNotif] = useState(true);
  const [morningTimeValue, setMorningTimeValue] = useState("08:30");
  const [eveningTimeValue, setEveningTimeValue] = useState("22:30");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (!preferencesOpen) return;
    setMorningNotif(getMorningNotifEnabled());
    setEveningNotif(getEveningNotifEnabled());
    setMorningTimeValue(formatNotifTimeValue(getMorningNotifTime()));
    setEveningTimeValue(formatNotifTimeValue(getEveningNotifTime()));
    setNotifPermission(getNotificationPermission());
    setNicknameDraft(userName ?? "");
  }, [preferencesOpen, userName]);

  const applyCareToggle = useCallback(async (slot: "morning" | "evening", enabled: boolean) => {
    if (enabled) {
      if (!isCareNotificationSupported()) {
        toast("此裝置或瀏覽器唔支援通知提醒");
        return false;
      }
      const permission = await ensureNotificationPermission();
      setNotifPermission(permission);
      if (permission !== "granted") {
        toast("請允許通知權限，先可以收到 Bestie 嘅提醒");
        return false;
      }
    }

    if (slot === "morning") {
      setMorningNotifEnabled(enabled);
      setMorningNotif(enabled);
    } else {
      setEveningNotifEnabled(enabled);
      setEveningNotif(enabled);
    }
    await syncCareNotifications();
    return true;
  }, []);

  const applyCareTime = useCallback(async (slot: "morning" | "evening", value: string) => {
    const parsed = parseNotifTimeValue(value);
    if (!parsed) return;
    if (slot === "morning") {
      setMorningNotifTime(parsed.hour, parsed.minute);
      setMorningTimeValue(formatNotifTimeValue(parsed));
    } else {
      setEveningNotifTime(parsed.hour, parsed.minute);
      setEveningTimeValue(formatNotifTimeValue(parsed));
    }
    await syncCareNotifications();
  }, []);

  const freeAccountStatus = useMemo(
    () => (!isVip ? getFreeUserAccountStatus(persona, authUser?.created_at) : null),
    [isVip, persona, authUser?.created_at, freeChatsRemaining, dailyChatCount, trialUsageRevision],
  );
  const usedToday = isVip ? 0 : (freeAccountStatus?.usedToday ?? dailyChatCount);
  const vipBenefitCopy = "解鎖全 3 位 Bestie 專屬傾訴，每天可分別抽取 3 張靈魂金句卡片";

  return (
    <>
      <DialogPrimitive.Root open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <DialogPrimitive.Portal>
          <div className="bestie-preferences-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <DialogPrimitive.Overlay
              className={cn(
                "absolute inset-0 bg-stone-900/55 backdrop-blur-[2px] max-md:backdrop-blur-none max-md:bg-stone-900/70",
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              )}
            />
            <DialogPrimitive.Content
              className={cn(
                "bestie-preferences-sheet relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-stone-300/45 p-0",
                "max-h-[80vh] shadow-2xl shadow-stone-800/12 max-md:shadow-lg dark:border-stone-600/40 dark:shadow-black/35 max-md:dark:shadow-black/25",
                "bg-gradient-to-b from-stone-100/98 via-background to-violet-50/35 dark:from-stone-900/98 dark:to-violet-950/25",
                "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              )}
            >
              <DialogPrimitive.Close
                type="button"
                className={cn(
                  "absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full",
                  "border border-stone-300/50 bg-stone-100/80 text-stone-600 transition-colors",
                  "hover:bg-stone-200/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45",
                  "dark:border-stone-500/40 dark:bg-stone-800/80 dark:text-stone-200 dark:hover:bg-stone-700/90",
                )}
                aria-label="關閉偏好設定"
              >
                <X className="size-4" strokeWidth={1.75} />
              </DialogPrimitive.Close>

              <div
                className={cn(
                  "sticky top-0 z-10 shrink-0 space-y-1 border-b border-stone-300/35 px-5 py-4 pr-14 text-left",
                  "bg-stone-100/96 backdrop-blur-md max-md:backdrop-blur-none dark:border-stone-600/30 dark:bg-stone-900/94 max-md:dark:bg-slate-900/95",
                )}
              >
                <DialogPrimitive.Title className="font-display text-xl tracking-wide">偏好設定</DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs text-muted-foreground">
                  暱稱、Bestie 人設與 App 偏好 — 關閉後仍留喺原本頁面
                </DialogPrimitive.Description>
              </div>

              <div className="bestie-preferences-scroll px-5 pb-4 pt-3">
            <div className="space-y-4 pb-2">
              <section className="glass rounded-3xl p-4">
                <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground">暱稱</h2>
                <div className="flex gap-2">
                  <Input
                    id="bestie-nickname-sheet"
                    value={nicknameDraft}
                    onChange={(e) => setNicknameDraft(e.target.value)}
                    placeholder="點樣稱呼你？"
                    className="rounded-2xl"
                    maxLength={16}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0 rounded-2xl"
                    disabled={!normalizeUserName(nicknameDraft)}
                    onClick={() => {
                      const next = normalizeUserName(nicknameDraft);
                      if (!next) return;
                      setUserName(next);
                      toast("暱稱已更新");
                    }}
                  >
                    儲存
                  </Button>
                </div>
              </section>

              <section className="glass space-y-3 rounded-3xl p-4">
                <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">偏好 Bestie 角色</h2>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  傾訴、抽卡同微光提示會跟住呢個人設；切換後即刻生效。
                </p>
                <DailyCardPersonaPicker
                  persona={persona}
                  isVip={isVip}
                  createdAt={authUser?.created_at}
                  onSelect={(id) => setPersona(id)}
                  onLockedSelect={() => setPersonaLockOpen(true)}
                />
              </section>

              <section className="glass rounded-3xl p-4">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground">
                  <Crown className="size-4 text-amber-400" aria-hidden="true" />
                  帳號與 VIP
                </h2>
                {authConfigured && (
                  <div className="mb-3 space-y-2 rounded-2xl bg-secondary/35 px-3 py-2.5">
                    {authLoading ? (
                      <p className="text-xs text-muted-foreground">正在載入帳號…</p>
                    ) : authUser ? (
                      <>
                        <p className="truncate text-sm font-medium">
                          已登入：{authUser.email ?? authUser.id}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full px-3 text-xs"
                          onClick={() => void signOut()}
                        >
                          登出
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-9 w-full rounded-2xl text-sm"
                        onClick={openAuth}
                      >
                        登入 Bestie 帳號
                      </Button>
                    )}
                    <p className="text-[11px] leading-relaxed text-muted-foreground">{AUTH_PRIVACY_NOTE}</p>
                  </div>
                )}
                <p className="text-base font-semibold">
                  {isVip ? VIP_ACTIVE_STATUS_LABEL : freeAccountStatus?.tierTitle}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {isVip ? vipBenefitCopy : freeAccountStatus?.quotaLine}
                </p>
                {!isVip && freeAccountStatus && (
                  <>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{freeAccountStatus.footnote}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">已使用 {usedToday} 次傾訴</p>
                    <Button
                      type="button"
                      className="mt-3 w-full rounded-full bg-gradient-to-r from-amber-500/90 to-rose-500/90 font-medium shadow-md hover:opacity-95"
                      onClick={() => setVipOpen(true)}
                    >
                      升級 VIP（{VIP_PRICE_LABEL}）
                    </Button>
                  </>
                )}
              </section>

              <section className="glass flex items-center justify-between rounded-3xl p-4">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? (
                    <Moon className="text-sky" aria-hidden="true" />
                  ) : (
                    <Sun className="text-amber" aria-hidden="true" />
                  )}
                  <div>
                    <div className="font-semibold">主題模式</div>
                    <div className="text-xs text-muted-foreground">{theme === "dark" ? "靜謐夜空" : "晨曦淡藍"}</div>
                  </div>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
                  aria-label="切換夜空模式"
                />
              </section>

              <section className="glass space-y-3 rounded-3xl p-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Bell className="size-4 text-amber-400" aria-hidden="true" />
                  通知
                </h2>
                {notifPermission === "denied" && (
                  <p className="rounded-2xl bg-secondary/80 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    通知權限已被拒絕。請喺瀏覽器或系統設定中允許通知，再返回開啟。
                  </p>
                )}
                <div className="space-y-2 rounded-2xl bg-secondary/40 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 pr-1">
                      <p className="text-sm font-medium">打卡提醒</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        每日早晨提醒你完成微光打卡，開啟美好一天 🌸
                      </p>
                    </div>
                    <Switch
                      className="mt-0.5 shrink-0"
                      checked={morningNotif}
                      aria-label="打卡提醒"
                      onCheckedChange={(checked) => {
                        void applyCareToggle("morning", checked).then((ok) => {
                          if (!ok && checked) setMorningNotif(false);
                        });
                      }}
                    />
                  </div>
                  {morningNotif && (
                    <div className="flex justify-end">
                      <input
                        type="time"
                        value={morningTimeValue}
                        aria-label="打卡提醒時間"
                        className="rounded-lg border border-border/60 bg-background px-2 py-1.5 text-sm text-foreground"
                        onChange={(e) => {
                          setMorningTimeValue(e.target.value);
                          void applyCareTime("morning", e.target.value);
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2 rounded-2xl bg-secondary/40 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 pr-1">
                      <p className="text-sm font-medium">晚安陪伴</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        睡前溫馨問候，陪伴你梳理心情、好好休息 ✨
                      </p>
                    </div>
                    <Switch
                      className="mt-0.5 shrink-0"
                      checked={eveningNotif}
                      aria-label="晚安陪伴"
                      onCheckedChange={(checked) => {
                        void applyCareToggle("evening", checked).then((ok) => {
                          if (!ok && checked) setEveningNotif(false);
                        });
                      }}
                    />
                  </div>
                  {eveningNotif && (
                    <div className="flex justify-end">
                      <input
                        type="time"
                        value={eveningTimeValue}
                        aria-label="晚安陪伴提醒時間"
                        className="rounded-lg border border-border/60 bg-background px-2 py-1.5 text-sm text-foreground"
                        onChange={(e) => {
                          setEveningTimeValue(e.target.value);
                          void applyCareTime("evening", e.target.value);
                        }}
                      />
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-destructive/40 bg-destructive/10 p-4">
                <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
                  <Phone className="size-4 text-destructive" aria-hidden="true" />
                  緊急求助熱線
                </h2>
                <ul className="mt-2 space-y-1.5">
                  {HOTLINES.map((h) => (
                    <li key={h.tel}>
                      <div className="flex items-center justify-between rounded-2xl bg-card/80 px-3 py-2 text-xs">
                        <span className="min-w-0 pr-2">{h.name}</span>
                        <span className="shrink-0 font-semibold text-foreground">{h.tel}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl border border-destructive/25 bg-destructive/5 p-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-destructive/90">
                  <MessageSquareOff className="size-4 shrink-0" aria-hidden="true" />
                  聊天記錄
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  只清除與 Bestie 的對話泡泡，不會影響心情紀錄、靈魂卡或 VIP 狀態。
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full rounded-2xl border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => setClearChatConfirmOpen(true)}
                >
                  清除聊天記錄
                </Button>
              </section>

              <section className="glass space-y-3 rounded-3xl p-4 pb-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Shield className="size-4 text-sky" aria-hidden="true" />
                  私隱與資料
                </h2>
                <Accordion type="single" collapsible>
                  <AccordionItem value="privacy" className="border-none">
                    <AccordionTrigger className="py-2 text-sm">私隱政策</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                      <p>
                        你的所有傾訴對話與心情紀錄均 100% 預設儲存在你的本地裝置（Local Storage）中，我們不會將你的私密對話上傳至雲端，確保最高規格的個人私隱。
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <p className="text-xs leading-relaxed text-destructive/90">
                  ⚠️ 注意：重置資料將一併清除本機上的 VIP 會員狀態與所有歷史對話，且無法復原。
                </p>
                <Button
                  variant="outline"
                  className="w-full rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => setClearAllConfirmOpen(true)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  重置／清除所有資料
                </Button>
              </section>
            </div>
              </div>
            </DialogPrimitive.Content>
          </div>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <VipUnlockDialog open={vipOpen} onOpenChange={setVipOpen} title="升級 VIP 陪伴計劃" />
      <DailyCardPersonaLockDialog open={personaLockOpen} onOpenChange={setPersonaLockOpen} />

      <AlertDialog open={clearAllConfirmOpen} onOpenChange={setClearAllConfirmOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>確定要重置並清除所有資料嗎？</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <p>此操作將永久刪除：</p>
                <ol className="list-decimal space-y-1 pl-4">
                  <li>所有 Bestie 傾訴紀錄與心情日記</li>
                  <li>本機的 VIP 尊尚會員啟用狀態</li>
                </ol>
                <p>如需保留 VIP 權限，請勿清除。確定要繼續嗎？</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogCancel autoFocus className="mt-0 w-full rounded-2xl">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                clearAll();
                clearBestieAccountData();
                clearDailyCardDrawHistory();
                clearTrialChatCounts();
                toast("已重置所有本機資料");
                setClearAllConfirmOpen(false);
                setPreferencesOpen(false);
                window.location.reload();
              }}
            >
              確定清除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearChatConfirmOpen} onOpenChange={setClearChatConfirmOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>清除聊天記錄？</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              確定要清除所有對話記錄嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogCancel autoFocus className="mt-0 w-full rounded-2xl">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                clearChat();
                toast("已清除聊天記錄");
                setClearChatConfirmOpen(false);
              }}
            >
              確定清除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
