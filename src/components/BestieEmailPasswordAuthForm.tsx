import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AuthOrDivider, BestieGoogleSignInButton } from "@/components/BestieGoogleSignInButton";
import type { AuthActionResult } from "@/lib/bestie-auth-credentials";

export type AuthFormMode = "signIn" | "signUp";

type BestieEmailPasswordAuthFormProps = {
  onSignIn: (email: string, password: string) => Promise<AuthActionResult>;
  onSignUp: (email: string, password: string) => Promise<AuthActionResult>;
  submitSignInLabel?: string;
  submitSignUpLabel?: string;
  className?: string;
  /** Center-align inputs (VIP dialog). */
  centered?: boolean;
  onGoogleSignIn?: () => Promise<AuthActionResult>;
  googleSignInLabel?: string;
};

export function BestieEmailPasswordAuthForm({
  onSignIn,
  onSignUp,
  submitSignInLabel = "登入",
  submitSignUpLabel = "註冊帳號",
  className,
  centered = false,
  onGoogleSignIn,
  googleSignInLabel,
}: BestieEmailPasswordAuthFormProps) {
  const [mode, setMode] = useState<AuthFormMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = cn(
    "h-11 rounded-2xl text-sm",
    centered && "text-center",
    !centered && "border-stone-300/70 bg-white/90 dark:border-stone-700/60 dark:bg-stone-900/80",
  );

  const run = async () => {
    setBusy(true);
    setError(null);
    const action = mode === "signIn" ? onSignIn : onSignUp;
    const result = await action(email, password);
    setBusy(false);
    if (!result.ok) setError(result.message);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary/80 p-1"
        role="tablist"
        aria-label="登入或註冊"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signIn"}
          className={cn(
            "rounded-xl py-2 text-sm font-medium transition-colors",
            mode === "signIn" ? "bg-background shadow-sm" : "text-muted-foreground",
          )}
          onClick={() => {
            setMode("signIn");
            setError(null);
          }}
        >
          登入
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signUp"}
          className={cn(
            "rounded-xl py-2 text-sm font-medium transition-colors",
            mode === "signUp" ? "bg-background shadow-sm" : "text-muted-foreground",
          )}
          onClick={() => {
            setMode("signUp");
            setError(null);
          }}
        >
          註冊帳號
        </button>
      </div>

      <Input
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="name@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={busy}
        className={inputClass}
      />
      <Input
        type="password"
        autoComplete={mode === "signUp" ? "new-password" : "current-password"}
        placeholder={mode === "signUp" ? "設定密碼（至少 6 位）" : "密碼"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={busy}
        className={inputClass}
        onKeyDown={(e) => {
          if (e.key === "Enter") void run();
        }}
      />

      {error && (
        <p className="text-center text-xs text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      )}

      <Button
        type="button"
        className={cn(
          "h-11 w-full rounded-2xl font-medium",
          !centered && "bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900",
        )}
        disabled={busy || !email.trim() || !password}
        onClick={() => void run()}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : mode === "signIn" ? (
          submitSignInLabel
        ) : (
          submitSignUpLabel
        )}
      </Button>

      {onGoogleSignIn && (
        <>
          <AuthOrDivider />
          <BestieGoogleSignInButton
            onGoogleSignIn={onGoogleSignIn}
            disabled={busy}
            label={googleSignInLabel}
          />
        </>
      )}
    </div>
  );
}
