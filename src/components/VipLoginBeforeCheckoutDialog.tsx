import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { BestieAppLogo } from "@/components/BestieAppLogo";
import { BestieEmailPasswordAuthForm } from "@/components/BestieEmailPasswordAuthForm";
import type { AuthActionResult } from "@/lib/bestie-auth-credentials";
import { cn } from "@/lib/utils";

type VipLoginBeforeCheckoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loginHint: string;
  onSignIn: (email: string, password: string) => Promise<AuthActionResult>;
  onSignUp: (email: string, password: string) => Promise<AuthActionResult>;
  onGoogleSignIn: () => Promise<AuthActionResult>;
};

export function VipLoginBeforeCheckoutDialog({
  open,
  onOpenChange,
  loginHint,
  onSignIn,
  onSignUp,
  onGoogleSignIn,
}: VipLoginBeforeCheckoutDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
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
              <BestieAppLogo size="md" />
            </div>
            <DialogPrimitive.Title className="font-display text-lg">登入 Email 帳號</DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p className="rounded-2xl border border-amber-200/60 bg-amber-50/60 px-3 py-2.5 text-[13px] text-amber-950 dark:border-amber-500/25 dark:bg-amber-950/35 dark:text-amber-100">
                {loginHint}
              </p>
              <p>請使用 Email 與密碼登入或註冊。完成後會自動帶你到 Stripe 付款，並綁定 VIP 到呢個帳號。</p>
            </DialogPrimitive.Description>
          </div>

          <BestieEmailPasswordAuthForm
            className="mt-4"
            centered
            onSignIn={onSignIn}
            onSignUp={onSignUp}
            onGoogleSignIn={onGoogleSignIn}
            submitSignInLabel="登入並前往付款"
            submitSignUpLabel="註冊並前往付款"
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
