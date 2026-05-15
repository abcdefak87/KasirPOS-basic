import { createServerSupabase } from "./supabase-server";
import { BusinessSettings } from "./types";

export async function fetchBusinessSettings(): Promise<BusinessSettings | null> {
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("business_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}
