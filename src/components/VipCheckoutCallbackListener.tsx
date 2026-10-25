import { useEffect, useRef, useState } from "react";
import { VipCelebrationDialog } from "@/components/VipCelebrationDialog";
import { useBestieAuth } from "@/lib/bestie-auth-context";
import { useMood } from "@/lib/mood-store";
import {
  activateVipMembership,
  isStripeCheckoutSuccessParams,
  stripCheckoutSuccessFromUrl,
} from "@/lib/vip-subscription";

/** Global Stripe return-url handler (?success=true | ?vip=success | ?pay_status=success). */
export function VipCheckoutCallbackListener() {
  const { setIsVip } = useMood();
  const { refreshVipFromAccount } = useBestieAuth();
  const [celebrateOpen, setCelebrateOpen] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || handledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (!isStripeCheckoutSuccessParams(params)) return;

    handledRef.current = true;
    activateVipMembership();
    setIsVip(true);
    void refreshVipFromAccount();
    stripCheckoutSuccessFromUrl();
    setCelebrateOpen(true);
  }, [setIsVip, refreshVipFromAccount]);

  return <VipCelebrationDialog open={celebrateOpen} onOpenChange={setCelebrateOpen} />;
}
