import ComponentCard from "@/components/common/ComponentCard";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import TaskBoard from "@/components/dashboard/TasksBoard";

export const metadata = {
  title: "eSBMexico TaskBoard | MNHS",
  description: "Mexico National High School e-SBM System",
};

export default async function TaskBoardPage() {
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

  if (!admin || ![2, 3, 4].includes(admin.role_id)) {
    notFound()
  }

  return (
    <div>
      <div className="space-y-6 mt-2">
        <ComponentCard title="Task Management Board">
          <TaskBoard/>
        </ComponentCard>
      </div>
    </div>
  );
}
