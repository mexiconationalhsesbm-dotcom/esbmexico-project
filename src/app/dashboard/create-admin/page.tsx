import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CreateAdminForm from "@/components/form/used-forms/CreateAdminForm";
import { Metadata } from "next";
import React from "react";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { AccountForm } from "@/components/dashboard/account-form";

export const metadata: Metadata = {
    title: "eSBMexico Create Admin | MNHS",
    description: "Mexico National High School e-SBM System",
};

export default async function CreateAdmin() {

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
  
    if (!admin || admin.role_id !== 2) {
      notFound();
    }

  const { data: teachers } = await supabase.from("teachers").select("*").order("lastname", { ascending: true })

  const { data: dimensions } = await supabase.from("dimensions").select("*").order("name", { ascending: true })

  const { data: admins } = await supabase.from("admins").select("*").order("name", { ascending: true }) 

  return (
    <div>
      <PageBreadcrumb pageTitle="Create Account" />
      <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/3 xl:px-10 xl:py-12">
        <div className="mx-auto w-full text-center">
          <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            Create New Account
          </h3>
          <AccountForm
          teachers={teachers ?? []}
          dimensions={dimensions ?? []}
          accounts={admins ?? []}
        />
        </div>
      </div>
    </div>
  );
}
