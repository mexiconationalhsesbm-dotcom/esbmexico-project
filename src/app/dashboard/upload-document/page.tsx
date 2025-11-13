import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import FileUploadForm from "@/components/form/used-forms/UploadForm";
import { Metadata } from "next";
import React from "react";
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
    title: "eSBMexico Upload Document | MNHS",
    description: "Mexico National High School e-SBM System",
};

export default async function UploadDocument() {

  const supabase = await createClient()

  // Get user data
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user role
  const { data: userData } = await supabase.from("admins").select("admin_id, role").eq("admin_id", user?.id).single()

  // Redirect if not master admin or uploader
  if (userData?.role !== "master_admin" && userData?.role !== "uploader") {
    redirect("/dashboard")
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Upload Document" />
      <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/3 xl:px-10 xl:py-12">
        <div className="mx-auto w-full text-center">
          <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            Upload Your Document Here
          </h3>
          <FileUploadForm userId={userData?.admin_id}/>
        </div>
      </div>
    </div>
  );
}
