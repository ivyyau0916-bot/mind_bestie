import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildTrialExhaustedVipMessage } from "@/lib/freemium";
import type { PersonaId } from "@/lib/chat-personas";
import { useStripeCheckout } from "@/lib/stripe-checkout-context";
import { cn } from "@/lib/utils";

type PersonaTrialExhaustedDialogProps = {
  open: boolean;
  persona: PersonaId;
  onOpenChange: (open: boolean) => void;
};

export function PersonaTrialExhaustedDialog({
  open,
  persona,
  onOpenChange,
}: PersonaTrialExhaustedDialogProps) {
  const goStripeCheckout = useStripeCheckout();
  if (persona !== "fierce" && persona !== "wise") return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-sm rounded-[1.75rem] border-stone-300/45 bg-gradient-to-b from-stone-100/95 via-background to-violet-50/35",
          "dark:border-stone-600/35 dark:from-stone-900/95 dark:to-violet-950/25",
        )}
      >
        <DialogHeader className="items-center text-center">
          <div
            className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full border border-amber-200/60 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-950/40"
            aria-hidden
          >
            <Crown className="size-5 text-amber-500" />
          </div>
          <DialogTitle className="font-display text-lg leading-snug">試用額度已用完</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {buildTrialExhaustedVipMessage(persona)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            className="w-full rounded-2xl bg-gradient-to-r from-violet-600/90 to-rose-500/85 font-medium hover:opacity-95"
            onClick={() => {
              onOpenChange(false);
              goStripeCheckout();
            }}
          >
            立即訂閱 VIP
          </Button>
          <Button type="button" variant="outline" className="w-full rounded-2xl" onClick={() => onOpenChange(false)}>
            下次先
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
