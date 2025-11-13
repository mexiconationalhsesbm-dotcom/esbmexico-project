"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { useAlert } from "@/context/AlertContext";

export default function ReviewTaskModal({
  isOpen,
  onClose,
  task,
  onReviewed,
}: {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  onReviewed: () => void;
}) {
  const { showAlert } = useAlert();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!task) return null;

  const handleAction = async (approve: boolean) => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/tasks/approve-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: task.id,        // from task_reviews
          taskId: task.original_task_id, // folder_tasks ID
          approve,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update review task");

      showAlert({
        type: "success",
        title: approve ? "Task Approved" : "Revision Requested",
        message: data.message,
      });

      onReviewed();
      onClose();
    } catch (error: any) {
      showAlert({
        type: "error",
        title: "Error",
        message: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoToFolder = () => {
    const folderId = task.folder?.parent_folder_id || task.folder?.id || "";
    const slug = task.dimension?.slug || "";
    router.push(`/dashboard/${slug}/${folderId}`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-xl p-10 rounded-xl bg-white dark:bg-gray-900"
    >
      <h3 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
        {task.task_title || task.title}
      </h3>

      <p className="text-gray-600 dark:text-gray-400 mb-5">
        Submitted by{" "}
        <span className="font-medium text-gray-800 dark:text-white">
          {task.submitted_by_admin?.full_name || "Unknown"}
        </span>
      </p>

      {task.folder && (
        <div className="mb-5">
          <p className="text-gray-600 dark:text-gray-400">
            Folder:{" "}
            <span className="font-medium text-gray-800 dark:text-white">
              {task.folder?.name || "Untitled Folder"}
            </span>
          </p>
          <Button
            variant="outline"
            onClick={handleGoToFolder}
            className="mt-2"
          >
            Go to Folder
          </Button>
        </div>
      )}

      {task.description && (
        <div className="mt-4 mb-6 text-gray-700 dark:text-gray-300">
          <h4 className="font-semibold mb-1 text-gray-900 dark:text-white">Description</h4>
          <p className="text-sm leading-relaxed">{task.description}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-8">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => handleAction(false)}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Request Revision"}
        </Button>
        <Button
          onClick={() => handleAction(true)}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Approve"}
        </Button>
      </div>
    </Modal>
  );
}
