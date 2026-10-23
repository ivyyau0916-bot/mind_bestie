import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  SOUL_CARD_DOWNLOAD_SUCCESS_TOAST,
  saveSoulCardFromElement,
} from "@/lib/soul-card-share";

export function useSoulCardSave() {
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const revokePreviewRef = useRef<(() => void) | null>(null);

  const clearPreviewResources = useCallback(() => {
    revokePreviewRef.current?.();
    revokePreviewRef.current = null;
    setPreviewUrl(null);
  }, []);

  const handlePreviewOpenChange = useCallback(
    (open: boolean) => {
      setPreviewOpen(open);
      if (!open) clearPreviewResources();
    },
    [clearPreviewResources],
  );

  const saveFromElement = useCallback(
    async (element: HTMLElement | null) => {
      if (!element || busy) return;
      setBusy(true);
      try {
        const result = await saveSoulCardFromElement(element);
        if (result.mode === "download") {
          toast.success(SOUL_CARD_DOWNLOAD_SUCCESS_TOAST);
        } else {
          clearPreviewResources();
          revokePreviewRef.current = result.revokePreviewUrl;
          setPreviewUrl(result.previewUrl);
          setPreviewOpen(true);
        }
      } catch {
        toast.error("生成失敗，請稍後再試");
      } finally {
        setBusy(false);
      }
    },
    [busy, clearPreviewResources],
  );

  return {
    busy,
    saveFromElement,
    previewOpen,
    setPreviewOpen: handlePreviewOpenChange,
    previewUrl,
  };
}
