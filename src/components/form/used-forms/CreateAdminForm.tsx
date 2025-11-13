"use client";
import React, { useState } from "react";
import ComponentCard from "../../common/ComponentCard";
import Label from "../Label";
import Select from "../Select";
import Input from "../input/InputField";
import { EnvelopeIcon, UserIcon } from "../../../icons";
import { ChevronDownIcon } from "@/icons";
import Button from "@/components/ui/button/Button";
import { createClient } from "@/utils/supabase/client";
import { useAlert } from "@/context/AlertContext";
import { useForm } from "react-hook-form";
import { Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserAdmin } from "@/libs/actions/createUser";

// ✅ Validation schema
const AdminSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email"),
    role: z.enum(["3", "4", "5"]).refine((val) => !!val, {
  message: "Role is required",
  }),
  assigned: z.string().optional(),
});


type AdminFormValues = z.infer<typeof AdminSchema>;

export default function CreateAdminForm() {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  const roleOptions = [
    { value: "3", label: "Overall Focal Person" },
    { value: "4", label: "Dimension Leader" },
    { value: "5", label: "Dimension Member" },
  ];

  const dimensionOptions = [
    { value: "1", label: "Leadership" },
    { value: "2", label: "Governance" },
    { value: "3", label: "Curriculum and Instructions" },
    { value: "4", label: "Resource Management and Mobilization" },
    { value: "5", label: "Learning Environment" },
    { value: "6", label: "Human Resource and Team Development" },
  ];

  // ✅ React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    control, 
  } = useForm<AdminFormValues>({
    resolver: zodResolver(AdminSchema),
    mode: "onChange",
  });

  const role = watch("role");

  const onSubmit = async (data: AdminFormValues) => {
    setLoading(true);
    const supabase = createClient();
    const assigned_dimension_id = data.assigned ? parseInt(data.assigned) : null;

    // ✅ Build full name: John D. Cruz
    const middleInitial = data.middleName
      ? ` ${data.middleName.charAt(0).toUpperCase()}.`
      : "";
    const fullName = `${data.firstName}${middleInitial} ${data.lastName}`;

    try {
      // ✅ Invite user by email (sends confirmation link)
      const { data: invitedUser, error: inviteError } =
        await supabase.auth.admin.inviteUserByEmail(data.email);

      if (inviteError) {
        showAlert({
          type: "error",
          title: "Error",
          message: inviteError.message,
        });
        return;
      }

      // ✅ Store extra info in "admins" table
      const { error: dbError } = await supabase.from("admins").insert({
        id: invitedUser.user.id,
        first_name: data.firstName,
        middle_name: data.middleName || null,
        last_name: data.lastName,
        full_name: fullName,
        email: data.email,
        role: data.role,
        assigned_dimension_id,
        status: "Pending", // optional tracking
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (dbError) {
        showAlert({
          type: "error",
          title: "Error",
          message: dbError.message,
        });
        return;
      }

      showAlert({
        type: "success",
        title: "Success",
        message: "Invitation sent! User must confirm via email.",
      });

      reset();
    } catch (error) {
      console.error(error);
      showAlert({
        type: "error",
        title: "Error",
        message: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
      <div className="w-full">
        <ComponentCard title="Note: E-mail Confirmation needed.">
          <div className="space-y-6">
            <Label>Account Information</Label>

            {/* First Name */}
            <div className="flex flex-col gap-1">
              <div className="relative">
                <Input
                  placeholder="First Name"
                  {...register("firstName")}
                  className="pl-[62px]"
                />
                <span className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 px-3.5 py-3 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <UserIcon />
                </span>
              </div>
              {errors.firstName && (
                <p className="text-xs text-red-500">{errors.firstName.message}</p>
              )}
            </div>

            {/* Middle Name */}
            <div className="flex flex-col gap-1">
              <div className="relative">
                <Input
                  placeholder="Middle Name"
                  {...register("middleName")}
                  className="pl-[62px]"
                />
                <span className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 px-3.5 py-3 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <UserIcon />
                </span>
              </div>
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-1">
              <div className="relative">
                <Input
                  placeholder="Last Name"
                  {...register("lastName")}
                  className="pl-[62px]"
                />
                <span className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 px-3.5 py-3 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <UserIcon />
                </span>
              </div>
              {errors.lastName && (
                <p className="text-xs text-red-500">{errors.lastName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <div className="relative">
                <Input
                  placeholder="info@gmail.com"
                  type="email"
                  {...register("email")}
                  className="pl-[62px]"
                />
                <span className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 px-3.5 py-3 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <EnvelopeIcon />
                </span>
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

          {/* Role */}
          <div className="flex flex-col gap-1">
            <Label>Select Role Level</Label>
            <div className="relative">
              <Controller
                name="role"
                control={control}
                defaultValue={undefined}
                render={({ field }) => (
                  <Select
                    options={roleOptions}
                    placeholder="Select Option"
                    defaultValue={field.value}
                    onChange={(val: string) => field.onChange(val)}
                    className="dark:bg-dark-900"
                  />
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                <ChevronDownIcon />
              </span>
            </div>
            {errors.role && (
              <p className="text-xs text-red-500">{errors.role.message}</p>
            )}
          </div>

          {/* Dimension (if leader or member) */}
          {(role === "4" || role === "5") && (
            <div className="flex flex-col gap-1">
              <Label>Assign Dimension</Label>
              <div className="relative">
                <Controller
                  name="assigned"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <Select
                      options={dimensionOptions}
                      placeholder="Select Option"
                      defaultValue={field.value} // ✅ use defaultValue
                      onChange={(val: string) => field.onChange(val)}
                      className="dark:bg-dark-900"
                    />
                  )}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                  <ChevronDownIcon />
                </span>
              </div>
            </div>
          )}

          </div>
        </ComponentCard>
      </div>

      <div>
        <Button
          type="submit"
          className="w-full mt-6"
          size="sm"
          
          disabled={loading}
        >
          {loading ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}
