import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useBestieAuth } from "@/lib/bestie-auth-context";
import { hasVipCheckoutResumeAfterLogin } from "@/lib/vip-checkout-after-login";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "登入中 · 心事 Bestie" }],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { user, loading } = useBestieAuth();

  const awaitingStripe = hasVipCheckoutResumeAfterLogin();

  useEffect(() => {
    if (loading) return;
    if (!user?.email) {
      navigate({ to: "/profile", replace: true, search: { settings: "1" } });
      return;
    }
    // VIP upgrade: stay here until StripeCheckoutProvider redirects (avoid /chat false VIP heuristics).
    if (awaitingStripe) return;
    navigate({ to: "/profile", replace: true });
  }, [loading, user?.email, navigate, awaitingStripe]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <Loader2 className="size-8 animate-spin text-violet-600" aria-hidden />
      <p className="text-sm text-muted-foreground">
        {awaitingStripe && user?.email
          ? "登入成功，正在帶你前往 Stripe 付款…"
          : "正在完成 Email 登入，請稍候…"}
      </p>
    </div>
  );
}
