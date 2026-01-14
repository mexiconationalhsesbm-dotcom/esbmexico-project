import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { taskId, assigneeIds } = await request.json()

    console.log("Manage assignees request:", { taskId, assigneeIds })

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }
    // Get current assignments
    const { data: currentAssignments, error: fetchError } = await supabase
      .from("task_assignments")
      .select("id, assigned_to")
      .eq("task_id", taskId)

    if (fetchError) {
      console.error("Error fetching current assignments:", fetchError)
      return NextResponse.json({ error: fetchError.message || "Failed to fetch current assignments" }, { status: 500 })
    }

    const currentAssigneeIds = currentAssignments?.map((a) => a.assigned_to) || []

    // Compare strings, not numbers
    const toAdd = assigneeIds.filter((id: string) => !currentAssigneeIds.includes(id))
    const toRemove = currentAssigneeIds.filter((id: string) => !assigneeIds.includes(id))


    console.log("Changes to make:", { toAdd, toRemove })

    // Remove assignments
    if (toRemove.length > 0) {
      const assignmentIdsToRemove =
        currentAssignments?.filter((a) => toRemove.includes(a.assigned_to)).map((a) => a.id) || []

      if (assignmentIdsToRemove.length > 0) {
        const { error: deleteError } = await supabase.from("task_assignments").delete().in("id", assignmentIdsToRemove)

        if (deleteError) {
          console.error("Error removing assignments:", deleteError)
          return NextResponse.json({ error: deleteError.message || "Failed to remove assignments" }, { status: 500 })
        }
      }
    }

    // Add new assignments
    if (toAdd.length > 0) {
      const newAssignments = toAdd.map((adminId: number) => ({
        task_id: taskId,
        assigned_to: adminId,
        status: "pending",
      }))

      const { error: insertError } = await supabase.from("task_assignments").insert(newAssignments)

      if (insertError) {
        console.error("Error adding assignments:", insertError)
        return NextResponse.json({ error: insertError.message || "Failed to add assignments" }, { status: 500 })
      }
    }

    console.log("Successfully updated assignments")
    return NextResponse.json({
      success: true,
      added: toAdd.length,
      removed: toRemove.length,
    })
  } catch (error) {
    console.error("Error managing assignees:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
