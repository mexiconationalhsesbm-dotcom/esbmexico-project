"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ConfirmDeleteModal from "../modals/ConfirmDeleteModal";
import ConfirmRemoveModal from "../modals/ConfirmRemoveModal";
import { useAlert } from "@/context/AlertContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { createClient } from "@/utils/supabase/client";
import { deleteUserAdmin } from "@/libs/actions/deleteUser";
import { SortPanel, type SortOptions } from "./../dashboard/sort-panel";
import Link from "next/link";
import Image from "next/image";

type Admin = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  role_id: number;
  assigned_dimension_id: number | null;
  dimension: string;
};

export default function DimensionLeaderTable({ 
  data, 
  dimensions 
}: { 
  data: Admin[], 
  dimensions: { id: number; name: string }[] 
}) {
  const supabase = createClient();
  const { showAlert } = useAlert();

  const [adminsList, setAdminsList] = useState<Admin[]>(data);

  // Delete Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Search & Sort & Pagination States
  const [fileSearchQuery, setFileSearchQuery] = useState("");
  const [adminSortOptions, setAdminSortOptions] = useState<SortOptions>({
    field: "name",
    order: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedDimension, setSelectedDimension] = useState<string>("");

  // Reset page when filters/sorts change
  useEffect(() => {
    setCurrentPage(1);
  }, [fileSearchQuery, adminSortOptions]);

  // Filtering
  const filteredAdmins = useMemo(() => {
  return adminsList.filter((admin) => {
    const matchesSearch = admin.full_name.toLowerCase().includes(fileSearchQuery.toLowerCase());
    const matchesDimension =
      selectedDimension === "" || admin.assigned_dimension_id?.toString() === selectedDimension;
    return matchesSearch && matchesDimension;
  });
}, [adminsList, fileSearchQuery, selectedDimension]);

  // dimension rows
  const dimensionRows = useMemo(() => {
    return dimensions.map((dim) => {
      const admin = adminsList.find(
        (a) => a.assigned_dimension_id === dim.id
      );
      return {
        dimensionId: dim.id,
        dimensionName: dim.name,
        admin,
      };
    });
  }, [dimensions, adminsList]);

  // Sorting
  const sortedAdmins = useMemo(() => {
    const list = [...filteredAdmins];
    switch (adminSortOptions.field) {
      case "name":
        list.sort((a, b) => a.full_name.localeCompare(b.full_name));
        break;
      case "role":
        list.sort((a, b) => (a.role || "").localeCompare(b.role || ""));
        break;
    }
    if (adminSortOptions.order === "desc") list.reverse();
    return list;
  }, [filteredAdmins, adminSortOptions]);

  const totalPages = Math.ceil(sortedAdmins.length / itemsPerPage);

  // Pagination
  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedAdmins.slice(start, start + itemsPerPage);
  }, [sortedAdmins, currentPage]);

  // Keep current page in bounds
  useEffect(() => {
    const newTotal = Math.ceil(sortedAdmins.length / itemsPerPage);
    setCurrentPage((old) => Math.min(old, Math.max(newTotal, 1)));
  }, [sortedAdmins]);

  // const confirmDelete = (id: string) => {
  //   setSelectedId(id);
  //   setShowModal(true);
  // };

  // const handleDeleteConfirmed = async () => {
  //   if (!selectedId) return;
  //   setIsDeleting(true);

  //   const { error: dbError } = await supabase
  //     .from("admins")
  //     .delete()
  //     .eq("id", selectedId);

  //   if (dbError) {
  //     showAlert({
  //       type: "error",
  //       title: "Deletion Failed",
  //       message: dbError.message,
  //     });
  //     setIsDeleting(false);
  //     return;
  //   }

  //   try {
  //     await deleteUserAdmin(selectedId);
  //     setAdminsList((prev) => prev.filter((admin) => admin.id !== selectedId));
  //     showAlert({
  //       type: "success",
  //       title: "Admin Deleted",
  //       message: "The admin was successfully deleted.",
  //     });
  //     setShowModal(false);
  //     setSelectedId(null);
  //   } catch (err: any) {
  //     showAlert({
  //       type: "error",
  //       title: "Auth Deletion Failed",
  //       message: err.message,
  //     });
  //   }

  //   setIsDeleting(false);
  // };

  const confirmRemove = (id: string) => {
  setSelectedId(id);
  setShowModal(true);
};

const handleRemoveConfirmed = async () => {
  if (!selectedId) return;
  setIsRemoving(true);

  const { error } = await supabase
    .from("admins")
    .update({ role_id: 1 })
    .eq("id", selectedId);

  if (error) {
    showAlert({
      type: "error",
      title: "Failed",
      message: error.message,
    });
    setIsRemoving(false);
    return;
  }

  setAdminsList((prev) =>
    prev.map((admin) =>
      admin.id === selectedId ? { ...admin, role: "Unassigned", assigned_dimension_id: null } : admin
    )
  );

  showAlert({
    type: "success",
    title: "Removed",
    message:
      "The account is no longer a Dimension Leader. Please assign a new one.",
  });

  setShowModal(false);
  setSelectedId(null);
  setIsRemoving(false);
};


  return (
    <div>

      {/* Table */}
      <div className="mt-8 mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[1102px]">
              <Table>
                {/* Table Header */}
                <TableHeader className="border-b border-gray-100 dark:border-white/5">
                  <TableRow>
                    <TableCell
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Name
                    </TableCell>  
                    <TableCell
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Role
                    </TableCell>
                    <TableCell
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Assigned Dimension
                    </TableCell>
                    <TableCell
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 flex justify-center"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
  
                {/* Table Body */}
                <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                  {dimensionRows.map(({ dimensionId, dimensionName, admin }) => (
                    <TableRow key={dimensionId}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center">
                            <Image
                              src="/images/icons/admin_profile.svg"
                              alt="admin"
                              width={30}
                              height={30}
                              className="w-[30px] h-[30px]"
                            />
                          </div>
                          <div>
                            {admin ? (
                              <>
                                <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                  {admin.full_name}
                                </span>
                                <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                  {admin.email}
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-400 italic">Unassigned</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {admin ? admin.role : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {dimensionName}
                      </TableCell>
                        <TableCell className="px-2 py-1 text-gray-500 text-theme-sm dark:text-gray-400">
                        <div className="flex flex-row justify-center items-center gap-4">
                          {admin ? (
                            <button
                              onClick={() => confirmRemove(admin.id)}
                              className="bg-yellow-500 px-4 py-1 rounded-xl"
                            >
                              <span className="text-warning-25 text-xs">
                                Remove
                              </span>
                            </button>
                          ) : (
                            <button
                              className="bg-green-700 px-4 py-1 rounded-xl"
                            >
                              
                              <Link
                                href="/dashboard/all-admin"
                                className="text-white text-xs"
                              >
                                Assign
                              </Link>
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
      </div>

      <ConfirmRemoveModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleRemoveConfirmed}
        isLoading={isRemoving}
      />

    </div>
  );
}
