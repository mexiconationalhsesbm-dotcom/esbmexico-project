"use client";
import React, { useState, useRef } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useAlert } from "@/context/AlertContext";

interface UserMetaCardProps {
  profile: any;
}

export default function UserMetaCard({ profile }: UserMetaCardProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {showAlert} = useAlert();

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // 👈 controls enlarged preview modal

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSave = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("accountId", profile.account_id);

    try {
      const response = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        showAlert({
        type: "success",
        title: "Update Success",
        message: "Profile picture updated!",
      });
        closeModal();
      } else {
        showAlert({
        type: "error",
        title: "Update Failed",
        message: "Profile picture failed to update!",
      });
        
      }
    } catch (error: any) {
      console.error("Error uploading:", error);
      alert("An unexpected error occurred while uploading.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="relative w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <Image
                width={80}
                height={80}
                src={profile.profile_url || "/images/icons/admin_profile.svg"}
                alt="user"
                className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition"
                onClick={() => {
                  if (profile.profile_url) setIsPreviewOpen(true);
                }}
              />
            </div>

            <div>
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {profile.full_name || "Unnamed User"}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile.roles?.role || "N/A"}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile.dimensions?.name || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Change Picture Button */}
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.25 1.5a.75.75 0 0 1 .75.75v5.25h5.25a.75.75 0 0 1 0 1.5H9v5.25a.75.75 0 0 1-1.5 0V9H2.25a.75.75 0 0 1 0-1.5H7.5V2.25a.75.75 0 0 1 .75-.75Z"
                fill="currentColor"
              />
            </svg>
            Change
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[400px] m-4">
        <div className="flex flex-col items-center p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Change Profile Picture
          </h4>

          {/* Preview Circle */}
          <div
            className="relative w-40 h-40 mb-6 overflow-hidden border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => (preview ? setIsPreviewOpen(true) : fileInputRef.current?.click())}
          >
            {preview ? (
              <Image
                src={preview}
                alt="Preview"
                width={160}
                height={160}
                className="object-cover w-full h-full rounded-full"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <p className="text-sm">Choose File</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          <div className="flex gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!file || uploading}>
              {uploading ? "Uploading..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Full Image Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        className="max-w-[90vw] max-h-[90vh] flex justify-center items-center"
      >
        <div className="relative w-full h-full flex justify-center items-center bg-transparent">
          <Image
            src={preview || profile.profile_url || "/images/icons/admin_profile.svg"}
            alt="Full Preview"
            width={600}
            height={600}
            className="object-contain rounded-2xl max-h-[80vh] max-w-[80vw]"
          />
        </div>
      </Modal>
    </>
  );
}
