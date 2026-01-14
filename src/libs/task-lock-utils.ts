import { createClient } from "@/utils/supabase/server"

export async function checkAndUnlockFolders() {
  try {
    const supabase = await createClient()

    // Get all folders that are task_locked
    const { data: lockedFolders } = await supabase.from("folders").select("id").eq("task_locked", true)

    if (!lockedFolders || lockedFolders.length === 0) {
      return
    }

    // For each locked folder, check if it has any pending tasks
    for (const folder of lockedFolders) {
      const { data: pendingTasks } = await supabase
        .from("folder_tasks")
        .select("id")
        .eq("folder_id", folder.id)
        .eq("status", "pending")
    }
  } catch (error) {
    console.error("Error checking and unlocking folders:", error)
  }
}
