import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VIP_PRICE_LABEL } from "@/lib/freemium";
import { useStripeCheckout } from "@/lib/use-stripe-checkout";
import { cn } from "@/lib/utils";

type VipUnlockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
};

export function VipUnlockDialog({ open, onOpenChange, title = "解鎖 VIP 陪伴計劃" }: VipUnlockDialogProps) {
  const goStripeCheckout = useStripeCheckout();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-sm rounded-[1.75rem] border-stone-300/45 bg-gradient-to-b from-stone-100/95 via-background to-violet-50/35",
          "dark:border-stone-600/35 dark:from-stone-900/95 dark:to-violet-950/25",
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 font-display text-xl">
            <Crown className="size-5 text-amber-400" aria-hidden="true" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed">
            {VIP_PRICE_LABEL} 專屬權益
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 rounded-2xl bg-secondary/80 p-4 text-sm leading-relaxed">
          <li>💬 傾訴不限次數（突破每日 20 次免費額度）</li>
          <li>🔥 解鎖戰友 Bestie</li>
          <li>🦉 解鎖理性 Bestie</li>
          <li>🎴 三位 Bestie 每日各 1 張靈魂卡（最多 3 張／日）</li>
        </ul>
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
          <Button variant="ghost" className="w-full rounded-2xl" onClick={() => onOpenChange(false)}>
            下次先
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
