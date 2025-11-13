"use client";

import React, { useEffect } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";

import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Plus } from "lucide-react";

// ✅ Define schema for each teacher
const teacherSchema = z.object({
  firstname: z.string().trim().min(1, "First name is required."),
  middlename: z.string().optional(),
  lastname: z.string().trim().min(1, "Last name is required."),
  email: z.string().trim().email("Invalid email format."),
  teacher_id: z.string().trim().min(1, "Employee ID is required."),
});

// ✅ Array of teachers schema
const teachersSchema = z.object({
  teachers: z.array(teacherSchema).min(1, "At least one teacher is required."),
});

type TeachersForm = z.infer<typeof teachersSchema>;
type TeacherForm = z.infer<typeof teacherSchema>;

type AddTeacherModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (teachers: (TeacherForm & { fullname: string })[]) => void;
};

export default function AddTeacherModal({
  isOpen,
  onClose,
  onAdd,
}: AddTeacherModalProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TeachersForm>({
    resolver: zodResolver(teachersSchema),
    defaultValues: {
      teachers: [
        {
          firstname: "",
          middlename: "",
          lastname: "",
          email: "",
          teacher_id: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "teachers",
  });

  const onSubmit = (data: TeachersForm) => {
    const formatted = data.teachers.map((t) => ({
      ...t,
      fullname: `${t.firstname} ${
        t.middlename ? t.middlename + " " : ""
      }${t.lastname}`.trim(),
    }));
    onAdd(formatted);
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[900px] m-4">
      <div className="no-scrollbar relative w-full max-w-[900px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Add New Teacher(s)
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Fill in the teacher information below. You can add multiple teachers at once.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="h-[400px] overflow-y-auto px-2 pb-3 custom-scrollbar space-y-6">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 relative"
              >
                {/* 🗑 Remove teacher button */}
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      {...register(`teachers.${index}.firstname`)}
                      placeholder="First name"
                    />
                    {errors.teachers?.[index]?.firstname && (
                      <ErrorBox
                        message={errors.teachers[index]?.firstname?.message}
                      />
                    )}
                  </div>

                  <div>
                    <Label>Middle Name</Label>
                    <Input
                      {...register(`teachers.${index}.middlename`)}
                      placeholder="Middle name"
                    />
                  </div>

                  <div>
                    <Label>Last Name</Label>
                    <Input
                      {...register(`teachers.${index}.lastname`)}
                      placeholder="Last name"
                    />
                    {errors.teachers?.[index]?.lastname && (
                      <ErrorBox
                        message={errors.teachers[index]?.lastname?.message}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label>Email</Label>
                    <Input
                      {...register(`teachers.${index}.email`)}
                      placeholder="Email"
                      type="email"
                    />
                    {errors.teachers?.[index]?.email && (
                      <ErrorBox
                        message={errors.teachers[index]?.email?.message}
                      />
                    )}
                  </div>

                  <div>
                    <Label>Employee ID</Label>
                    <Input
                      {...register(`teachers.${index}.teacher_id`)}
                      placeholder="Employee ID"
                    />
                    {errors.teachers?.[index]?.teacher_id && (
                      <ErrorBox
                        message={errors.teachers[index]?.teacher_id?.message}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* ➕ Add More Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  firstname: "",
                  middlename: "",
                  lastname: "",
                  email: "",
                  teacher_id: "",
                })
              }
              className="w-full flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add Another Teacher
            </Button>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 px-2 mt-6">
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Save Teachers
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// ✅ Beautiful error box (same as your edit modal)
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
