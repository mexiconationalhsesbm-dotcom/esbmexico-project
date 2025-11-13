"use client";
import React, { useState, useEffect } from "react";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { ChevronDownIcon } from "@/icons";
import Select from "../form/Select";
import { createClient } from "@/utils/supabase/client";
import { useAlert } from "@/context/AlertContext";
import Image from "next/image";

type Admin = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  role_id: number | null;
  assigned_dimension_id: number | null;
};

interface EditAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: Admin | null;
  onSave: (updatedAdmin: Admin) => void;
  dimensions: { id: number; name: string }[];
}

const roleOptions = [
  { value: "3", label: "Overall Focal Person" },
  { value: "4", label: "Dimension Leader" },
  { value: "5", label: "Dimension Member" },
];

export default function EditAdminModal({
  isOpen,
  onClose,
  admin,
  onSave,
  dimensions,
}: EditAdminModalProps) {
  const { showAlert } = useAlert();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [assignedDimension, setAssignedDimension] = useState<number | null>(null);

  // ✅ Load admin data when modal opens
  useEffect(() => {
    if (admin && isOpen) {
      setName(admin.full_name ?? "");
      setEmail(admin.email ?? "");
      setRole(admin.role_id ? admin.role_id.toString() : "");
      setAssignedDimension(admin.assigned_dimension_id);
    }
  }, [admin, isOpen]);

  const isFormValid = name.trim() && email.trim() && role;

  const requiresDimension = role === "4" || role === "5"; // only for leader/member

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !admin) return;

    const role_id = parseInt(role);
    let dimensionToSave: number | null = assignedDimension;

    // 🚫 If Overall Focal Person → clear dimension_id
    if (role_id === 3) {
      dimensionToSave = null;
    }

    // 🚨 Dimension Leader uniqueness check
    if (role_id === 4 && dimensionToSave) {
      const { data: existingLeaders, error: checkError } = await supabase
        .from("admins")
        .select("id, full_name")
        .eq("role_id", 4)
        .eq("assigned_dimension_id", dimensionToSave)
        .neq("id", admin.id);

      if (checkError) {
        showAlert({
          type: "error",
          title: "Database Error",
          message: "Failed to check dimension leader constraint.",
        });
        return;
      }

      if (existingLeaders?.length > 0) {
        showAlert({
          type: "error",
          title: "Leader Exists",
          message: `This dimension already has a leader (${existingLeaders[0].full_name}).`,
        });
        return;
      }
    }

    // ✅ Proceed with update
    const { error } = await supabase
      .from("admins")
      .update({
        full_name: name,
        role_id,
        assigned_dimension_id: dimensionToSave,
      })
      .eq("id", admin.id);

    if (error) {
      showAlert({
        type: "error",
        title: "Update Failed",
        message: error.message,
      });
      return;
    }

    onSave({
      ...admin,
      full_name: name,
      role_id,
      assigned_dimension_id: dimensionToSave,
    });

    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-999999 flex items-center justify-center transition-opacity ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white dark:bg-dark-900 rounded-2xl shadow-lg max-w-5xl w-full p-12 z-10 transition-transform duration-200"
      >
        {admin ? (
          <>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
              Edit Account Information
            </h3>

            <div className="flex items-center mb-6 gap-4">
              <Image
              width={20}
              height={20}
                src="/images/icons/admin_profile.svg"
                alt="profile"
                className="w-20 h-20 rounded-full"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {admin.full_name}
                </h3>
                <p className="text-sm text-gray-500">{admin.email}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} disabled />
              </div>

              <div>
                <Label>Role Level</Label>
                <div className="relative">
                  <Select
                    key={admin.id}
                    options={roleOptions}
                    placeholder="Select Role"
                    onChange={(v) => setRole(v)}
                    defaultValue={role}
                    className="dark:bg-dark-900"
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <ChevronDownIcon />
                  </span>
                </div>
              </div>

              {/* ✅ Only show dimension field if role requires it */}
              {requiresDimension && (
                <div>
                  <Label>Assigned Dimension</Label>
                  <div className="relative">
                    <Select
                      options={dimensions.map((d) => ({
                        value: d.id.toString(),
                        label: d.name,
                      }))}
                      placeholder="Select Dimension"
                      onChange={(v) =>
                        setAssignedDimension(v ? parseInt(v) : null)
                      }
                      defaultValue={assignedDimension?.toString() || ""}
                      className="dark:bg-dark-900"
                    />
                    <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                      <ChevronDownIcon />
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !isFormValid ||
                  (requiresDimension && assignedDimension === null)
                }
              >
                Save
              </Button>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center">Loading admin data...</p>
        )}
      </form>
    </div>
  );
}