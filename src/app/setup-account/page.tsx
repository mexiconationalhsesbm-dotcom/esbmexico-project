import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import SetupPasswordPage from "@/components/setup-account/SetupAccount"

export const metadata = {
  title: "eSBMexico Dashboard | MNHS",
  description: "Mexico National High School e-SBM System",
}

export default async function SetupPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("id, status, assigned_dimension_id")
    .eq("id", user.id)
    .single()

  if (adminError || !admin) redirect("/login")
  if (admin.status !== "asfsas") redirect("/dashboard")

  // ✅ Normalize email to null instead of undefined
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-6">
      <SetupPasswordPage
        user={{ id: user.id, email: user.email ?? null }}
        admin={admin}
      />
    </div>
  )
}
