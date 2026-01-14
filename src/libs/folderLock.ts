import { createClient } from "@/utils/supabase/server"

export async function verifyUnlockToken(
  folderId: number,
  token: string,
  userId: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("unlock_tokens")
    .select("*")
    .eq("folder_id", folderId)
    .eq("token", token)
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .single()

  return !!data && !error
}
