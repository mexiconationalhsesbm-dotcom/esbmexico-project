import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import AccountsRolesTable from "@/components/tables/AccountsRoles";

export const metadata = {
  title: "eSBMexico All Accounts | MNHS",
  description: "Mexico National High School e-SBM System",
};

export default async function AccountsRoles() {
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
    .neq("role_id", 2);

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

  return (
    <div>
      <PageBreadcrumb pageTitle="Personnel Management" />
      <div className="space-y-6 mt-8">
        <ComponentCard title="All Accounts">
          <AccountsRolesTable data={adminList} dimensions={dimensions ?? []} />
        </ComponentCard>
      </div>
    </div>
  );
}
