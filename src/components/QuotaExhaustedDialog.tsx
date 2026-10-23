import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QUOTA_EXHAUSTED_MESSAGE } from "@/lib/freemium";

type QuotaExhaustedDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlockVip: () => void;
};

export function QuotaExhaustedDialog({ open, onOpenChange, onUnlockVip }: QuotaExhaustedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-lg">今日額度用完喇</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap text-center text-sm leading-relaxed">
            {QUOTA_EXHAUSTED_MESSAGE}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button className="w-full rounded-2xl" onClick={onUnlockVip}>
            解鎖 VIP 陪伴計劃
          </Button>
          <Button variant="secondary" className="w-full rounded-2xl" asChild>
            <Link to="/daily-card" onClick={() => onOpenChange(false)}>
              去 ☀️ 每日抽卡
            </Link>
          </Button>
          <Button variant="outline" className="w-full rounded-2xl" asChild>
            <Link to="/relaxation" onClick={() => onOpenChange(false)}>
              去 🌱 每日微光打卡
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
