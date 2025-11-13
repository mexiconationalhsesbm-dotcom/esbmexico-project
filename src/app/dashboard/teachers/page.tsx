import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import TeachersTable from "@/components/tables/TeachersTable";

export const metadata = {
  title: "eSBMexico All Accounts | MNHS",
  description: "Mexico National High School e-SBM System",
};

export default async function Teachers() {
  const supabase = await createClient();

  // ✅ Get currently logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  // ✅ Check if user is admin
  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("role_id")
    .eq("id", user.id)
    .single();

  if (adminError || !admin || admin.role_id !== 2) {
    notFound();
  }

  // ✅ Fetch all teachers
  const { data: teachers, error: teachersError } = await supabase
    .from("teachers")
    .select(`
      id,
      account_id,
      teacher_id,
      firstname,
      middlename,
      lastname,
      fullname,
      email,
      profile_url
    `);

  if (teachersError) {
    console.error("Error fetching teachers:", teachersError);
  }

  // ✅ Safely map and handle null fields
  const teachersList =
    teachers?.map((t) => ({
      id: t.id,
      firstname: t.firstname,
      middlename: t.middlename,
      lastname: t.lastname,
      fullname: t.fullname,
      email: t.email,
      teacher_id: t.teacher_id,
      account_id: t.account_id,
      profile_url: t.profile_url
    })) ?? [];

  return (
    <div>
      <PageBreadcrumb pageTitle="Personnel Management" />
      <div className="space-y-6 mt-8">
        <ComponentCard title="Teachers List">
          <TeachersTable data={teachersList} />
        </ComponentCard>
      </div>
    </div>
  );
}
