"use client";
import React, { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { useAlert } from "@/context/AlertContext";

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: "folder" | "file";
  itemId: number;
  currentName: string;
  onSuccess: () => void;
}

export default function RenameModal({
  isOpen,
  onClose,
  itemType,
  itemId,
  currentName,
  onSuccess,
}: RenameModalProps) {
  const [name, setName] = useState("");
  const [extension, setExtension] = useState(""); // ✅ hold file extension
  const [isRenaming, setIsRenaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showAlert } = useAlert();

  // ✅ When modal opens, extract file extension if applicable
  useEffect(() => {
    if (isOpen) {
      if (itemType === "file") {
        const dotIndex = currentName.lastIndexOf(".");
        if (dotIndex !== -1) {
          setName(currentName.substring(0, dotIndex)); // base name only
          setExtension(currentName.substring(dotIndex)); // e.g. ".docx"
        } else {
          setName(currentName);
          setExtension("");
        }
      } else {
        setName(currentName);
        setExtension("");
      }
      setError(null);
    }
  }, [isOpen, currentName, itemType]);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(`Please enter a ${itemType} name`);
      return;
    }

    setIsRenaming(true);
    setError(null);

    try {
      const finalName =
        itemType === "file" ? `${name.trim()}${extension}` : name.trim();

      const response = await fetch(`/api/${itemType}s/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, name: finalName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to rename ${itemType}`);
      }

      onSuccess();
      showAlert({
        type: "success",
        title: `${itemType} successfully renamed.`,
        message: `${itemType} ${finalName} successfully renamed.`,
      });
      onClose();
    } catch (err: any) {
      console.error(`Error renaming ${itemType}:`, err);
      setError(`Failed to rename ${itemType}: ${err.message}`);
      showAlert({
        type: "error",
        title: `${itemType} rename failed.`,
        message: `Failed to rename ${itemType}: ${err.message}`,
      });
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] max-h-fit m-4">
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Rename {itemType}
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Enter a new name for this {itemType}.
          </p>
        </div>

        {/* ✅ Form */}
        <form onSubmit={handleRename} className="flex flex-col">
          <div className="overflow-y-auto px-2 pb-3 custom-scrollbar">
            <div className="grid grid-cols-1 gap-y-5">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder={`Enter ${itemType} name`}
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

          {/* Footer Buttons */}
          <div className="flex items-center justify-between gap-3 px-2 mt-6">
            <div className="flex items-center gap-3 ml-auto">
              <Button size="sm" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={isRenaming}>
                {isRenaming ? "Renaming..." : "Rename"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
