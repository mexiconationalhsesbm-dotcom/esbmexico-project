import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import SystemLogsTable from "@/components/tables/SystemLogsTable"; // ✅ Import your table

export const metadata = {
  title: "eSBMexico System Logs | MNHS",
  description: "Mexico National High School e-SBM System",
};

export default async function SystemLogs() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: admin } = await supabase
    .from("admins")
    .select("role_id")
    .eq("id", user.id)
    .single();

  if (!admin || ![2, 3].includes(admin.role_id)) {
    notFound()
  }

  // ✅ Fetch logs from the Supabase function
  const { data: logs, error } = await supabase.rpc("get_system_logs_detailed", {});

  if (error) {
    console.error("Error fetching logs:", JSON.stringify(error, null, 2));
  }

  return (
    <div>
      <div className="space-y-6 mt-8">
        <ComponentCard title="System Logs">
          <SystemLogsTable logs={logs || []} />
        </ComponentCard>
      </div>
    </div>
  );
}
