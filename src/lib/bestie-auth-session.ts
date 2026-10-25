import { getSupabaseClient } from "@/lib/supabase";

/** Only a live Supabase session counts as signed-in (not stale localStorage). */
export async function fetchActiveAuthEmail(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn("[auth-session]", error.message);
    return null;
  }
  const email = data.session?.user?.email?.trim();
  return email?.includes("@") ? email : null;
}
