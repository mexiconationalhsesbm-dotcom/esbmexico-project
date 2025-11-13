import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import DimensionsTable from "@/components/tables/DimensionsTable";

export const metadata = {
  title: "eSBMexico Manage Dimensions | MNHS",
  description: "Mexico National High School e-SBM System",
};

export default async function ManageAdmins() {
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
  
    if (!admin || admin.role_id !== 2) {
      notFound();
    }

  const { data: dimensions } = await supabase.from("dimensions").select("id, name, created_at");

  const dimensionList = dimensions ?? [];


  return (
    <div>
      <PageBreadcrumb pageTitle="Manage Dimensions" />
      <div className="space-y-6 mt-8">
        <ComponentCard title="Current Dimensions">
          <DimensionsTable data={dimensionList} />
        </ComponentCard>
      </div>
    </div>
  );
}
