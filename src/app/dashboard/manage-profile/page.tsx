import React from "react"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import UserMetaCard from "@/components/user-profile/UserMetaCard"
import UserInfoCard from "@/components/user-profile/UserInfoCard"
import UserAddressCard from "@/components/user-profile/UserAddressCard"
import ManageProfile from "@/components/dashboard/ManageProfile"

export const metadata = {
  title: "eSBMexico User Profile | MNHS",
  description: "Manage your personal information and security settings.",
}

export default async function Profile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data: adminData } = await supabase
    .from("admins")
    .select(`
      *,
      roles:role_id (role_id, role),
      dimensions:assigned_dimension_id (id, name)
    `)
    .eq("id", user.id)
    .maybeSingle()

  const { data: teacherData } = await supabase
    .from("teachers")
    .select("*")
    .eq("account_id", user.id)
    .maybeSingle()

  const profileData = {
    ...user,
    ...(adminData || {}),
    ...(teacherData || {}),
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/5">
      <ManageProfile user={user} profile={profileData} />
    </div>
  )
}
