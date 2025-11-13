"use client";

import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { supabase } from "@/libs/supabase";
import { useAlert } from "@/context/AlertContext";
import { createClient } from "@/utils/supabase/client";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  dimensionId: number | null;
  created: string;
  parentFolderId: number | null;
  onSuccess: () => void;
}

export function CreateFolderModal({
  isOpen,
  onClose,
  dimensionId,
  created,
  parentFolderId,
  onSuccess,
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showAlert } = useAlert();
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
        const fetchUser = async () => {
          const { data, error } = await supabase.auth.getUser();
          if (!error && data?.user) setCurrentUser(data.user);
        };
        fetchUser();
      }, [supabase]);
  
      const logSystemActivity = async ({
        userId,
        action,
        entityType,
        status,
        description
      }: {
        userId: string;
        action: string;
        entityType: string;
        status: string;
        description: string;
      }) => {
        try {
          const { error } = await supabase.from("system_logs").insert([
            {
              account_id: userId,
              action,
              entity_type: entityType,
              status,
              description,
            },
          ]);
  
          if (error) throw error;
        } catch (err) {
          console.error("System log insert error:", err);
        }
      };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFolderName("");
      setError(null);
    }
  }, [isOpen]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!folderName.trim()) {
      setError("Please enter a folder name");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const { error: dbError } = await supabase.from("folders").insert({
        name: folderName.trim(),
        dimension_id: dimensionId,
        parent_folder_id: parentFolderId,
        created_by: created,
      });

      if (dbError) throw dbError;

      await logSystemActivity({
        userId: currentUser?.id,
        action: "CREATE_FOLDER",
        entityType: "folder",
        status: "success",
        description: `User created a folder:  ${folderName} in the Dimension: ID(${dimensionId}).`,
      });

      showAlert({
        type: "success",
        title: "Success!",
        message: `Folder ${folderName} created successfully`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error creating folder:", err);
      setError("Failed to create folder. Please try again.");
      await logSystemActivity({
        userId: currentUser?.id,
        action: "CREATE_FOLDER",
        entityType: "folder",
        status: "failed",
        description: `User folder creation failed in the Dimension: ID(${dimensionId}).`,
      });

      showAlert({
        type: "error",
        title: "Failed to create folder",
        message: err,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] max-h-fit m-4">
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        {/* Header */}
        <div className="px-2">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Create New Folder
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Create a new folder in the current location.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleCreateFolder} className="flex flex-col">
          <div className="overflow-y-auto px-2 pb-3 custom-scrollbar">
            <div className="grid grid-cols-1 gap-y-5">
              <div>
                <Label htmlFor="folderName">Folder Name</Label>
                <Input
                  id="folderName"
                  value={folderName}
                  onChange={(e) => {
                    setFolderName(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter folder name"
                  autoFocus
                />
                {error && (
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
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-2 mt-6">
            <div className="flex items-center gap-3 ml-auto">
              <Button size="sm" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Folder"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
