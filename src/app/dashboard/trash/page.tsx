import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { Metadata } from "next";
import { createClient as createServerClient } from "@/utils/supabase/server"
import { createClient } from "@/utils/supabase/server";
import { TrashClient } from "@/components/dashboard/trash-client"
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";


export const metadata: Metadata = {
  title: "eSBMexico Recently Deleted | MNHS",
  description: "This is eSBMexico",
};

export default async function TrashPage() {
  // Get the current user's dimension

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Get admin info to find dimension
  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("assigned_dimension_id")
    .eq("id", user.id)
    .single()

  if (adminError || !admin) {
    redirect("/login")
  }

  return (
    <div>
      <div className="space-y-6 mt-8">
        <ComponentCard title="Recently Deleted">
          <TrashClient dimensionId={admin.assigned_dimension_id} />
        </ComponentCard>
      </div>
    </div>
  )
}
