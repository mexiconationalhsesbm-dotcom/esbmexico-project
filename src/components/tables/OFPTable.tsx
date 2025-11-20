"use client";
import React, { useRef, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAlert } from "@/context/AlertContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { createClient } from "@/utils/supabase/client"; 
import { ArrowUpDown, Loader2 } from "lucide-react";
import Image from "next/image";

type Admin = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  role_id: number;
};

type SortOptions = {
  field: "name" | "role";
  order: "asc" | "desc";
};

export default function OFPTable({ data }: { data: Admin[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const [adminsList, setAdminsList] = useState<Admin[]>(data);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: "name",
    order: "asc",
  });

  const { showAlert } = useAlert();

  // Remove OFP → set to "unassigned"
  const handleRemoveOFP = async (id: string) => {
    const { error } = await supabase
      .from("admins")
      .update({ role_id: 1 })
      .eq("id", id);

    if (error) {
      showAlert({
        type: "error",
        title: "Failed",
        message: error.message,
      });
      return;
    }

    setAdminsList((prev) =>
      prev.map((admin) =>
        admin.id === id ? { ...admin, role: "Unassigned" } : admin
      )
    );

    showAlert({
      type: "success",
      title: "Removed",
      message: "The account is no longer an Overall Focal Person.",
    });
  };

  const filteredAdmins = adminsList.filter((admin) =>
    `${admin.full_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedAdmins = useMemo(() => {
    const sorted = [...filteredAdmins];
    switch (sortOptions.field) {
      case "name":
        sorted.sort((a, b) => a.full_name.localeCompare(b.full_name));
        break;
      case "role":
        sorted.sort((a, b) =>
          a.role.localeCompare(b.role)
        );
        break;
    }
    if (sortOptions.order === "desc") sorted.reverse();
    return sorted;
  }, [filteredAdmins, sortOptions]);

  const toggleSort = (field: "name" | "role") => {
    setSortOptions((prev) => ({
      field,
      order:
        prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const hasOFP = sortedAdmins.some(
    (admin) => admin.role_id === 3
  );

  return (
    <div>
      {/* Search */}
      <div className="pb-6 flex justify-end">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
              <svg
                className="fill-gray-500 dark:fill-gray-400"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                />
              </svg>
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
            />
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1102px]">
            <Table>
              {/* Table Header */}
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer"
                    onClick={() => toggleSort("name")}
                  >
                    Name <ArrowUpDown className="inline-block w-4 h-4 ml-1" />
                  </TableCell>
                  <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Role
                  </TableCell>
                  <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 flex justify-center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {hasOFP ? (
                  sortedAdmins
                    .filter(
                      (admin) => admin.role_id === 3
                    )
                    .map((admin) => (
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
                        <TableCell className="px-2 py-1 text-gray-500 text-theme-sm dark:text-gray-400">
                          <div className="flex flex-row justify-center items-center gap-4">
                            <button
                              onClick={() => handleRemoveOFP(admin.id)}
                              className="bg-yellow-600 px-4 py-1 rounded-xl"
                            >
                              <span className="text-white text-xs">
                                Remove
                              </span>
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-6 text-gray-500 dark:text-gray-400"
                    >
                      No assigned Overall Focal Person.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Assign button if no OFP */}
      {!hasOFP && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => router.push("/dashboard/accounts-role")}
            className="bg-blue-600 px-6 py-2 rounded-xl text-white text-sm"
          >
            Assign
          </button>
        </div>
      )}
    </div>
  );
}
