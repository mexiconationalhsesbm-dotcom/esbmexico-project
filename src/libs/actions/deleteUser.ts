'use server'

import { createAdminClient } from '@/utils/supabase/server-admin'

export async function deleteUserAdmin(userId: string) {
  const supabase = createAdminClient()

  console.log("Deleting user from Supabase Auth:", userId)

  // Optional: check if user exists (for clearer errors)
  const { data: user, error: getUserError } = await supabase.auth.admin.getUserById(userId)
  if (getUserError || !user) {
    throw new Error("User not found in Supabase Auth")
  }

  // Delete user from Supabase Auth
  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
  if (deleteError) {
    console.error("Delete Error:", deleteError)
    throw new Error("Database error deleting user: " + deleteError.message)
  }

  return { success: true }
}
