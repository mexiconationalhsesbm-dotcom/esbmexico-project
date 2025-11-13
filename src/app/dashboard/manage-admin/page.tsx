import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AdminsTable from "@/components/tables/AdminsTable";
import OFPTable from "@/components/tables/OFPTable";
import DimensionLeaderTable from "@/components/tables/DLTable";
import DimensionMemberTable from "@/components/tables/DMTable";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

export const metadata = {
  title: "eSBMexico Manage Admins | MNHS",
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

  const { data: admins, error: adminsError } = await supabase
      .from("admins")
      .select(`
        id,
        full_name,
        email,
        assigned_dimension_id,
        role_id,
        status,
        last_active_at
      `)

    const { data: dimensions, error: dimensionsError } = await supabase
    .from("dimensions")
    .select("id, name");

    if (dimensionsError) {
    console.error("Error fetching dimensions:", dimensionsError.message);
  }

    const { data: roles, error: rolesError } = await supabase
    .from("roles")
    .select("role_id, role");

    if (rolesError) {
    console.error("Error fetching dimensions:", rolesError.message);
  }
    
    const adminList =
    admins?.map((a) => {
      const matchedDimension = dimensions?.find(
        (d) => d.id === a.assigned_dimension_id
      );
      const matchedRole = roles?.find(
        (d) => d.role_id === a.role_id
      );

      return {
        id: a.id,
        full_name: a.full_name,
        email: a.email,
        assigned_dimension_id: a.assigned_dimension_id,
        role_id: a.role_id,
        role: matchedRole?.role ?? "User",
        status: a.status,
        last_active_at: a.last_active_at,
        dimension: matchedDimension?.name ?? "—",
      };
    }) ?? [];


  const masterAdmins = adminList.filter((a) => a.role_id === 2);
  const focalPersons = adminList.filter((a) => a.role_id === 3);
  const dimensionLeaders = adminList.filter((a) => a.role_id === 4);
  const dimensionMembers = adminList.filter((a) => a.role_id === 5);

  return (
    <div>
      <PageBreadcrumb pageTitle="Manage Admins" />
      <div className="space-y-6 mt-8">
        <ComponentCard title="Master Admin">
          <AdminsTable data={masterAdmins} />
        </ComponentCard>
        <ComponentCard title="Overall Focal Person">
          <OFPTable data={focalPersons} />
        </ComponentCard>
        <ComponentCard title="Dimension Leader">
          <DimensionLeaderTable data={dimensionLeaders} dimensions={dimensions ?? []} />
        </ComponentCard>
        <ComponentCard title="Dimension Members">
          <DimensionMemberTable data={dimensionMembers} />
        </ComponentCard>
      </div>
    </div>
  );
}
