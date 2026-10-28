import { useState } from "react";
import { Loader2 } from "lucide-react";
import { GoogleBrandIcon } from "@/components/GoogleBrandIcon";
import { Button } from "@/components/ui/button";
import type { AuthActionResult } from "@/lib/bestie-auth-credentials";
import { cn } from "@/lib/utils";

type BestieGoogleSignInButtonProps = {
  onGoogleSignIn: () => Promise<AuthActionResult>;
  disabled?: boolean;
  className?: string;
  label?: string;
};

export function BestieGoogleSignInButton({
  onGoogleSignIn,
  disabled = false,
  className,
  label = "使用 Google 帳號繼續",
}: BestieGoogleSignInButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    const result = await onGoogleSignIn();
    if (!result.ok) setBusy(false);
    // Success navigates away to Google — keep loading until unload.
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "h-11 w-full gap-2 rounded-2xl border-stone-300/80 bg-white font-medium text-stone-800 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800",
        className,
      )}
      disabled={disabled || busy}
      onClick={() => void handleClick()}
    >
      {busy ? (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        <GoogleBrandIcon className="size-5 shrink-0" />
      )}
      {label}
    </Button>
  );
}

export function AuthOrDivider() {
  return (
    <div className="relative flex items-center py-1">
      <div className="flex-1 border-t border-stone-200 dark:border-stone-700" aria-hidden />
      <span className="px-3 text-xs text-muted-foreground">或</span>
      <div className="flex-1 border-t border-stone-200 dark:border-stone-700" aria-hidden />
    </div>
  );
}
