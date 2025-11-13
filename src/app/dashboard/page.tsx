import type { Metadata } from "next";
import { Folders } from "@/components/sbmfolders/Folders";
import React from "react";
import MonthlyTarget from "@/components/dashboardItems/Storage";
import RecentUploads from "@/components/dashboardItems/RecentUploads";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { StorageOverviewCard } from "@/components/dashboard/storage-overview-card";
import { StorageByDimensionTable } from "@/components/dashboard/storage-by-dimension-table";

export const metadata = {
    title:
    "eSBMexico Dashboard | MNHS",
  description: "Mexico National High School e-SBM System",
};

export default async function Dashboard() {

      const supabase = await createClient();
    
      const {
        data: { user },
      } = await supabase.auth.getUser();
    
      if (!user) {
        notFound();
      }
  
    const { data: files, error } = await supabase
      .from("files")
      .select(`
        *,
        folder:folder_id ( id, name ),
        dimension:dimension_id ( id, name )
      `)
      .order("created_at", { ascending: false })
      .limit(10);
  
    const fileList = files ?? [];

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* <div className="col-span-12 space-y-6 xl:col-span-12">
        <Folders />
      </div> */}

      {/* <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div> */}

      <div className="col-span-12">
        <StorageOverviewCard />
      </div>

       <div className="col-span-12">
        <StorageByDimensionTable />
      </div>

      <div className="col-span-12">
        <RecentUploads files={fileList}/>
      </div>
    </div>
  );
}
