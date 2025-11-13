"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Button2 from "@/components/ui/button/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import type { Admin } from "@/types";
import { Loader2, Search } from "lucide-react";
import TextArea from "../form/input/TextArea";
import Checkbox from "../form/input/Checkbox";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: number;
  dimensionId: number;
  onSuccess: () => void;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  folderId,
  dimensionId,
  onSuccess,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToEveryone, setAssignedToEveryone] = useState(false);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

const fetchAdmins = useCallback(async () => {
  try {
    const response = await fetch("/api/admins/list");
    const data = await response.json();

    if (response.ok) {
      const dimensionAdmins = data.admins.filter(
        (admin: Admin) =>
          admin.assigned_dimension_id === dimensionId && admin.role_id !== 4
      );
      setAdmins(dimensionAdmins);
    }
  } catch (error) {
    console.error("Error fetching admins:", error);
  }
}, [dimensionId]);

  useEffect(() => {
    if (isOpen) {
      fetchAdmins();
    }
  }, [isOpen, fetchAdmins]);


  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Please enter a task title");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          dimensionId,
          title: title.trim(),
          description: description.trim() || null,
          assignedToAdmins: assignedToEveryone ? [] : selectedAdmins,
          assignedToEveryone,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create task");
      }

      // ✅ Reset form and close
      setTitle("");
      setDescription("");
      setAssignedToEveryone(false);
      setSelectedAdmins([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminToggle = (adminId: string) => {
    setSelectedAdmins((prev) =>
      prev.includes(adminId)
        ? prev.filter((id) => id !== adminId)
        : [...prev, adminId]
    );
  };

  // ✅ Filter admins by search term (full_name only)
  const filteredAdmins = useMemo(() => {
    const term = search.toLowerCase();
    return admins.filter((admin) =>
      admin.full_name?.toLowerCase().includes(term)
    );
  }, [search, admins]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-white dark:bg-gray-950">
        <div className="px-2">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Create New Task
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Create a task for this folder and assign it to team members
          </p>
        </div>

        <DialogHeader className="hidden">
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Create a task for this folder and assign it to team members</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && <div className="text-sm text-destructive">{error}</div>}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder="Enter task title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <TextArea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          {/* Assign Section */}
          <div className="space-y-3">
            <Label>Assign To</Label>
            <div className="flex items-center gap-2 mb-3">
              <Checkbox
                id="everyone"
                checked={assignedToEveryone}
                onChange={(checked) => {
                  setAssignedToEveryone(checked);
                  if (checked) setSelectedAdmins([]);
                }}
              />
              <Label htmlFor="everyone" className="text-sm font-normal cursor-pointer">
                Assign to Everyone
              </Label>
            </div>

            {/* ✅ Search + Admin List */}
            {!assignedToEveryone && (
              <div className="space-y-2">
                {/* Search Field */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Admin List */}
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {filteredAdmins.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No matching members found
                    </p>
                  ) : (
                    filteredAdmins.map((admin) => (
                      <div key={admin.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`admin-${admin.id}`}
                          checked={selectedAdmins.includes(admin.id)}
                          onChange={() => handleAdminToggle(admin.id)}
                        />
                        <Label
                          htmlFor={`admin-${admin.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {admin.full_name || "Unnamed Member"}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex items-center">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button2 onClick={handleCreate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Task"
            )}
          </Button2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
