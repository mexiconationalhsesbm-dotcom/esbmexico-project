"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Button2 from "@/components/ui/button/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus, Trash2, CheckCircle, Loader2, RefreshCcw } from "lucide-react";
import type { FolderTask, Admin } from "@/types";
import { CreateTaskModal } from "./CreateTaskModal";
import ConfirmDeleteTask from "./ConfirmDeleteTask";
import { useAlert } from "@/context/AlertContext";
import { useAuth } from "@/context/auth-context";


interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: number;
  dimensionId: number;
  folderName: string;
}

export function TasksModal({ isOpen, onClose, folderId, dimensionId, folderName }: TasksModalProps) {
  const router = useRouter();
  const { isDimensionLeader, isMasterAdmin, isOverallFocalPerson, isDimensionMember, user } = useAuth()
  const [tasks, setTasks] = useState<FolderTask[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState<number | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<FolderTask | null>(null); // ✅ track task to delete
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState<number | null>(null);
  const { showAlert } = useAlert();

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/list?folderId=${folderId}`);
      const data = await response.json();
      if (response.ok) {
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [folderId]);

  const fetchAdmins = useCallback(async () => {
    try {
      const response = await fetch("/api/admins/list");
      const data = await response.json();
      if (response.ok) {
        setAdmins(data.admins || []);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTasks();
      fetchAdmins();
    }
  }, [isOpen, fetchTasks, fetchAdmins]);

  const getAssignedNames = (task: FolderTask): string => {
    if (task.assigned_to_everyone) {
      return "Everyone";
    }

    const assignedAdmins = admins.filter((a) => task.assigned_to_admins.includes(Number(a.id)));
    return assignedAdmins.map((a) => a.full_name || a.email).join(", ") || "Unassigned";
  };

  const handleCompleteTask = async (task: FolderTask) => {
    setIsCompleting(task.id);
    try {
      const response = await fetch("/api/tasks/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          newStatus: "completed",
        }),
      });

      if (response.ok) {
        fetchTasks();
        showAlert({
          type: "success",
          title: "Task Complete.",
          message: "Task successfully updated to complete.",
        });
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating task:", error);
      showAlert({
        type: "error",
        title: "Task Error.",
        message: `Error updating task: ${error}`,
      });
    } finally {
      setIsCompleting(null);
    }
  };

  const handleRevisionCheck = async (task: FolderTask) => {
  setIsSubmittingRevision(task.id);
  try {
    const response = await fetch("/api/tasks/revision-checking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to submit revision");

    showAlert({
      type: "success",
      title: "Revision Submitted",
      message: "Your revised task has been resubmitted for checking.",
    });

    fetchTasks();
    router.refresh();
  } catch (error: any) {
    showAlert({
      type: "error",
      title: "Submission Failed",
      message: error.message,
    });
  } finally {
    setIsSubmittingRevision(null);
  }
};

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/tasks/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: taskToDelete.id }),
      });

      if (response.ok) {
        fetchTasks();
        showAlert({
          type: "success",
          title: "Task Deleted.",
          message: "Task deleted successfully.",
        });
        router.refresh();
      } else {
        showAlert({
          type: "error",
          title: "Delete Failed.",
          message: "Could not delete the task.",
        });
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      showAlert({
        type: "error",
        title: "Delete Failed.",
        message: `Error deleting task: ${error}`,
      });
    } finally {
      setIsDeleting(false);
      setTaskToDelete(null); // ✅ close modal
    }
  };

  const canCreateTask = !isDimensionMember;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[90vw] max-w-6xl h-[85vh] overflow-y-auto bg-white dark:bg-gray-950 rounded-xl shadow-lg flex flex-col gap-4 z-9999999">
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-wide text-gray-950 dark:text-white">Tasks for: {folderName}</DialogTitle>
            <DialogDescription className="text-md tracking-wide text-gray-600 dark:text-white">
              Manage tasks and action items for this folder
            </DialogDescription>
          </DialogHeader>

          {canCreateTask && (
            <div className="mb-4 flex justify-end items-center px-8">
              <Button2 onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button2>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-gray-600 dark:text-white">No tasks found for this folder</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[1000px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/5">
                      <TableRow>
                        <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Title
                        </TableCell>
                        <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Description
                        </TableCell>
                        <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Assigned To
                        </TableCell>
                        <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Status
                        </TableCell>
                        <TableCell className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                      {tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">
                            {task.title}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                            {task.description || "—"}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                            {getAssignedNames(task)}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm">
                            <Badge>
                              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-center text-gray-500 text-theme-sm dark:text-gray-400">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="z-9999999 relative">
                                {task.status === "pending" && (
                                  <DropdownMenuItem
                                    onClick={() => handleCompleteTask(task)}
                                    disabled={isCompleting === task.id}
                                  >
                                    {isCompleting === task.id ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                    )}
                                    Mark as Completed
                                  </DropdownMenuItem>
                                )}
                                {task.status === "for_revision" && (
                                  <DropdownMenuItem
                                    onClick={() => handleRevisionCheck(task)}
                                    disabled={isSubmittingRevision === task.id}
                                  >
                                    {isSubmittingRevision === task.id ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <RefreshCcw className="h-4 w-4 mr-2" />
                                    )}
                                    Submit Revision
                                  </DropdownMenuItem>
                                )}
                                {canCreateTask && (
                                  <DropdownMenuItem
                                    onClick={() => setTaskToDelete(task)} // ✅ open modal
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ Delete Confirmation Modal */}
      <ConfirmDeleteTask
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteTask}
        isLoading={isDeleting}
      />

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        folderId={folderId}
        dimensionId={dimensionId}
        onSuccess={() => {
          fetchTasks();
          router.refresh();
        }}
      />
    </>
  );
}
