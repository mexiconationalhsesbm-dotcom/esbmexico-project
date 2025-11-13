"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import Pagination from "@/components/tables/Pagination";
import { ArrowUpDown, Search } from "lucide-react";
import Button from "../ui/button/Button";
import ConfirmDeactivateModal from "../modals/ConfirmDeactivateModal";
import TerminateSessionModal from "../modals/TerminateSessionModal";
import ConfirmReactivateModal from "../modals/ConfirmReactivateModal";
import Image from "next/image";

type Admin = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  role_id: number | null;
  assigned_dimension_id: number | null;
  status: "active" | "suspended" | "pending"
  last_active_at: string | null
};

export default function AllAccounts({ 
  data, 
  dimensions 
}: { 
  data: Admin[], 
  dimensions: { id: number; name: string }[] 
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const { showAlert } = useAlert();

  const [adminsList, setAdminsList] = useState<Admin[]>(data);

  // Delete Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false)

  // Search & Sort & Pagination States
  const [fileSearchQuery, setFileSearchQuery] = useState("");
  const [adminSortOptions, setAdminSortOptions] = useState<SortOptions>({
    field: "name",
    order: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isTerminating, setIsTerminating] = useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null)

  const [selectedDimension, setSelectedDimension] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");

    // Re/Deactivate Modal States
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedDeactivateId, setSelectedDeactivateId] = useState<string | null>(null);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [selectedReactivateId, setSelectedReactivateId] = useState<string | null>(null);

  // Terminate Session Modal States
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [selectedTerminateId, setSelectedTerminateId] = useState<string | null>(null);


  // Reset page when filters/sorts change
  useEffect(() => {
    setCurrentPage(1);
  }, [fileSearchQuery, adminSortOptions]);

  // Filtering
  const filteredAdmins = useMemo(() => {
  return adminsList.filter((admin) => {
    const matchesSearch = admin.full_name.toLowerCase().includes(fileSearchQuery.toLowerCase());
    const matchesRole = selectedRole === "" || admin.role === selectedRole;
    return matchesSearch && matchesRole;
  });
}, [adminsList, fileSearchQuery, selectedRole]);

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

  const adminsWithDimension = useMemo(() => {
  const map = dimensions.reduce((acc, dim) => {
    acc[dim.id] = dim.name;
    return acc;
  }, {} as Record<number, string>);

  return paginatedAdmins.map((admin) => ({
    ...admin,
    dimensionName: admin.assigned_dimension_id
      ? map[admin.assigned_dimension_id] || "Unassigned"
      : "Unassigned",
  }));
}, [paginatedAdmins, dimensions]);

  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) setCurrentUser(data.user);
    };
    fetchUser();
  }, [supabase]);

  // SYSTEM LOGS (same format as TeachersTable)
  const logSystemActivity = async ({
    userId,
    action,
    entityType,
    status,
    description,
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
      await logSystemActivity({
      userId: currentUser?.id,
        action: "DELETE_ADMIN",
        entityType: "admin",
        status: "success",
        description: `Deleted admin account with ID: ${selectedId}.`,
      });
      showAlert({
        type: "success",
        title: "Admin Deleted",
        message: "The admin was successfully deleted.",
      });
      setShowModal(false);
      setSelectedId(null);
    } catch (err: any) {
      await logSystemActivity({
        userId: currentUser?.id,
        action: "DELETE_ADMIN",
        entityType: "admin",
        status: "failed",
        description: `Failed to delete admin in auth: ${err.message}`,
      });
      showAlert({
        type: "error",
        title: "Auth Deletion Failed",
        message: err.message,
      });
    }

    setIsDeleting(false);
  };

  const openTerminateModal = (id: string) => {
  setSelectedTerminateId(id);
  setShowTerminateModal(true);
};

