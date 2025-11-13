"use client";
import React, { useRef, useState, useMemo, useEffect } from "react";
import ConfirmDeleteModal from "../modals/ConfirmDeleteModal";
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
import Pagination from "@/components/tables/Pagination"; // make sure this exists
import { ArrowUpDown, Search } from "lucide-react";
import Button from "../ui/button/Button";
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


export default function DimensionMemberTable({ data }: { data: Admin[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false)

  const [adminsList, setAdminsList] = useState<Admin[]>(data);

  const { showAlert } = useAlert();

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


const confirmDelete = (id: string) => {
    setSelectedId(id);
    setShowModal(true);
  };

const handleDeleteConfirmed = async () => {
  if (!selectedId) return;
  setIsDeleting(true);

  const { error: dbError } = await supabase
    .from("admins")
    .delete()
    .eq("id", selectedId);

  if (dbError) {
    showAlert({
      type: "error",
      title: "Deletion Failed",
      message: dbError.message,
    });
    setIsDeleting(false);
    return;
  }

  try {
    await deleteUserAdmin(selectedId);
    setAdminsList((prev) => prev.filter((admin) => admin.id !== selectedId));
    showAlert({
      type: "success",
      title: "Admin Deleted",
      message: "The admin was successfully deleted.",
    });
    setShowModal(false);
    setSelectedId(null);
  } catch (err: any) {
    showAlert({
      type: "error",
      title: "Auth Deletion Failed",
      message: err.message,
    });
  }

  setIsDeleting(false);
};
 
    return (
    <div>
      {/* Search + Sort Panel */}
      <div className="pb-6 flex justify-end items-center">
        <div className="relative flex gap-4 mb-8 items-center">

              <div className="relative">
                  <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
                    <svg
                      className="fill-gray-500 dark:fill-gray-400"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                        fill=""
                      />
                    </svg>
                  </span>
                  <input
                    type="search"
                    placeholder="Search folders..."
                    value={fileSearchQuery}
                    onChange={(e) => setFileSearchQuery(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-white dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                  />
            </div>
            {/* <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search folders..."
              className="pl-8"
              value={fileSearchQuery}
              onChange={(e) => setFileSearchQuery(e.target.value)}
            /> */}
            <Button variant="outline" onClick={() => setIsSortOpen(true)} className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            Sort
          </Button>
        </div>

        <SortPanel
          title="Sort Admins"
          isOpen={isSortOpen} 
          onClose={() => setIsSortOpen(false)}
          options={adminSortOptions}
          onSort={setAdminSortOptions}
          availableFields={["name", "role"]}

          dimensionFilter={selectedDimension}
          onDimensionFilterChange={setSelectedDimension}
        />

      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[1102px]">
              <Table>
                {/* Table Header */}
                <TableHeader className="border-b border-gray-100 dark:border-white/5">
                  <TableRow>
                    <TableCell
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Admin
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
                  {paginatedAdmins.map((admin) => (
                    <TableRow key={admin.id}>
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
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {admin.full_name}
                            </span>
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                              {admin.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {admin.role}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {admin.dimension}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-gray-500 text-theme-sm dark:text-gray-400">
                        <div className="flex flex-row justify-center items-center gap-4">
                          <button
                          onClick={() => confirmDelete(admin.id)}
                          className="bg-red-700 px-4 py-1 rounded-xl">
                            <span className="text-warning-25 text-xs">Delete</span>
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
      </div>

      {/* Pagination */}
      <div className="mt-8 flex justify-center items-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Delete Modal */}
      <ConfirmDeleteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDeleteConfirmed}
        isLoading={isDeleting}
      />
    </div>
  );
}
