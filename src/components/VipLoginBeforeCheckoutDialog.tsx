import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type VipLoginBeforeCheckoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loginHint: string;
  onMagicLink: (email: string) => Promise<{ ok: true } | { ok: false; message: string }>;
};

export function VipLoginBeforeCheckoutDialog({
  open,
  onOpenChange,
  loginHint,
  onMagicLink,
}: VipLoginBeforeCheckoutDialogProps) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setMagicSent(false);
    setBusy(false);
  };

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          reset();
          setEmail("");
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[120] bg-black/75 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-[121] w-full max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-[1.75rem] border border-stone-300/50 bg-background p-6 shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          <DialogPrimitive.Close
            type="button"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            aria-label="關閉"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>

          <div className="flex flex-col items-center text-center">
            <div
              className="mb-3 flex size-12 items-center justify-center rounded-full bg-violet-100/80 dark:bg-violet-950/50"
              aria-hidden
            >
              <Mail className="size-5 text-violet-600 dark:text-violet-300" />
            </div>
            <DialogPrimitive.Title className="font-display text-lg">登入 Email 帳號</DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p className="rounded-2xl border border-amber-200/60 bg-amber-50/60 px-3 py-2.5 text-[13px] text-amber-950 dark:border-amber-500/25 dark:bg-amber-950/35 dark:text-amber-100">
                {loginHint}
              </p>
              <p>請輸入 Email 寄送登入連結。完成後會自動帶你到 Stripe 付款，並綁定 VIP 到呢個帳號。</p>
            </DialogPrimitive.Description>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {magicSent ? (
              <p className="rounded-2xl border border-violet-200/60 bg-violet-50/50 px-3 py-3 text-center text-sm leading-relaxed text-violet-950 dark:border-violet-800/40 dark:bg-violet-950/40 dark:text-violet-100">
                登入連結已寄出 ✉️ 請到信箱點擊連結；返回 App 後會自動前往 Stripe 付款。
              </p>
            ) : (
              <>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                  className="h-11 rounded-2xl text-center"
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button
                  type="button"
                  className="h-11 w-full rounded-2xl"
                  disabled={busy || !email.trim().includes("@")}
                  onClick={async () => {
                    setBusy(true);
                    setError(null);
                    const result = await onMagicLink(email.trim());
                    setBusy(false);
                    if (!result.ok) {
                      setError(result.message);
                      return;
                    }
                    setMagicSent(true);
                  }}
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : "寄送登入連結到 Email"}
                </Button>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
