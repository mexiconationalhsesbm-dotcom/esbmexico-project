import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import AllAccounts from "@/components/tables/AllAccountsTable";
import RevisionsTable from "@/components/dashboard/RevisionsTable";

export const metadata = {
  title: "eSBMexico Revision Requests | MNHS",
  description: "Mexico National High School e-SBM System",
};

export default async function AccountsList() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: admin, error } = await supabase
    .from("admins")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!admin || admin.role_id !== 4) {
    notFound();
  }

  return (
    <div>
      <div className="space-y-6 mt-8">
        <ComponentCard title="Revision Requests">
          <RevisionsTable admin={admin}/>
        </ComponentCard>
      </div>
    </div>
  );
}
