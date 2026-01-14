import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user role info
    const { data: adminData } = await supabase
      .from("admins")
      .select("role_id, assigned_dimension_id")
      .eq("id", user.id)
      .single();

    const isLeader = adminData?.role_id === 4;
    const isAdmin = adminData?.role_id === 2 || adminData?.role_id === 3;

    if (!isLeader && !isAdmin) {
      return NextResponse.json({ error: "Only leaders/admins can access this" }, { status: 403 });
    }

    // Fetch tasks (optionally filtered by assigned dimension if not admin)
    let query = supabase.from("folder_tasks").select("id, status, dimension_id");

    if (!isAdmin && adminData?.assigned_dimension_id) {
      query = query.eq("dimension_id", adminData.assigned_dimension_id);
    }

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 500 });
    }

    // Calculate summary stats
    const totalTasks = tasks?.length || 0;
    const pendingTasks = tasks?.filter((t) => t.status === "pending").length || 0;
    const missingTasks = tasks?.filter((t) => t.status === "missing").length || 0;
    const completedTasks = tasks?.filter((t) => t.status === "completed").length || 0;

    return NextResponse.json({
      totalTasks,
      pendingTasks,
      missingTasks,
      completedTasks,
    });
  } catch (error: any) {
    console.error("Error fetching task summary:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch task summary" }, { status: 500 });
  }
}