const handleConfirmTerminate = async () => {
  if (!selectedTerminateId) return;

  setIsTerminating(selectedTerminateId);
  setShowTerminateModal(false); // close modal

  try {
    const response = await fetch("/api/admins/terminate-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId: selectedTerminateId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to terminate session");
    }

    await logSystemActivity({
      userId: currentUser?.id,
      action: "TERMINATE_SESSION",
      entityType: "admin",
      status: "success",
      description: `Terminated all active sessions for admin ID: ${selectedTerminateId}.`,
    });

    showAlert({
      type: "success",
      title: "Session Terminated",
      message: "All sessions terminated successfully.",
    });
  } catch (err: any) {
    await logSystemActivity({
      userId: currentUser?.id,
      action: "TERMINATE_SESSION",
      entityType: "admin",
      status: "failed",
      description: `Failed to terminate session for admin ID: ${selectedTerminateId}. Error: ${err.message}`,
    });
    showAlert({
      type: "error",
      title: "Session Termination Failed",
      message: err.message,
    });
  } finally {
    setIsTerminating(null);
    setSelectedTerminateId(null);
  }
};

  const openDeactivateModal = (id: string) => {
  setSelectedDeactivateId(id);
  setShowDeactivateModal(true);
};

const handleConfirmDeactivate = async () => {
  if (!selectedDeactivateId) return;

  setIsUpdatingStatus(selectedDeactivateId);
  setShowDeactivateModal(false);

  try {
    const response = await fetch("/api/admins/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId: selectedDeactivateId, status: "suspended" }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Failed to update admin status");

    setAdminsList((prev) =>
      prev.map((admin) =>
        admin.id === selectedDeactivateId ? { ...admin, status: "suspended" } : admin
      )
    );

    await logSystemActivity({
      userId: currentUser?.id,
      action: "DEACTIVATE_ADMIN",
      entityType: "admin",
      status: "success",
      description: `Deactivated admin account with ID: ${selectedDeactivateId}.`,
    });

    showAlert({
      type: "success",
      title: "Account Deactivated",
      message: "The account was successfully deactivated.",
    });
  } catch (err: any) {
    showAlert({
      type: "error",
      title: "Deactivation Failed",
      message: err.message,
    });
    await logSystemActivity({
      userId: currentUser?.id,
      action: "DEACTIVATE_ADMIN",
      entityType: "admin",
      status: "failed",
      description: `Failed to deactivate admin ID: ${selectedDeactivateId}. Error: ${err.message}`,
    });
  } finally {
    setIsUpdatingStatus(null);
    setSelectedDeactivateId(null);
  }
};

  const openReactivateModal = (id: string) => {
      setSelectedReactivateId(id);
      setShowReactivateModal(true);
    };

  const handleConfirmReactivate = async () => {
    if (!selectedReactivateId) return;

    setIsUpdatingStatus(selectedReactivateId);
    setShowReactivateModal(false);

    try {
      const response = await fetch("/api/admins/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: selectedReactivateId, status: "active" }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to update admin status");

      setAdminsList((prev) =>
        prev.map((admin) =>
          admin.id === selectedReactivateId ? { ...admin, status: "active" } : admin
        )
      );

      await logSystemActivity({
        userId: currentUser?.id,
        action: "REACTIVATE_ADMIN",
        entityType: "admin",
        status: "success",
        description: `Reactivated admin account with ID: ${selectedReactivateId}.`,
      });

      showAlert({
        type: "success",
        title: "Account Reactivated",
        message: "The account was successfully reactivated and can now log in again.",
      });
    } catch (err: any) {
      await logSystemActivity({
      userId: currentUser?.id,
      action: "REACTIVATE_ADMIN",
      entityType: "admin",
      status: "failed",
      description: `Failed to reactivate admin ID: ${selectedReactivateId}. Error: ${err.message}`,
    });
    
      showAlert({
        type: "error",
        title: "Reactivation Failed",
        message: err.message,
      });
    } finally {
      setIsUpdatingStatus(null);
      setSelectedReactivateId(null);
    }
  };

  const getSessionStatus = (lastActiveAt: string | null) => {
    if (!lastActiveAt) return "Offline";

    const lastActive = new Date(lastActiveAt).getTime();
    const now = Date.now();
    const diffMinutes = (now - lastActive) / (1000 * 60);

    return diffMinutes <= 2 ? "Online" : "Offline"; // 5-minute threshold
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
          availableFields={["name"]}

            roleFilter={selectedRole}
            onRoleFilterChange={setSelectedRole}
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
                      Session Status
                    </TableCell>
                    <TableCell
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Last Sign In
                    </TableCell>
                    <TableCell
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Account Status
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
                  {adminsWithDimension.map((admin) => (
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
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              getSessionStatus(admin.last_active_at) === "Online"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                          ></span>
                          <span
                            className={`font-medium ${
                              getSessionStatus(admin.last_active_at) === "Online"
                                ? "text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {getSessionStatus(admin.last_active_at)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {admin.last_active_at 
                          ? new Date(admin.last_active_at).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "Never Active"}

                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm">
                        <span
                          className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full
                            ${
                              admin.status === "active"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : admin.status === "pending"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                        >
                          <span
                            className={`w-2 h-2 mr-2 rounded-full
                              ${
                                admin.status === "active"
                                  ? "bg-green-500"
                                  : admin.status === "pending"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                          ></span>
                          {admin.status.charAt(0).toUpperCase() + admin.status.slice(1)}
                        </span>
                      </TableCell>

                      <TableCell className="px-2 py-1 text-gray-500 text-theme-sm dark:text-gray-400">
                      <div className="flex flex-row justify-center items-center gap-4">

                        {/* If admin is active or pending */}
                        {(admin.status === "active" || admin.status === "pending") && (
                          <>
                            <button
                              onClick={() => openTerminateModal(admin.id)}
                              disabled={isTerminating === admin.id}
                              className={`px-4 py-1 rounded-xl ${
                                isTerminating === admin.id
                                  ? "bg-gray-500 cursor-not-allowed"
                                  : "bg-yellow-600 hover:bg-yellow-700"
                              }`}
                            >
                              <span className="text-white text-xs">
                                {isTerminating === admin.id ? "Signing Out..." : "Sign Out"}
                              </span>
                            </button>

                            <button
                              onClick={() => openDeactivateModal(admin.id)}
                              disabled={isUpdatingStatus === admin.id}
                              className={`px-4 py-1 rounded-xl ${
                                isUpdatingStatus === admin.id
                                  ? "bg-gray-500 cursor-not-allowed"
                                  : "bg-red-700 hover:bg-red-800"
                              }`}
                            >
                              <span className="text-white text-xs">
                                {isUpdatingStatus === admin.id ? "Deactivating..." : "Deactivate"}
                              </span>
                            </button>
                          </>
                        )}

                        {/* If admin is suspended */}
                        {admin.status === "suspended" && (
                          <>
                            <button
                              onClick={() => confirmDelete(admin.id)}
                              className="bg-red-700 hover:bg-red-800 px-4 py-1 rounded-xl"
                            >
                              <span className="text-white text-xs">Delete</span>
                            </button>

                            <button
                              onClick={() => openReactivateModal(admin.id)}
                              disabled={isUpdatingStatus === admin.id}
                              className={`px-4 py-1 rounded-xl ${
                                isUpdatingStatus === admin.id
                                  ? "bg-gray-500 cursor-not-allowed"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                            >
                              <span className="text-white text-xs">
                                {isUpdatingStatus === admin.id ? "Reactivating..." : "Reactivate"}
                              </span>
                            </button>
                          </>
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

      <ConfirmDeactivateModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        onConfirm={handleConfirmDeactivate}
        isLoading={!!isUpdatingStatus}
      />

      <ConfirmReactivateModal
        isOpen={showReactivateModal}
        onClose={() => setShowReactivateModal(false)}
        onConfirm={handleConfirmReactivate}
        isLoading={!!isUpdatingStatus}
      />

      <TerminateSessionModal
        isOpen={showTerminateModal}
        onClose={() => setShowTerminateModal(false)}
        onConfirm={handleConfirmTerminate}
        isLoading={!!isTerminating}
      />


    </div>
  );
}
