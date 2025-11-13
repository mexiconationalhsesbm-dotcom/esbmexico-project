import { ArchivedPageClient } from "@/components/dashboard/ArchivedPageClient"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Archived Folders",
  description: "Access and manage archived folders",
}

export default async function ArchivedPage() {
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
    <div className="p-8">
      <ArchivedPageClient admin={user.id} />
    </div>
  )
}
