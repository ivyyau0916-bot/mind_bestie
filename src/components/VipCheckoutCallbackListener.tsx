import { useEffect, useRef, useState } from "react";
import { StripeCheckoutConfirmDialog } from "@/components/StripeCheckoutConfirmDialog";
import { VipCelebrationDialog } from "@/components/VipCelebrationDialog";
import { fetchActiveAuthEmail } from "@/lib/bestie-auth-session";
import { useBestieAuth } from "@/lib/bestie-auth-context";
import { syncVipAfterCheckoutReturn } from "@/lib/vip-entitlement";
import { useMood } from "@/lib/mood-store";
import {
  confirmStripeCheckoutPaymentCompleted,
  processStripeCheckoutReturn,
  readStoredIsVip,
} from "@/lib/vip-subscription";

/** Stripe return handler (query params, referrer, or bare /chat success URL). */
export function VipCheckoutCallbackListener() {
  const { setIsVip } = useMood();
  const { refreshVipFromAccount, loading: authLoading } = useBestieAuth();
  const [celebrateOpen, setCelebrateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || handledRef.current) return;

    const result = processStripeCheckoutReturn();
    if (!result.activated && !result.showCelebration && !result.promptPaymentConfirm) {
      return;
    }

    handledRef.current = true;
    if (result.activated) {
      setIsVip(true);
      void (async () => {
        const email = await fetchActiveAuthEmail();
        await syncVipAfterCheckoutReturn(email);
      })();
    }
    if (result.showCelebration) {
      setCelebrateOpen(true);
    }
    if (result.promptPaymentConfirm) {
      setConfirmOpen(true);
    }
  }, [setIsVip]);

  useEffect(() => {
    if (authLoading || !readStoredIsVip()) return;
    void (async () => {
      const email = await fetchActiveAuthEmail();
      await syncVipAfterCheckoutReturn(email);
      await refreshVipFromAccount();
    })();
  }, [authLoading, refreshVipFromAccount]);

  const handleConfirmPaid = () => {
    confirmStripeCheckoutPaymentCompleted();
    setIsVip(true);
    void (async () => {
      const email = await fetchActiveAuthEmail();
      await syncVipAfterCheckoutReturn(email);
      await refreshVipFromAccount();
    })();
    setCelebrateOpen(true);
  };

  return (
    <>
      <VipCelebrationDialog open={celebrateOpen} onOpenChange={setCelebrateOpen} />
      <StripeCheckoutConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirmPaid={handleConfirmPaid}
      />
    </>
  );
}
