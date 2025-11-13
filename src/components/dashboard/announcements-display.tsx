"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // ✅ same table system used in AllDocumentsTable
import Pagination from "@/components/tables/Pagination"; // optional if you want pagination
import { useModal } from "@/hooks/useModal";
import Button from "../ui/button/Button";
import { PlusCircle } from "lucide-react";
import AnnouncementModal from "../modals/AnnouncementModal";
import Badge from "../ui/badge/Badge";
import { useAlert } from "@/context/AlertContext";
import ConfirmAnnouncementDelete from "../modals/ConfirmAnnouncementDelete";

export default function ManageAnnouncementsDisplay() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState<any | null>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [selected, setSelected] = React.useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showAlert } = useAlert();

  async function loadAnnouncements() {
    setLoading(true);
    const res = await fetch("/api/announcements/admin-list");
    const data = await res.json();
    setAnnouncements(data.announcements || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreate = () => {
    setMode("create");
    setSelected(null);
    openModal();
  };

  const handleEdit = (announcement: any) => {
    setMode("edit");
    setSelected(announcement);
    openModal();
  };

  const handleDeleteClick = (id: number) => {
    setDeleteTarget(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await fetch(`/api/announcements/${deleteTarget}`, { method: "DELETE" });
    showAlert({
      type: "success",
      title: "Deletion Successful",
      message: "Announcement deleted successfully.",
    });
    setIsDeleting(false);
    setDeleteModalOpen(false);
    setDeleteTarget(null);
    loadAnnouncements();
  };


  return (
    <div>
      <div className="flex w-full justify-end px-10 mb-10">
        <Button
          onClick={handleCreate}
        >
          <PlusCircle/>
          Create Announcement
        </Button>
      </div>
      {/* 📋 Table Container */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[900px]">
            
            {loading ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            ) : (
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/5">
                  <TableRow>
                    <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Title
                    </TableCell>
                    <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Visibility
                    </TableCell>
                    <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Description
                    </TableCell>
                    <TableCell className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:border-white/5">
                  {announcements.length > 0 ? (
                    announcements.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {a.title}
                            </span>
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                              {new Date(a.created_at).toLocaleString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          <Badge variant="light">
                            {a.visibility.charAt(0).toUpperCase() + a.visibility.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          
                          {a.content?.slice(0, 60) || "No content"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              handleEdit({
                                id: a.id,
                                title: a.title,
                                content: a.content || "",
                                visibility: a.visibility,
                              })
                            }
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(a.id)}
                            className="ml-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-6 text-gray-500 dark:text-gray-400"
                      >
                        No announcements found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      <AnnouncementModal
        isOpen={isOpen}
        onClose={closeModal}
        mode={mode}
        initialData={selected}
        onSave={loadAnnouncements}
      />

      <ConfirmAnnouncementDelete
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
