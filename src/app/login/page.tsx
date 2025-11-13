import { Metadata } from "next";
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import SignInForm from "./SignInForm";

export const metadata: Metadata = {
  title: "eSBMexico Login",
  description: "Mexico National High School e-SBM System",
};

export default async function SignIn() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  } 

  return <SignInForm />;
}
