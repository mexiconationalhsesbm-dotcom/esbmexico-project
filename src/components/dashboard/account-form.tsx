"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Button2 from "@/components/ui/button/Button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Select from "../form/Select";
import { Info } from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import { createClient } from "@/utils/supabase/client";
import { createUserAdmin } from "@/libs/actions/createUser"; // ✅ server action

interface AccountFormProps {
  teachers: any[];
  dimensions: any[];
  accounts: any[];
}

// ✅ Define roles as number→label mapping
const ROLES = [
  { id: 3, label: "Overall Focal Person" },
  { id: 4, label: "Dimension Leader" },
  { id: 5, label: "Dimension Member" },
];

export function AccountForm({ teachers, dimensions, accounts }: AccountFormProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [role, setRole] = useState<number>(4); // default: Dimension Member
  const [dimensionId, setDimensionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { showAlert } = useAlert();
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) setCurrentUser(data.user);
    };
    fetchUser();
  }, [supabase]);

  const logSystemActivity = async ({
    action,
    entityType,
    status,
    description,
  }: {
    action: string;
    entityType: string;
    status: string;
    description: string;
  }) => {
    try {
      const { error } = await supabase.from("system_logs").insert([
        {
          account_id: currentUser?.id || null,
          action,
          entity_type: entityType,
          status,
          description,
        },
      ]);

      if (error) throw error;
    } catch (err) {
      console.error("System Log Error:", err);
    }
  };

  const teachersWithoutAccounts = teachers.filter((t) => !t.account_id);
  const selectedTeacher = teachersWithoutAccounts.find(
    (t) => t.teacher_id === selectedTeacherId
  );

  const requiresDimension = role === 4 || role === 5;

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    if (!selectedTeacher) throw new Error("Please select a teacher");
    if (requiresDimension && !dimensionId)
      throw new Error("Please select a dimension for this role.");

    const role_id = role;
    const assigned_dimension_id = requiresDimension ? Number(dimensionId) : null;

    // 🚨 Check if assigning as Dimension Leader (role_id = 4)
    if (role_id === 4 && assigned_dimension_id) {
      const { data: existingLeaders, error: checkError } = await supabase
        .from("admins")
        .select("id, full_name")
        .eq("role_id", 4)
        .eq("assigned_dimension_id", assigned_dimension_id);

      if (checkError) {
        console.error("Error checking leaders:", checkError.message);
        throw new Error("Failed to validate dimension leader constraint.");
      }

      if (existingLeaders && existingLeaders.length > 0) {
        await logSystemActivity({
            action: "CREATE_ACCOUNT",
            entityType: "admin",
            status: "failed",
            description: `Leader exists: ${existingLeaders[0].full_name}`,
          });

        showAlert({
          type: "error",
          title: "Leader Exists",
          message: `This dimension already has a leader (${existingLeaders[0].full_name}). Only one leader per dimension is allowed.`,
        });
        setIsLoading(false);
        return;
      }
    }

    const tempPassword = `${selectedTeacher.teacher_id}esbm`;
    const fullName = `${selectedTeacher.firstname} ${
      selectedTeacher.middlename ?? ""
    } ${selectedTeacher.lastname}`.trim();

    // ✅ Create the Supabase Auth user + insert into admins
    const createdUser = await createUserAdmin({
      email: selectedTeacher.email,
      password: tempPassword,
      firstName: selectedTeacher.firstname,
      middleName: selectedTeacher.middlename,
      lastName: selectedTeacher.lastname,
      fullName,
      role: role_id, // direct numeric role_id
      assigned_dimension_id,
    });

    // ✅ Update teacher to link their account_id
    const { error: updateError } = await supabase
      .from("teachers")
      .update({ account_id: createdUser.id })
      .eq("teacher_id", selectedTeacher.teacher_id);

    if (updateError) throw new Error(updateError.message);
    
    await logSystemActivity({
        action: "CREATE_ACCOUNT",
        entityType: "admin",
        status: "success",
        description: `Created account for teacher: ${fullName}`,
      });

    showAlert({
      type: "success",
      title: "Account Created",
      message: `${fullName} has been successfully added as an admin.`,
    });

    router.refresh();
  } catch (error: unknown) {
    showAlert({
      type: "error",
      title: "Error",
      message:
        error instanceof Error ? error.message : "Unexpected error occurred.",
    });
  } finally {
    setIsLoading(false);
  }
};


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Teacher selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-black dark:text-white">Select Teacher</CardTitle>
          <CardDescription className="text-black dark:text-white">
            Choose a teacher without an existing account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teacher" className="text-black dark:text-white">Teacher</Label>
            <Select
              options={teachersWithoutAccounts.map((teacher) => ({
                value: teacher.teacher_id,
                label: `${teacher.teacher_id} - ${teacher.firstname} ${teacher.lastname} (${teacher.email})`,
              }))}
              placeholder="Select a teacher"
              onChange={setSelectedTeacherId}
              defaultValue={selectedTeacherId}
            />
          </div>

          {selectedTeacher && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>
                  Creating account for{" "}
                  <strong>
                    {selectedTeacher.firstname} {selectedTeacher.lastname}
                  </strong>{" "}
                  ({selectedTeacher.email})
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-black dark:text-white">Role & Permissions</CardTitle>
          <CardDescription className="text-black dark:text-white">Assign role and dimension access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role" className="text-black dark:text-white">Role</Label>
            <Select
              options={ROLES.map((r) => ({ value: r.id.toString(), label: r.label }))}
              placeholder="Select a role"
              onChange={(val) => setRole(Number(val))}
              defaultValue={role.toString()}
            />
          </div>

          {requiresDimension && (
            <Select
              options={dimensions.map((d) => ({
                value: d.id.toString(),
                label: d.name,
              }))}
              placeholder="Select a dimension"
              onChange={setDimensionId}
              defaultValue={dimensionId || ""}
          />
          )}

        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button2 type="submit" disabled={isLoading || !selectedTeacherId || ((role === 4 || role === 5) && !dimensionId)}>
          {isLoading ? "Creating..." : "Create Account"}
        </Button2>
      </div>
    </form>
  );
}
