import ComponentCard from "@/components/common/ComponentCard";
import ManageAnnouncementsDisplay from "@/components/dashboard/announcements-display";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

export const metadata = {
  title: "eSBMexico Manage Dimensions | MNHS",
  description: "Mexico National High School e-SBM System",
};

export default async function ManageAnnouncementsPage() {

 const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

    const { data: admin, error } = await supabase
      .from("admins")
      .select("role_id")
      .eq("id", user.id)
      .single();
  
  if (!admin || ![2, 3].includes(admin.role_id)) {
    notFound()
  }

    return (
    <div>
      <div className="space-y-6 mt-8">
        <ComponentCard title="Manage Announcements">
          <ManageAnnouncementsDisplay />
        </ComponentCard>
      </div>
    </div>
  );
  
}
