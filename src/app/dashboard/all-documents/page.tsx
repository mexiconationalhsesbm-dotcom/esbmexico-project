// app/(dashboard)/all-documents/page.tsx
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AllDocumentsTable from "@/components/tables/AllDocumentsTable";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

export const metadata = {
  title: "eSBMexico All Documents | MNHS",
  description: "Mexico National High School e-SBM System",
};

export default async function AllDocuments({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; query?: string }>;
}) {
  const { page, query } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  // ✅ Get the admin info of the logged-in user
  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("role_id, assigned_dimension_id")
    .eq("id", user.id)
    .single();

  if (adminError || !admin) notFound();

  const { role_id, assigned_dimension_id } = admin;

  // Pagination setup
  const currentPage = Number(page) || 1;
  const limit = 10;
  const from = (currentPage - 1) * limit;
  const to = from + limit - 1;

  const searchTerm = query?.trim() ?? "";

  // ✅ Build the base query
  let queryBuilder = supabase
    .from("files")
    .select(
      `
      *,
      folder:folder_id ( id, name ),
      dimension:dimension_id ( id, name, slug )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (role_id === 4 || role_id === 5) {
    queryBuilder = queryBuilder.eq("dimension_id", assigned_dimension_id);
  }

  if (searchTerm) {
    queryBuilder = queryBuilder.ilike("name", `%${searchTerm}%`);
  }

  const { data: files, count, error } = await queryBuilder.range(from, to);

  if (error) console.error("Error fetching files:", error);

  const fileList = files ?? [];
  const totalFiles = count || 0;
  const totalPages = Math.ceil(totalFiles / limit);

  return (
    <div>
      <PageBreadcrumb pageTitle="All Documents" />
      <div className="space-y-6 mt-8">
        <ComponentCard title="All Documents">
          <AllDocumentsTable
            files={fileList}
            currentPage={currentPage}
            totalPages={totalPages}
            searchQuery={searchTerm}
          />
        </ComponentCard>
      </div>
    </div>
  );
}

