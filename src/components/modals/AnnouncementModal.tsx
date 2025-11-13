"use client";
import React, { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { useAlert } from "@/context/AlertContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextInput from "../form/input/TextInput";

// ✅ Zod Schema
const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  content: z.string().trim().min(1, "Content is required."),
  visibility: z.enum(["all", "leaders"]),
});

type AnnouncementForm = z.infer<typeof announcementSchema>;

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  mode: "create" | "edit";
  onSave: () => void;
}

export default function AnnouncementModal({
  isOpen,
  onClose,
  initialData,
  mode,
  onSave,
}: AnnouncementModalProps) {
  const { showAlert } = useAlert();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
      visibility: "all",
    },
  });

  // ✅ Load initial data on open
  useEffect(() => {
    if (mode === "edit" && initialData) {
      reset({
        title: initialData.title,
        content: initialData.content,
        visibility: initialData.visibility,
      });
    } else {
      reset({
        title: "",
        content: "",
        visibility: "all",
      });
    }
  }, [isOpen, initialData, mode, reset]);

  // ✅ Handle form submit
  const submitHandler = async (data: AnnouncementForm) => {
    setSaving(true);

    try {
      const endpoint =
        mode === "create"
          ? "/api/announcements/create"
          : `/api/announcements/${initialData.id}`;

      const res = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        showAlert({
          type: "error",
          title: "Error",
          message: json?.error || "Something went wrong.",
        });
        return;
      }

      showAlert({
        type: "success",
        title: "Success",
        message:
          mode === "create"
            ? "Announcement Created Successfully."
            : "Announcement Updated Successfully.",
      });

      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      showAlert({
        type: "error",
        title: "Error",
        message: "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] m-4">
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {mode === "create" ? "Create Announcement" : "Edit Announcement"}
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            {mode === "create"
              ? "Fill out the fields to create a new announcement."
              : "Update the announcement details below."}
          </p>
        </div>

        {/* ✅ Form */}
        <form onSubmit={handleSubmit(submitHandler)} className="flex flex-col">
          <div className="custom-scrollbar h-[350px] overflow-y-auto px-2 pb-3">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5">
              {/* Title */}
              <div>
                <Label>Title</Label>
                <Input
                  {...register("title")}
                  placeholder="Enter announcement title..."
                />
                {errors.title && (
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
                    <span>{errors.title.message}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <Label>Content</Label>
                <TextInput
                  {...register("content")}
                  rows={5}
                  placeholder="Enter announcement details..."
                  error={!!errors.content}
                />
                {errors.content && (
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
                    <span>{errors.content.message}</span>
                  </div>
                )}
              </div>

              {/* Visibility */}
              <div>
                <Label>Visibility</Label>
                <Select
                  onValueChange={(val) =>
                    setValue("visibility", val as "all" | "leaders")
                  }
                  value={watch("visibility")}
                >

                  <SelectTrigger className="w-full text-black dark:text-white">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-dark text-black dark:text-white">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="leaders">Leaders</SelectItem>
                  </SelectContent>
                </Select>
                {errors.visibility && (
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
                    <span>{errors.visibility.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between gap-3 px-2 mt-6">

            <div className="flex items-center gap-3 ml-auto">
              <Button size="sm" variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button size="sm" type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : mode === "create"
                  ? "Create"
                  : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
