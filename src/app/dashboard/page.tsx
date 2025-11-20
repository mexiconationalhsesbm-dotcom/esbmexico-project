import type { Metadata } from "next";
import { Folders } from "@/components/sbmfolders/Folders";
import React from "react";
import RecentUploads from "@/components/dashboardItems/RecentUploads";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { StorageOverviewCard } from "@/components/dashboard/storage-overview-card";
import { StorageByDimensionTable } from "@/components/dashboard/storage-by-dimension-table";

export const metadata = {
  title: "eSBMexico Dashboard | MNHS",
  description: "Mexico National High School e-SBM System",
};

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  // 🔹 Fetch admin role + assigned dimension
  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("role_id, assigned_dimension_id")
    .eq("id", user.id)
    .single();

  if (adminError || !admin) notFound();

  const { role_id, assigned_dimension_id } = admin;

  // 🔹 Base query for recent uploads
  let queryBuilder = supabase
    .from("files")
    .select(
      `
        *,
        folder:folder_id ( id, name ),
        dimension:dimension_id ( id, name )
      `
    )
    .order("created_at", { ascending: false })
    .limit(10);

  // 🔹 Filter by dimension if role is 4 or 5
  if (role_id === 4 || role_id === 5) {
    queryBuilder = queryBuilder.eq("dimension_id", assigned_dimension_id);
  }

  const { data: files, error } = await queryBuilder;

  if (error) console.error("Error fetching files:", error);

  const fileList = files ?? [];

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <StorageOverviewCard />
      </div>

      <div className="col-span-12">
        <StorageByDimensionTable />
      </div>

      <div className="col-span-12">
        <RecentUploads files={fileList} />
      </div>
    </div>
  );
}
