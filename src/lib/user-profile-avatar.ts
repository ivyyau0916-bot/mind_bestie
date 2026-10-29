import { prepareAvatarImageForUpload } from "@/lib/avatar-image";
import { getSupabaseClient, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase";

export const AVATARS_BUCKET = "avatars";

export type UserProfileRow = {
  user_id: string;
  avatar_url: string | null;
  display_name: string | null;
};

export type AvatarUploadResult =
  | { ok: true; avatarUrl: string }
  | { ok: false; message: string };

const AVATAR_CACHE_PREFIX = "bestie_profile_avatar:";

export function readCachedProfileAvatarUrl(userId: string): string | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(`${AVATAR_CACHE_PREFIX}${userId}`);
  return raw?.startsWith("http") ? raw : null;
}

export function writeCachedProfileAvatarUrl(userId: string, url: string | null): void {
  if (typeof localStorage === "undefined") return;
  const key = `${AVATAR_CACHE_PREFIX}${userId}`;
  if (!url) localStorage.removeItem(key);
  else localStorage.setItem(key, url);
}

export async function fetchProfileAvatarUrl(userId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return readCachedProfileAvatarUrl(userId);
  const supabase = getSupabaseClient();
  if (!supabase) return readCachedProfileAvatarUrl(userId);

  const { data, error } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[profile-avatar] fetch", error.message);
    return readCachedProfileAvatarUrl(userId);
  }

  const url = data?.avatar_url?.trim() || null;
  writeCachedProfileAvatarUrl(userId, url);
  return url;
}

async function upsertProfileAvatarUrl(userId: string, avatarUrl: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.warn("[profile-avatar] upsert profile", error.message);
    return false;
  }
  return true;
}

function publicAvatarUrl(storagePath: string, cacheBust?: number): string {
  const base = getSupabaseUrl()?.replace(/\/$/, "");
  if (!base) throw new Error("Supabase URL 未設定");
  const url = `${base}/storage/v1/object/public/${AVATARS_BUCKET}/${storagePath}`;
  return cacheBust ? `${url}?v=${cacheBust}` : url;
}

export async function uploadProfileAvatar(file: File, userId: string): Promise<AvatarUploadResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase 尚未設定，無法上傳頭像。" };
  }
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: false, message: "無法連線 Supabase，請稍後再試。" };
  }

  let prepared;
  try {
    prepared = await prepareAvatarImageForUpload(file);
  } catch (err) {
    const message = err instanceof Error ? err.message : "圖片處理失敗";
    return { ok: false, message };
  }

  const storagePath = `${userId}/avatar.${prepared.extension}`;
  const { error: uploadError } = await supabase.storage.from(AVATARS_BUCKET).upload(storagePath, prepared.blob, {
    contentType: prepared.contentType,
    upsert: true,
    cacheControl: "3600",
  });

  if (uploadError) {
    console.warn("[profile-avatar] upload", uploadError.message);
    return {
      ok: false,
      message: uploadError.message.includes("Bucket not found")
        ? "請在 Supabase 建立 avatars Storage Bucket（見 supabase/storage_avatars.sql）。"
        : "上傳失敗，請稍後再試。",
    };
  }

  const avatarUrl = publicAvatarUrl(storagePath, Date.now());
  const saved = await upsertProfileAvatarUrl(userId, avatarUrl);
  if (!saved) {
    return { ok: false, message: "圖片已上傳，但無法寫入 profile，請確認已執行 supabase/profiles.sql。" };
  }

  writeCachedProfileAvatarUrl(userId, avatarUrl);
  return { ok: true, avatarUrl };
}
