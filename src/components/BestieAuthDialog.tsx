import { BestieEmailPasswordAuthForm } from "@/components/BestieEmailPasswordAuthForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AUTH_PRIVACY_NOTE } from "@/lib/auth-privacy";
import type { AuthActionResult } from "@/lib/bestie-auth-credentials";
import { cn } from "@/lib/utils";

type BestieAuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn: (email: string, password: string) => Promise<AuthActionResult>;
  onSignUp: (email: string, password: string) => Promise<AuthActionResult>;
  onGoogleSignIn: () => Promise<AuthActionResult>;
};

export function BestieAuthDialog({
  open,
  onOpenChange,
  onSignIn,
  onSignUp,
  onGoogleSignIn,
}: BestieAuthDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-sm rounded-[1.75rem] border-stone-300/45 bg-gradient-to-b from-stone-100/98 via-background to-violet-50/50 p-6 shadow-xl backdrop-blur-md dark:border-stone-600/35 dark:from-stone-900/98 dark:to-violet-950/30",
        )}
      >
        <DialogHeader className="items-center text-center">
          <DialogTitle className="font-display text-xl tracking-wide">登入心事 Bestie</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            使用 Email 與密碼或 Google 登入，即可同步 VIP 會員權限；傾訴內容仍保存在本機。
          </DialogDescription>
        </DialogHeader>

        <BestieEmailPasswordAuthForm
          onSignIn={onSignIn}
          onSignUp={onSignUp}
          onGoogleSignIn={onGoogleSignIn}
        />

        <p className="px-1 text-center text-[11px] leading-relaxed text-muted-foreground">
          {AUTH_PRIVACY_NOTE}
        </p>
      </DialogContent>
    </Dialog>
  );
}
