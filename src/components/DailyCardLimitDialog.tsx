import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DAILY_CARD_DRAW_LIMIT_MESSAGE } from "@/lib/freemium";

type DailyCardLimitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlockVip: () => void;
};

export function DailyCardLimitDialog({ open, onOpenChange, onUnlockVip }: DailyCardLimitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-lg">聽日再嚟抽卡 ✨</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap text-center text-sm leading-relaxed">
            {DAILY_CARD_DRAW_LIMIT_MESSAGE}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button className="w-full rounded-2xl" onClick={onUnlockVip}>
            解鎖 VIP 陪伴計劃
          </Button>
          <Button variant="outline" className="w-full rounded-2xl" onClick={() => onOpenChange(false)}>
            明白喇
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
