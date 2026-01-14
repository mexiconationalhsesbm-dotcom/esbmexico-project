import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createClient as createAdmin } from "@supabase/supabase-js"
import { checkAndUnlockFolders } from "@/libs/task-lock-utils"

const supabaseAdmin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { submissionId, tag, comment } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a leader or admin
    const { data: adminData } = await supabase.from("admins").select("role_id").eq("id", user.id).single()

    const isLeader = adminData?.role_id === 4
    const isAdmin = adminData?.role_id === 2 || adminData?.role_id === 3

    if (!isLeader && !isAdmin) {
      return NextResponse.json({ error: "Only leaders can review submissions" }, { status: 403 })
    }

    // Update the submission with review
    const { data: submission, error: updateError } = await supabase
      .from("task_submissions")
      .update({
        leader_tag: tag,
        leader_comment: comment || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select("*, task_assignments(*)")
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update assignment status based on tag
    if (submission?.task_assignments) {
      let newStatus = "submitted"
      if (tag === "accepted") {
        newStatus = "completed"
      } else if (tag === "for_revision") {
        newStatus = "for_revision"
      } else if (tag === "rejected") {
        newStatus = "pending"
      }

      await supabase
        .from("task_assignments")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", submission.task_assignments.id)

      // Check if all assignments are completed to update task status
      if (tag === "accepted") {
        const { data: taskData } = await supabase
          .from("folder_tasks")
          .select("folder_id, dimension_id, title")
          .eq("id", submission.task_id)
          .single()

        if (taskData) {
          const { data: otherSubmissions } = await supabase
            .from("task_submissions")
            .select("id, file_path")
            .eq("assignment_id", submission.task_assignments.id)
            .neq("id", submissionId)

          if (otherSubmissions && otherSubmissions.length > 0) {
            // Delete files from storage
            for (const sub of otherSubmissions) {
              await supabaseAdmin.storage.from("files").remove([sub.file_path])
            }

            // Delete submission records
            await supabase
              .from("task_submissions")
              .delete()
              .eq("assignment_id", submission.task_assignments.id)
              .neq("id", submissionId)
          }
        
          // Download the file from task-submissions bucket
          const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from("files")
            .download(submission.file_path)

          if (downloadError) {
            console.error("[v0] Error downloading submission file:", downloadError)
          } else if (fileData) {
            // Generate new file path in the files bucket
            const fileExt = submission.file_name.split(".").pop()
            const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
            const newFilePath = `${taskData.dimension_id}/${taskData.folder_id}/${fileName}`

            // Upload to files bucket
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
              .from("files")
              .upload(newFilePath, fileData, {
                upsert: true,
                cacheControl: "3600",
                contentType: submission.file_type,
              })

            if (uploadError) {
              console.error("[v0] Error uploading file to folder:", uploadError)
            } else {
              // Get public URL
              const { data: urlData } = supabaseAdmin.storage.from("files").getPublicUrl(newFilePath)
              const publicUrl = urlData?.publicUrl || ""
              const ext = submission.file_name.split(".").pop()
              const base = submission.file_name
                .replace(/\.[^/.]+$/, "")
                .replace(/^[^_]+_/, "")
                .replace(/_v\d+$/, "")

              const newFileName = `${base}.${ext}`


              // Insert into files table (like normal upload)
              const { error: fileInsertError } = await supabaseAdmin.from("files").insert({
                name: newFileName,
                file_path: newFilePath,
                file_type: submission.file_type.substring(0, 255),
                file_size: submission.file_size,
                dimension_id: taskData.dimension_id,
                folder_id: taskData.folder_id,
                uploaded_by: submission.submitted_by,
                public_url: publicUrl,
                status: "checked",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })

              if (fileInsertError) {
                console.error("[v0] Error inserting file record:", fileInsertError)
              }

              await supabaseAdmin.storage
              .from("files")
              .remove([submission.file_path])
              }
          }
        }

          await supabase
            .from("folder_tasks")
            .update({ status: "completed", updated_at: new Date().toISOString() })
            .eq("id", submission.task_id)

        const { data: allAssignments } = await supabase
          .from("task_assignments")
          .select("status")
          .eq("task_id", submission.task_id)

        const allCompleted = allAssignments?.every((a) => a.status === "completed")
        if (allCompleted && taskData?.folder_id) {
          await supabase
            .from("folders")
            .update({ task_locked: false })
            .eq("id", taskData.folder_id)
        }

      }
    }

    return NextResponse.json({ success: true, submission })
  } catch (error: any) {
    console.error("Error reviewing submission:", error)
    return NextResponse.json({ error: error.message || "Failed to review submission" }, { status: 500 })
  }
}
