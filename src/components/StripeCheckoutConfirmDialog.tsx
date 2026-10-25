import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clearStripeCheckoutPending } from "@/lib/vip-subscription";

type StripeCheckoutConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmPaid: () => void;
};

export function StripeCheckoutConfirmDialog({
  open,
  onOpenChange,
  onConfirmPaid,
}: StripeCheckoutConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-[1.75rem]">
        <DialogHeader className="text-center">
          <DialogTitle className="font-display text-lg">剛從 Stripe 返回？</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            若你剛完成付款，請按下方按鈕以開通 VIP。若尚未付款或已取消，可按「稍後再說」。
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            className="w-full rounded-2xl"
            onClick={() => {
              onConfirmPaid();
              onOpenChange(false);
            }}
          >
            已完成付款，開通 VIP
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-2xl"
            onClick={() => {
              clearStripeCheckoutPending();
              onOpenChange(false);
            }}
          >
            稍後再說
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
