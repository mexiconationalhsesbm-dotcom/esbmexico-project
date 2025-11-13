"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, XCircle, CheckCircle } from "lucide-react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import { Progress } from "../ui/progress";
import { createClient } from "@/utils/supabase/client";

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  dimensionId: number | null;
  currentFolderId: number | null;
  onSuccess: () => void;
}

interface FileUploadStatus {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export function UploadFileModal({
  isOpen,
  onClose,
  dimensionId,
  currentFolderId,
  onSuccess,
}: UploadFileModalProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileUploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles(
        selected.map((file) => ({
          file,
          progress: 0,
          status: "pending" as const,
        }))
      );
    }
  };

  const resetForm = () => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    setIsUploading(true);

    const uploads = files.map((fileStatus, index) => {
      return new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        formData.append("file", fileStatus.file);
        if (dimensionId !== null)
          formData.append("dimensionId", dimensionId.toString());
        if (currentFolderId !== null)
          formData.append("folderId", currentFolderId.toString());

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setFiles((prev) => {
              const updated = [...prev];
              updated[index].progress = percent;
              return updated;
            });
          }
        };

        xhr.onload = async () => {
        const isSuccess = xhr.status >= 200 && xhr.status < 300;

        setFiles((prev) => {
          const updated = [...prev];
          updated[index].status = isSuccess ? "success" : "error";
          if (!isSuccess) updated[index].error = xhr.responseText;
          return updated;
        });

        await logSystemActivity({
          userId: currentUser?.id,
          action: "UPLOAD_FILE",
          entityType: "file",
          status: isSuccess ? "success" : "failed",
          description: isSuccess
            ? `Uploaded file "${fileStatus.file.name}" to dimension: ID(${dimensionId}), folder ${currentFolderId}.`
            : `Failed to upload file "${fileStatus.file.name}" to dimension: ID(${dimensionId}), folder ${currentFolderId}. Error: ${xhr.responseText}`,
        });

        resolve();
      };

      xhr.onerror = async () => {
        setFiles((prev) => {
          const updated = [...prev];
          updated[index].status = "error";
          updated[index].error = "Network error";
          return updated;
        });

        await logSystemActivity({
          userId: currentUser?.id,
          action: "UPLOAD_FILE",
          entityType: "file",
          status: "failed",
          description: `Network error while uploading file "${fileStatus.file.name}" dimension: ID(${dimensionId}), folder ${currentFolderId}.`,
        });

        resolve();
      };


        setFiles((prev) => {
          const updated = [...prev];
          updated[index].status = "uploading";
          return updated;
        });

        xhr.open("POST", "/api/files/upload");
        xhr.send(formData);
      });
    });

    await Promise.all(uploads);
    setIsUploading(false);

    const hasError = files.some((f) => f.status === "error");
    if (!hasError) {
      await logSystemActivity({
        userId: currentUser?.id,
        action: "UPLOAD_FILE_BATCH",
        entityType: "file",
        status: "success",
        description: `Successfully uploaded ${files.length} files to dimension: ID(${dimensionId}), folder ${currentFolderId}.`,
      });

      onSuccess();
      onClose();
      resetForm();
    } else {
      await logSystemActivity({
        userId: currentUser?.id,
        action: "UPLOAD_FILE_BATCH",
        entityType: "file",
        status: "failed",
        description: `One or more files failed to upload in a batch of ${files.length}.`,
      });
    }

  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      className="max-w-[700px] m-4"
    >
      <div className="relative w-full max-w-[700px] rounded-3xl bg-white dark:bg-gray-900 p-4 lg:p-11">
        {/* Header */}
        <div className="px-2">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Upload Files
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Select multiple files to upload to the current folder.
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto max-h-[400px] px-2 pb-3 custom-scrollbar space-y-4">
          {/* Drop zone */}
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Click to upload</span> or drag and drop
              </div>
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              multiple
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="border rounded-md p-2 space-y-1 dark:border-gray-700"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm truncate max-w-[80%] text-gray-700 dark:text-gray-300">
                      {f.file.name}
                    </span>
                    {f.status === "success" && (
                      <CheckCircle className="text-green-500 w-4 h-4" />
                    )}
                    {f.status === "error" && (
                      <XCircle className="text-red-500 w-4 h-4" />
                    )}
                  </div>
                  <Progress value={f.progress} />
                  {f.status === "error" && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {f.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 px-2">
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || files.length === 0}>
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
