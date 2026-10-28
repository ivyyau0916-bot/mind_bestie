import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { StripeCheckoutConfirmDialog } from "@/components/StripeCheckoutConfirmDialog";
import { VipCelebrationDialog } from "@/components/VipCelebrationDialog";
import { resolveAuthEmailForEntitlement } from "@/lib/bestie-auth-session";
import { useBestieAuth } from "@/lib/bestie-auth-context";
import { syncVipAfterCheckoutReturn } from "@/lib/vip-entitlement";
import { useMood } from "@/lib/mood-store";
import {
  confirmStripeCheckoutPaymentCompleted,
  hasLocalPaidVipProof,
  processStripeCheckoutReturn,
  VIP_CHECKOUT_SUCCESS_TOAST,
} from "@/lib/vip-subscription";

/** Stripe return handler (?success=true, celebration pending, payment confirm). */
export function VipCheckoutCallbackListener() {
  const { setIsVip } = useMood();
  const { refreshVipFromAccount, loading: authLoading } = useBestieAuth();
  const [celebrateOpen, setCelebrateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const result = processStripeCheckoutReturn();
    const paid = result.activated || hasLocalPaidVipProof();

    if (paid) {
      setIsVip(true);
    }
    if (result.promptPaymentConfirm) {
      setConfirmOpen(true);
    }
    if (result.showCelebration || result.activated) {
      setCelebrateOpen(true);
      if (!toastShownRef.current) {
        toastShownRef.current = true;
        toast.success(VIP_CHECKOUT_SUCCESS_TOAST, { duration: 6000 });
      }
    }
  }, [authLoading, setIsVip]);

  useEffect(() => {
    if (authLoading || !hasLocalPaidVipProof()) return;

    void (async () => {
      const email = await resolveAuthEmailForEntitlement();
      if (email) {
        await syncVipAfterCheckoutReturn(email);
      }
      await refreshVipFromAccount();
      setIsVip(true);
    })();
  }, [authLoading, refreshVipFromAccount, setIsVip]);

  const handleConfirmPaid = () => {
    confirmStripeCheckoutPaymentCompleted();
    setIsVip(true);
    toast.success(VIP_CHECKOUT_SUCCESS_TOAST, { duration: 6000 });
    void (async () => {
      const email = await resolveAuthEmailForEntitlement();
      if (email) await syncVipAfterCheckoutReturn(email);
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
