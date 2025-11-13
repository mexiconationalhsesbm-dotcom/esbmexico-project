"use client";
import React, { useEffect } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// ✅ Zod Schema
const teacherSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required."),
  middle_name: z.string().optional(),
  last_name: z.string().trim().min(1, "Last name is required."),
  email: z.string().email("Invalid email format."),
  teacher_id: z.string().trim().min(1, "Employee ID is required."),
});

type TeacherForm = z.infer<typeof teacherSchema>;

interface EditTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: any | null;
  onSave: (updatedTeacher: TeacherForm & { id: string | number }) => void;
}

export default function EditTeacherModal({
  isOpen,
  onClose,
  teacher,
  onSave,
}: EditTeacherModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeacherForm>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      first_name: "",
      middle_name: "",
      last_name: "",
      email: "",
      teacher_id: "",
    },
  });

  // ✅ Load teacher data on open
  useEffect(() => {
    if (teacher) {
      reset({
        first_name: teacher.firstname || "",
        middle_name: teacher.middlename || "",
        last_name: teacher.lastname || "",
        email: teacher.email || "",
        teacher_id: teacher.teacher_id || "",
      });
    }
  }, [teacher, reset]);

  const submitHandler = (data: TeacherForm) => {
      onSave({ ...data, id: teacher?.id });
      onClose();
    };


  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] m-4">
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Edit Teacher
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Update the teacher information below.
          </p>
        </div>

        {/* ✅ Form */}
        <form onSubmit={handleSubmit(submitHandler)} className="flex flex-col">
          <div className="h-[350px] overflow-y-auto px-2 pb-3 custom-scrollbar">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5">

              {/* First name */}
              <div>
                <Label>First Name</Label>
                <Input {...register("first_name")} placeholder="First name" />
                {errors.first_name && (
                  <ErrorBox message={errors.first_name.message} />
                )}
              </div>

              {/* Middle name */}
              <div>
                <Label>Middle Name</Label>
                <Input {...register("middle_name")} placeholder="Middle name" />
              </div>

              {/* Last name */}
              <div>
                <Label>Last Name</Label>
                <Input {...register("last_name")} placeholder="Last name" />
                {errors.last_name && (
                  <ErrorBox message={errors.last_name.message} />
                )}
              </div>

              {/* Email */}
              <div>
                <Label>Email</Label>
                <Input
                  {...register("email")}
                  placeholder="Email"
                  type="email"
                />
                {errors.email && <ErrorBox message={errors.email.message} />}
              </div>

              {/* Teacher ID */}
              <div>
                <Label>Employee ID</Label>
                <Input
                  {...register("teacher_id")}
                  placeholder="Employee ID"
                />
                {errors.teacher_id && (
                  <ErrorBox message={errors.teacher_id.message} />
                )}
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between gap-3 px-2 mt-6">
            <div className="flex items-center gap-3 ml-auto">
              <Button size="sm" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" type="submit">
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// ✅ Beautiful error box component (same as your announcement modal)
function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="mt-2 flex items-start space-x-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L4.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}
