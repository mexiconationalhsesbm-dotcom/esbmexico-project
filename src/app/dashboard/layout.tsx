import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import SidebarWrapper from "@/layout/SidebarWrapper"
import { DownloadProvider } from "@/context/downlod-context"
import { DownloadManager } from "@/components/dashboard/download-manager"
import { MoveCopyProvider } from "@/context/move-copy-context"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // ✅ 1️⃣ Get current logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/api/logout")
  }

  // ✅ 2️⃣ Fetch admin data (include role_id and assigned_dimension_id)
  const { data: adminData, error: adminError } = await supabase
    .from("admins")
    .select("id, email, role_id, assigned_dimension_id")
    .eq("id", user.id)
    .single()

  if (adminError || !adminData) {
    console.error("Error fetching admin data:", adminError?.message)
    redirect("/login")
  }

  // ✅ 3️⃣ Fetch teacher record (via account_id = admin.id)
  const { data: teacherData, error: teacherError } = await supabase
    .from("teachers")
    .select("teacher_id, fullname, email, profile_url")
    .eq("account_id", adminData.id)
    .single()

  if (teacherError) {
    console.warn("No teacher record found for this admin:", teacherError.message)
  }

  // ✅ 4️⃣ Fetch role from roles table (via role_id)
  let roleData = null
  if (adminData.role_id) {
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("role_id, role")
      .eq("role_id", adminData.role_id)
      .single()

    if (roleError) {
      console.warn("No role found for this admin:", roleError.message)
    } else {
      roleData = role
    }
  }

  // ✅ 5️⃣ Fetch assigned dimension (via assigned_dimension_id)
  let dimensionData = null
  if (adminData.assigned_dimension_id) {
    const { data: dimension, error: dimensionError } = await supabase
      .from("dimensions")
      .select("id, name, slug")
      .eq("id", adminData.assigned_dimension_id)
      .single()

    if (dimensionError) {
      console.warn("No dimension found for this admin:", dimensionError.message)
    } else {
      dimensionData = dimension
    }
  }

  // ✅ 6️⃣ Merge all user info
  const userData = {
    ...adminData,
    role: roleData
      ? {
          role_id: roleData.role_id,
          role: roleData.role,
        }
      : null,
    teacher: teacherData
      ? {
          teacher_id: teacherData.teacher_id,
          fullname: teacherData.fullname,
          email: teacherData.email,
          profile_url: teacherData.profile_url,
        }
      : null,
    dimension: dimensionData
      ? {
          id: dimensionData.id,
          name: dimensionData.name,
          slug: dimensionData.slug,
        }
      : null,
  }

  return (
    <div className="min-h-screen xl:flex">
      <DownloadProvider>
        <MoveCopyProvider>
          <SidebarWrapper user={userData}>{children}</SidebarWrapper>
          <DownloadManager />
        </MoveCopyProvider>
      </DownloadProvider>
    </div>
  )
}
