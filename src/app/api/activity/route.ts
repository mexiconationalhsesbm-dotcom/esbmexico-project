import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's admin info
    const { data: admin } = await supabase.from("admins").select("*").eq("id", user.id).single()

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    const { data: currentTeacher } = await supabase
      .from("teachers")
      .select("account_id, fullname, profile_url")
      .eq("account_id", user.id)
      .single()

    const isLeader =
      admin.role_id === 2 || admin.role_id === 3|| admin.role_id === 4

    const activities: any[] = []

    if (isLeader) {
      // For leaders: Get tasks they created AND submissions from members
      // 1. Tasks assigned to dimension members (tasks created by this leader)
      const { data: createdTasks } = await supabase
        .from("folder_tasks")
        .select(
          `
          id,
          title,
          description,
          status,
          due_date,
          created_at,
          folder_id,
          dimension_id,
          folders(id, name),
          dimensions(id, name, slug)
        `,
        )
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })

      // Add created tasks as activity
      createdTasks?.forEach((task: any) => {
        const folder = Array.isArray(task.folders) ? task.folders[0] : task.folders
        const dimension = Array.isArray(task.dimensions) ? task.dimensions[0] : task.dimensions

        activities.push({
          id: `task-${task.id}`,
          type: "task_created",
          category: "tasks",
          title: task.title,
          description: task.description,
          status: task.status,
          due_date: task.due_date,
          created_at: task.created_at,
          folder: { id: folder?.id || task.folder_id, name: folder?.name },
          dimension: { id: dimension?.id || task.dimension_id, name: dimension?.name, slug: dimension?.slug },
          task_id: task.id,
        })
      })

      // 2. Get submissions from members for leader review
      const { data: submissions, error: submissionsError } = await supabase
        .from("task_submissions")
        .select(
          `
          id,
          file_name,
          leader_tag,
          leader_comment,
          version_number,
          created_at,
          reviewed_at,
          reviewed_by,
          submitted_by,
          assignment_id,
          task_assignments(
            id,
            assigned_to,
            folder_tasks(
              id,
              title,
              folder_id,
              dimension_id,
              created_by,
              folders(id, name),
              dimensions(id, name, slug)
            )
          )
        `,
        )
        .order("created_at", { ascending: false })

      console.log("[v0] Leader submissions query result:", submissions?.length, "submissions")
      if (submissionsError) {
        console.log("[v0] Submissions error:", submissionsError)
      }

      const submitterIds: string[] = []
      submissions?.forEach((s: any) => {
        if (s.submitted_by) {
          submitterIds.push(s.submitted_by)
        }
      })
      const uniqueSubmitterIds = [...new Set(submitterIds)]

      const submitterMap = new Map()
      if (uniqueSubmitterIds.length > 0) {
        const { data: submitterAdmins } = await supabase.from("admins").select("id, email").in("id", uniqueSubmitterIds)

        const { data: submitterTeachers } = await supabase
          .from("teachers")
          .select("account_id, fullname, profile_url")
          .in("account_id", uniqueSubmitterIds)

        submitterAdmins?.forEach((admin) => {
          const teacher = submitterTeachers?.find((t) => t.account_id === admin.id)
          submitterMap.set(admin.id, {
            id: admin.id,
            email: admin.email,
            fullname: teacher?.fullname || null,
            profile_url: teacher?.profile_url || null,
          })
        })
      }

      submissions?.forEach((submission: any) => {
        const assignment = Array.isArray(submission.task_assignments)
          ? submission.task_assignments[0]
          : submission.task_assignments
        if (!assignment) return

        const folderTask = Array.isArray(assignment.folder_tasks) ? assignment.folder_tasks[0] : assignment.folder_tasks
        if (!folderTask) return

        // Only show submissions for tasks created by this leader
        if (folderTask.created_by !== user.id) return

        const folder = Array.isArray(folderTask.folders) ? folderTask.folders[0] : folderTask.folders
        const dimension = Array.isArray(folderTask.dimensions) ? folderTask.dimensions[0] : folderTask.dimensions
        const submitter = submitterMap.get(submission.submitted_by)

        activities.push({
          id: `submission-${submission.id}`,
          type: "submission_received",
          category: "submissions",
          title: folderTask.title,
          description: `${submitter?.fullname || "A member"} submitted ${submission.file_name}`,
          status: submission.leader_tag || "pending",
          version_number: submission.version_number,
          created_at: submission.created_at,
          folder: { id: folder?.id || folderTask.folder_id, name: folder?.name },
          dimension: { id: dimension?.id || folderTask.dimension_id, name: dimension?.name, slug: dimension?.slug },
          task_id: folderTask.id,
          submission_id: submission.id,
          submitter: submitter || null,
        })
      })
    } else {
      // For members: Get tasks assigned to them and reviews of their submissions
      // 1. Get assigned tasks
      const { data: assignments, error: assignmentsError } = await supabase
        .from("task_assignments")
        .select(
          `
          id,
          status,
          created_at,
          folder_tasks(
            id,
            title,
            description,
            status,
            due_date,
            created_by,
            folder_id,
            dimension_id,
            folders(id, name),
            dimensions(id, name, slug)
          )
        `,
        )
        .eq("assigned_to", user.id)
        .order("created_at", { ascending: false })

      console.log("[v0] Member assignments query result:", assignments?.length, "assignments")
      if (assignmentsError) {
        console.log("[v0] Assignments error:", assignmentsError)
      }

      const creatorIds: string[] = []
      assignments?.forEach((a: any) => {
        const folderTask = Array.isArray(a.folder_tasks) ? a.folder_tasks[0] : a.folder_tasks
        if (folderTask?.created_by) {
          creatorIds.push(folderTask.created_by)
        }
      })
      const uniqueCreatorIds = [...new Set(creatorIds)]

      const creatorMap = new Map()
      if (uniqueCreatorIds.length > 0) {
        const { data: creatorAdmins } = await supabase.from("admins").select("id, email").in("id", uniqueCreatorIds)

        const { data: creatorTeachers } = await supabase
          .from("teachers")
          .select("account_id, fullname, profile_url")
          .in("account_id", uniqueCreatorIds)

        creatorAdmins?.forEach((admin) => {
          const teacher = creatorTeachers?.find((t) => t.account_id === admin.id)
          creatorMap.set(admin.id, {
            id: admin.id,
            email: admin.email,
            fullname: teacher?.fullname || null,
            profile_url: teacher?.profile_url || null,
          })
        })
      }

      assignments?.forEach((assignment: any) => {
        const folderTask = Array.isArray(assignment.folder_tasks) ? assignment.folder_tasks[0] : assignment.folder_tasks
        if (!folderTask) return

        const folder = Array.isArray(folderTask.folders) ? folderTask.folders[0] : folderTask.folders
        const dimension = Array.isArray(folderTask.dimensions) ? folderTask.dimensions[0] : folderTask.dimensions
        const creator = creatorMap.get(folderTask.created_by)

        activities.push({
          id: `assignment-${assignment.id}`,
          type: "task_assigned",
          category: "tasks",
          title: folderTask.title,
          description: folderTask.description,
          status: assignment.status,
          due_date: folderTask.due_date,
          created_at: assignment.created_at,
          folder: { id: folder?.id || folderTask.folder_id, name: folder?.name },
          dimension: { id: dimension?.id || folderTask.dimension_id, name: dimension?.name, slug: dimension?.slug },
          task_id: folderTask.id,
          assignment_id: assignment.id,
          assigned_by: creator || null,
        })
      })

      // 2. Get reviews of their submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from("task_submissions")
        .select(
          `
          id,
          file_name,
          leader_tag,
          leader_comment,
          version_number,
          reviewed_at,
          reviewed_by,
          created_at,
          task_assignments(
            id,
            folder_tasks(
              id,
              title,
              folder_id,
              dimension_id,
              folders(id, name),
              dimensions(id, name, slug)
            )
          )
        `,
        )
        .eq("submitted_by", user.id)
        .not("reviewed_at", "is", null)
        .order("reviewed_at", { ascending: false })

      console.log("[v0] Member submissions query result:", submissions?.length, "reviewed submissions")
      if (submissionsError) {
        console.log("[v0] Submissions error:", submissionsError)
      }

      const reviewerIds = [...new Set(submissions?.map((s: any) => s.reviewed_by).filter(Boolean) || [])]

      const reviewerMap = new Map()
      if (reviewerIds.length > 0) {
        const { data: reviewerAdmins } = await supabase.from("admins").select("id, email").in("id", reviewerIds)

        const { data: reviewerTeachers } = await supabase
          .from("teachers")
          .select("account_id, fullname, profile_url")
          .in("account_id", reviewerIds)

        reviewerAdmins?.forEach((admin) => {
          const teacher = reviewerTeachers?.find((t) => t.account_id === admin.id)
          reviewerMap.set(admin.id, {
            id: admin.id,
            email: admin.email,
            fullname: teacher?.fullname || null,
            profile_url: teacher?.profile_url || null,
          })
        })
      }

      submissions?.forEach((submission: any) => {
        const assignment = Array.isArray(submission.task_assignments)
          ? submission.task_assignments[0]
          : submission.task_assignments
        if (!assignment) return

        const folderTask = Array.isArray(assignment.folder_tasks) ? assignment.folder_tasks[0] : assignment.folder_tasks
        if (!folderTask) return

        const folder = Array.isArray(folderTask.folders) ? folderTask.folders[0] : folderTask.folders
        const dimension = Array.isArray(folderTask.dimensions) ? folderTask.dimensions[0] : folderTask.dimensions
        const reviewer = reviewerMap.get(submission.reviewed_by)

        activities.push({
          id: `review-${submission.id}`,
          type: "submission_reviewed",
          category: "submissions",
          title: folderTask.title,
          description: `Your submission "${submission.file_name}" was reviewed`,
          status: submission.leader_tag || "pending",
          version_number: submission.version_number,
          reviewer_comment: submission.leader_comment,
          created_at: submission.reviewed_at,
          folder: { id: folder?.id || folderTask.folder_id, name: folder?.name },
          dimension: { id: dimension?.id || folderTask.dimension_id, name: dimension?.name, slug: dimension?.slug },
          task_id: folderTask.id,
          submission_id: submission.id,
          reviewer: reviewer || null,
        })
      })
    }

    // Sort all activities by created_at descending
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({
      activities,
      admin: {
        id: admin.id,
        email: admin.email,
        fullname: currentTeacher?.fullname || admin.full_name || null,
        profile_url: currentTeacher?.profile_url || null,
        role: admin.role,
      },
      isLeader,
    })
  } catch (error: any) {
    console.error("Error fetching activity:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch activity" }, { status: 500 })
  }
}
