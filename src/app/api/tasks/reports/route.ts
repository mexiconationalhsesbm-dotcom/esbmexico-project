import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const todayLocal = new Date();
    const localDateStr =
    todayLocal.getFullYear() +
    "-" +
    String(todayLocal.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(todayLocal.getDate()).padStart(2, "0");

    const dateStr = searchParams.get("date") || localDateStr;

    const startLocal = new Date(`${dateStr}T00:00:00`);
    const endLocal = new Date(`${dateStr}T23:59:59`);

    const startDate = startLocal.toISOString();
    const endDate = endLocal.toISOString();

    const offset = (page - 1) * pageSize;

    let query = supabase.from("task_activity_logs").select(
      `
        id,
        timestamp,
        task_id,
        folder_id,
        dimension_id,
        action,
        actor_id,
        actor_role,
        description,
        remarks,
        metadata,
        due
      `,
      { count: "exact" }
    );

    query = query.gte("timestamp", startDate).lte("timestamp", endDate);

    // Search by remarks only
    if (search) {
      query = query.or(
        `description.ilike.%${search}%,remarks.ilike.%${search}%`
      );
    }

    const { data, count, error } = await query
      .order("timestamp", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("[v0] Task reports error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich logs with task, folder, dimension, and actor details
    const enrichedData = await Promise.all(
      (data || []).map(async (log) => {
        // Fetch task title
        const { data: taskData } = await supabase
          .from("folder_tasks")
          .select("title")
          .eq("id", log.task_id)
          .single();

        // Fetch folder name
        const { data: folderData } = await supabase
          .from("folders")
          .select("name")
          .eq("id", log.folder_id)
          .single();

        // Fetch dimension name
        const { data: dimensionData } = await supabase
          .from("dimensions")
          .select("name")
          .eq("id", log.dimension_id)
          .single();

        // Fetch actor details (fullname and email)
        const { data: actorData } = await supabase
          .from("teachers")
          .select("fullname, email")
          .eq("account_id", log.actor_id)
          .single();

        return {
          ...log,
          task_title: taskData?.title || "Unknown",
          folder_name: folderData?.name || "Unknown",
          dimension_name: dimensionData?.name || "Unknown",
          actor_name: actorData?.fullname || "Unknown",
          actor_email: actorData?.email || "Unknown",
        };
      })
    );

    const totalPages = Math.ceil((count || 0) / pageSize);

    return NextResponse.json({
      data: enrichedData,
      pagination: {
        page,
        pageSize,
        totalPages,
        totalRecords: count || 0,
      },
    });
  } catch (error: any) {
    console.error("[v0] Task reports error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
