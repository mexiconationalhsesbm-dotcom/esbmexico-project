import { createClient } from "@/utils/supabase/server"

/**
 * Automatically updates overdue tasks from "pending" to "missing"
 * Checks both folder_tasks and task_assignments tables
 */
export async function updateOverdueTasks(taskIds?: number[]) {
  const supabase = await createClient()
  const now = new Date()

  try {
    let taskQuery = supabase
      .from("folder_tasks")
      .update({ status: "missing", updated_at: now.toISOString() })
      .lt("due_date", now.toISOString())
      .eq("status", "pending")

    if (taskIds && taskIds.length > 0) {
      taskQuery = taskQuery.in("id", taskIds)
    }

    const { error: taskError } = await taskQuery

    if (taskError) {
      console.error("[v0] Error updating overdue tasks:", taskError)
    }

    let assignmentQuery = supabase
      .from("task_assignments")
      .update({ status: "missing", updated_at: now.toISOString() })
      .eq("status", "pending")

    // Get the task assignments that need updating
    if (taskIds && taskIds.length > 0) {
      assignmentQuery = assignmentQuery.in("task_id", taskIds)
    }

    // We need to join with folder_tasks to check due_date
    const { data: overdueAssignments } = await supabase
      .from("task_assignments")
      .select(`
        id,
        task_id,
        folder_tasks!inner(due_date)
      `)
      .eq("status", "pending")

    if (overdueAssignments && overdueAssignments.length > 0) {
      const overdueIds = overdueAssignments
        .filter((a) => {
          const dueDate = a.folder_tasks?.[0]?.due_date
          return dueDate && new Date(dueDate) < now
        })
        .map((a) => a.id)

      if (overdueIds.length > 0) {
        const { error: assignmentError } = await supabase
          .from("task_assignments")
          .update({ status: "missing", updated_at: now.toISOString() })
          .in("id", overdueIds)

        if (assignmentError) {
          console.error("[v0] Error updating overdue assignments:", assignmentError)
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in updateOverdueTasks:", error)
    return { success: false, error }
  }
}
