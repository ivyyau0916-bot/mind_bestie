import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DAILY_CARD_PERSONA_LOCK_MESSAGE } from "@/lib/freemium";
import { useStripeCheckout } from "@/lib/stripe-checkout-context";
import { cn } from "@/lib/utils";

export const DAILY_CARD_VIP_UNLOCK_TITLE = "解鎖專屬 Bestie 與每日 3 張金句卡";

type DailyCardPersonaLockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DailyCardPersonaLockDialog({ open, onOpenChange }: DailyCardPersonaLockDialogProps) {
  const goStripeCheckout = useStripeCheckout();
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
            className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full border border-stone-300/50 bg-stone-200/40 dark:border-stone-500/40 dark:bg-stone-800/50"
            aria-hidden
          >
            <Lock className="size-5 text-stone-600 dark:text-stone-300" strokeWidth={1.75} />
          </div>
          <DialogTitle className="font-display text-lg leading-snug tracking-wide">{DAILY_CARD_VIP_UNLOCK_TITLE}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">{DAILY_CARD_PERSONA_LOCK_MESSAGE}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            className="w-full rounded-2xl bg-gradient-to-r from-violet-600/90 to-rose-500/85 font-medium hover:opacity-95"
            onClick={() => {
              onOpenChange(false);
              goStripeCheckout();
            }}
          >
            立即訂閱 VIP
          </Button>
          <Button variant="outline" className="w-full rounded-2xl border-stone-300/60" onClick={() => onOpenChange(false)}>
            下次先
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
