"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { Loader2 } from "lucide-react";
import { useAlert } from "@/context/AlertContext";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: "folder" | "file";
  itemId: number;
  itemName: string;
  nestedCounts?: {
    folders: number;
    files: number;
  };
  onSuccess: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  itemType,
  itemId,
  itemName,
  nestedCounts,
  onSuccess,
}: DeleteConfirmationModalProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {showAlert} = useAlert();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/${itemType}s/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: itemId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to delete ${itemType}`);
      }

      showAlert({
        type: "success",
        title: `${itemType} successfully deleted.`,
        message: `${itemType} successfully deleted.`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(`Error deleting ${itemType}:`, err);
      setError(`Failed to delete ${itemType}: ${err.message}`);
      showAlert({
        type: "error",
        title: `Failed to delete.`,
        message: `Failed to delete ${itemType}: ${err.message}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Description builder
  let description = `Are you sure you want to delete this ${itemType}?`;
  if (itemType === "folder" && nestedCounts) {
    const { folders, files } = nestedCounts;
    const folderText = folders === 1 ? "folder" : "folders";
    const fileText = files === 1 ? "file" : "files";

    if (folders > 0 || files > 0) {
      description = `This folder contains ${folders} ${folderText} and ${files} ${fileText} that will also be deleted. Are you sure you want to proceed?`;
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] m-4">
      <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
                      <div className="relative flex items-center justify-center z-1 mb-7">
                <svg
                  className="fill-error-50 dark:fill-error-500/15"
                  width="90"
                  height="90"
                  viewBox="0 0 90 90"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M34.364 6.85053C38.6205 -2.28351 51.3795 -2.28351 55.636 6.85053C58.0129 11.951 63.5594 14.6722 68.9556 13.3853C78.6192 11.0807 86.5743 21.2433 82.2185 30.3287C79.7862 35.402 81.1561 41.5165 85.5082 45.0122C93.3019 51.2725 90.4628 63.9451 80.7747 66.1403C75.3648 67.3661 71.5265 72.2695 71.5572 77.9156C71.6123 88.0265 60.1169 93.6664 52.3918 87.3184C48.0781 83.7737 41.9219 83.7737 37.6082 87.3184C29.8831 93.6664 18.3877 88.0266 18.4428 77.9156C18.4735 72.2695 14.6352 67.3661 9.22531 66.1403C-0.462787 63.9451 -3.30193 51.2725 4.49185 45.0122C8.84391 41.5165 10.2138 35.402 7.78151 30.3287C3.42572 21.2433 11.3808 11.0807 21.0444 13.3853C26.4406 14.6722 31.9871 11.951 34.364 6.85053Z"
                    fill=""
                    fillOpacity=""
                  />
                </svg>
    
                <span className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
                  <svg
                    className="fill-error-600 dark:fill-error-500"
                    width="38"
                    height="38"
                    viewBox="0 0 38 38"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M9.62684 11.7496C9.04105 11.1638 9.04105 10.2141 9.62684 9.6283C10.2126 9.04252 11.1624 9.04252 11.7482 9.6283L18.9985 16.8786L26.2485 9.62851C26.8343 9.04273 27.7841 9.04273 28.3699 9.62851C28.9556 10.2143 28.9556 11.164 28.3699 11.7498L21.1198 18.9999L28.3699 26.25C28.9556 26.8358 28.9556 27.7855 28.3699 28.3713C27.7841 28.9571 26.8343 28.9571 26.2485 28.3713L18.9985 21.1212L11.7482 28.3715C11.1624 28.9573 10.2126 28.9573 9.62684 28.3715C9.04105 27.7857 9.04105 26.836 9.62684 26.2502L16.8771 18.9999L9.62684 11.7496Z"
                      fill=""
                    />
                  </svg>
                </span>
              </div>
        {/* Header */}
        <div className="px-2">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            DELETE {itemType}
          </h4>
          <p className="mb-4 text-md text-gray-500 dark:text-gray-600">
            {itemName}
          </p>
        </div>

        {/* Description */}
        <div className="px-2 text-gray-700 dark:text-gray-300 text-md leading-relaxed">
          {description}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 mx-2 flex items-start space-x-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
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

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 mt-8 px-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
