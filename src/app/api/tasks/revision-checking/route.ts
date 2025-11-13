import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { taskId } = await req.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Fetch the original folder task
    const { data: originalTask, error: taskError } = await supabase
      .from("folder_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (taskError || !originalTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // ✅ Fetch the dimension leader
    const { data: leader, error: leaderError } = await supabase
      .from("admins")
      .select("id")
      .eq("role_id", 4)
      .eq("assigned_dimension_id", originalTask.dimension_id)
      .single();

    if (leaderError || !leader) {
      return NextResponse.json({ error: "Leader not found" }, { status: 404 });
    }

    // ✅ Find the existing task_review
    const { data: existingReview, error: reviewFetchError } = await supabase
      .from("task_reviews")
      .select("*")
      .eq("original_task_id", taskId)
      .single();

    if (reviewFetchError || !existingReview) {
      return NextResponse.json({ error: "Existing review not found" }, { status: 404 });
    }

    // ✅ Update the existing review task
    const { error: updateReviewError } = await supabase
      .from("task_reviews")
      .update({
        task_title: `Checking of Revision: ${originalTask.title}`,
        task_description: originalTask.description,
        folder_id: originalTask.folder_id,
        dimension_id: originalTask.dimension_id,
        review_type: "review",
        assigned_to: leader.id,
        submitted_by: user.id,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("original_task_id", taskId);

    if (updateReviewError) {
      return NextResponse.json({ error: updateReviewError.message }, { status: 500 });
    }

    // ✅ Update the folder task status to “for checking”
    const { error: updateTaskError } = await supabase
      .from("folder_tasks")
      .update({ status: "for checking", updated_at: new Date().toISOString() })
      .eq("id", taskId);

    if (updateTaskError) {
      return NextResponse.json({ error: updateTaskError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Revision resubmitted for checking successfully.",
    });
  } catch (error: any) {
    console.error("Error submitting revision:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
