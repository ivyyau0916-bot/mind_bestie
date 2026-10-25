import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AUTH_PRIVACY_NOTE } from "@/lib/auth-privacy";
import { cn } from "@/lib/utils";

type BestieAuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoogleSignIn: () => Promise<void>;
  onMagicLink: (email: string) => Promise<{ ok: true } | { ok: false; message: string }>;
};

export function BestieAuthDialog({ open, onOpenChange, onGoogleSignIn, onMagicLink }: BestieAuthDialogProps) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetTransient = () => {
    setError(null);
    setMagicSent(false);
    setBusy(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          resetTransient();
          setEmail("");
        }
      }}
    >
      <DialogContent
        className={cn(
          "max-w-sm rounded-[1.75rem] border-stone-300/45 bg-gradient-to-b from-stone-100/98 via-background to-violet-50/40",
          "dark:border-stone-600/35 dark:from-stone-900/98 dark:to-violet-950/30",
        )}
      >
        <DialogHeader className="items-center text-center">
          <DialogTitle className="font-display text-xl tracking-wide">登入心事 Bestie</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            登入後可同步 VIP 會員權限，傾訴內容仍保存在本機。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">

          <div className="relative py-1 text-center text-[11px] text-muted-foreground">

          {magicSent ? (
            <p className="rounded-2xl border border-violet-200/60 bg-violet-50/50 px-3 py-3 text-center text-sm leading-relaxed text-stone-700 dark:border-violet-500/25 dark:bg-violet-950/30 dark:text-stone-200">
              登入連結已寄到你的信箱，請在 24 小時內點擊郵件中的按鈕完成登入 ✉️
            </p>
          ) : (
            <>
              <label className="sr-only" htmlFor="bestie-magic-email">
                Email
              </label>
              <div className="flex gap-2">
                <Input
                  id="bestie-magic-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={email}
                  className="rounded-2xl"
                  disabled={busy !== null}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <p className="text-center text-[11px] text-muted-foreground">Email Magic Link · 免密碼郵件登入</p>
            </>
          )}

          {error && (
            <p role="alert" className="text-center text-xs text-destructive">
              {error}
            </p>
          )}

          <p className="rounded-2xl bg-stone-100/80 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground dark:bg-stone-800/40">
            {AUTH_PRIVACY_NOTE}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
