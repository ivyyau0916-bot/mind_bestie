import { useEffect, useId, useRef, useState } from "react";
import { Camera, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import type { PersonaId } from "@/lib/chat-personas";
import { useBestieAuth } from "@/lib/bestie-auth-context";
import {
  fetchProfileAvatarUrl,
  uploadProfileAvatar,
} from "@/lib/user-profile-avatar";
import { cn } from "@/lib/utils";

type ProfileAvatarEditorProps = {
  personaId: PersonaId;
  className?: string;
};

export function ProfileAvatarEditor({ personaId, className }: ProfileAvatarEditorProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { configured: authConfigured, user: authUser, openAuth } = useBestieAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authUser?.id) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    setLoadingProfile(true);
    void fetchProfileAvatarUrl(authUser.id).then((url) => {
      if (!cancelled) {
        setAvatarUrl(url);
        setLoadingProfile(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  const onPickFile = async (file: File | undefined) => {
    if (!file || !authUser?.id) return;
    setUploading(true);
    const result = await uploadProfileAvatar(file, authUser.id);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (result.ok) {
      setAvatarUrl(result.avatarUrl);
      toast.success("頭像已更新");
    } else {
      toast.error(result.message);
    }
  };

  const canUpload = authConfigured && Boolean(authUser?.id);
  const busy = loadingProfile || uploading;

  return (
    <div className={cn("relative shrink-0", className)}>
      <div className="relative flex size-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-200/80 to-stone-200/80 dark:from-violet-800/50 dark:to-stone-700/50">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="size-full object-cover"
            width={56}
            height={56}
          />
        ) : (
          <User className="size-7 text-stone-600 dark:text-stone-200" strokeWidth={1.5} aria-hidden />
        )}
        {busy && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/35"
            aria-live="polite"
            aria-busy="true"
          >
            <Loader2 className="size-6 animate-spin text-white" aria-hidden />
          </div>
        )}
      </div>
      <PersonaAvatar
        personaId={personaId}
        className="absolute -bottom-0.5 -right-0.5 size-7 ring-2 ring-background"
      />
      {canUpload ? (
        <>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => void onPickFile(e.target.files?.[0])}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "absolute -bottom-1 left-1/2 flex -translate-x-1/2 cursor-pointer items-center gap-0.5 rounded-full border border-stone-300/70 bg-background px-2 py-0.5 text-[9px] font-medium text-stone-700 shadow-sm",
              "hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            <Camera className="size-3" aria-hidden />
            {avatarUrl ? "更換" : "上傳"}
          </label>
        </>
      ) : authConfigured ? (
        <button
          type="button"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-stone-300/70 bg-background px-2 py-0.5 text-[9px] font-medium text-violet-700 dark:text-violet-300"
          onClick={openAuth}
        >
          登入後上傳
        </button>
      ) : null}
    </div>
  );
}
