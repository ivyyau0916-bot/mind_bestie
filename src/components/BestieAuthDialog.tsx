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
          "max-w-sm rounded-[1.75rem] border-stone-300/45 bg-gradient-to-b from-stone-100/98 via-background to-violet-50/50 p-6 shadow-xl backdrop-blur-md dark:border-stone-600/35 dark:from-stone-900/98 dark:to-violet-950/30",
        )}
      >
        <DialogHeader className="items-center text-center">
          <DialogTitle className="font-display text-xl tracking-wide">登入心事 Bestie</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            登入後可同步 VIP 會員權限，傾訴內容仍保存在本機。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {magicSent ? (
            <p className="rounded-2xl border border-violet-200/60 bg-violet-50/50 px-3 py-3 text-center text-sm leading-relaxed text-violet-950 dark:border-violet-800/40 dark:bg-violet-950/40 dark:text-violet-100">
              登入連結已寄到你的信箱，請在 24 小時內點擊郵件中的按鈕完成登入 ✉️
            </p>
          ) : (
            <>
              <label className="sr-only" htmlFor="bestie-magic-email">
                Email
              </label>
              <Input
                id="bestie-magic-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy !== null}
                className="h-11 rounded-2xl border-stone-300/70 bg-white/90 text-sm placeholder:text-stone-400 dark:border-stone-700/60 dark:bg-stone-900/80"
              />
              <Button
                type="button"
                className="h-11 w-full rounded-2xl bg-stone-900 text-sm font-medium text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
                disabled={busy !== null || !email.trim()}
                onClick={async () => {
                  setError(null);
                  setBusy("email");
                  const res = await onMagicLink(email.trim());
                  setBusy(null);
                  if (res.ok) {
                    setMagicSent(true);
                  } else {
                    setError(res.message);
                  }
                }}
              >
                {busy === "email" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <>
                    <Mail className="mr-2 size-4" aria-hidden />
                    發送 Email 登入連結
                  </>
                )}
              </Button>
            </>
          )}

          {error && (
            <p className="text-center text-xs text-rose-600 dark:text-rose-400" role="alert">
              {error}
            </p>
          )}

          <p className="px-1 text-center text-[11px] leading-relaxed text-muted-foreground">
            {AUTH_PRIVACY_NOTE}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
