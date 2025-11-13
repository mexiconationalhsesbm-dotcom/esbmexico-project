"use server";

import { createAdminClient } from "@/utils/supabase/server-admin";

export async function createUserAdmin(data: {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  role: number;
  assigned_dimension_id: number | null;
}) {
  const supabaseAdmin = createAdminClient();

  // ✅ Create the user directly (no email invite)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true, // immediately mark as verified (since admin-created)
  });

  if (authError) throw new Error(`Auth error: ${authError.message}`);
  if (!authData?.user) throw new Error("Failed to create user.");

  // ✅ Insert into admins table
  const { error: dbError } = await supabaseAdmin.from("admins").insert({
    id: authData.user.id,
    first_name: data.firstName,
    middle_name: data.middleName ?? null,
    last_name: data.lastName,
    full_name: data.fullName,
    email: data.email,
    role_id: data.role,
    assigned_dimension_id: data.assigned_dimension_id,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (dbError) throw new Error(`Database error: ${dbError.message}`);

  return authData.user;
}
