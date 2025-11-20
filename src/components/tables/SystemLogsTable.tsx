"use client";

import React, { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import Pagination from "@/components/tables/Pagination";
import { ArrowUpDown, Search } from "lucide-react";

interface SystemLogsTableProps {
  logs: {
    id: number;
    timestamp: string;
    admin_name: string | null;
    admin_email: string | null;
    action: string;
    description: string;
    entity_type: string;
    entity_name: string | null;
    status: string;
  }[];
}

export default function SystemLogsTable({ logs }: SystemLogsTableProps) {
  const [sortBy, setSortBy] = useState<keyof SystemLogsTableProps["logs"][0]>("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const pageSize = 20;

  // ---- Filter by Search ----
  const filteredLogs = useMemo(() => {
    const query = search.toLowerCase();

    return logs.filter((log) => {
      return (
        log.timestamp.toLowerCase().includes(query) ||
        (log.admin_name ?? "").toLowerCase().includes(query) ||
        (log.admin_email ?? "").toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.description.toLowerCase().includes(query) ||
        (log.entity_name ?? "").toLowerCase().includes(query) ||
        log.entity_type.toLowerCase().includes(query) ||
        log.status.toLowerCase().includes(query)
      );
    });
  }, [logs, search]);

  // ---- Sorting ----
  const sortedLogs = useMemo(() => {
    const sorted = [...filteredLogs].sort((a, b) => {
      const valA = a[sortBy] ?? "";
      const valB = b[sortBy] ?? "";

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredLogs, sortBy, sortDir]);

  // ---- Pagination ----
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLogs.slice(start, start + pageSize);
  }, [sortedLogs, currentPage]);

  const toggleSort = (column: keyof SystemLogsTableProps["logs"][0]) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">

      {/* 🔍 Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-end">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="text-dark-gray dark:text-white w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white/80 dark:bg-white/5 py-2 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1000px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/5">
              <TableRow>

                <TableHead
                  onClick={() => toggleSort("timestamp")}
                  className="font-medium text-gray-700 dark:text-gray-300 text-theme-xs cursor-pointer"
                >
                  Timestamp <ArrowUpDown size={14} className="inline-block" />
                </TableHead>

                <TableHead
                  onClick={() => toggleSort("admin_name")}
                  className="font-medium text-gray-700 dark:text-gray-300 text-theme-xs cursor-pointer"
                >
                  Admin <ArrowUpDown size={14} className="inline-block" />
                </TableHead>

                <TableHead className="font-medium text-gray-700 dark:text-gray-300 text-theme-xs">Action</TableHead>
                <TableHead className="font-medium text-gray-700 dark:text-gray-300 text-theme-xs">Description</TableHead>
                <TableHead className="font-medium text-gray-700 dark:text-gray-300 text-theme-xs">Entity</TableHead>
                <TableHead className="font-medium text-gray-700 dark:text-gray-300 text-theme-xs">Entity Type</TableHead>

                <TableHead
                  onClick={() => toggleSort("status")}
                  className="font-medium text-gray-700 dark:text-gray-300 text-theme-xs cursor-pointer"
                >
                  Status <ArrowUpDown size={14} className="inline-block" />
                </TableHead>

              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
              {paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-gray-500 dark:text-white">
                    No system logs found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="py-3 text-gray-700 dark:text-gray-300">{new Date(log.timestamp).toLocaleString()}</TableCell>

                    <TableCell className="py-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-50">{log.admin_name || "Unknown"}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{log.admin_email}</div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 text-gray-700 dark:text-gray-200">{log.action}</TableCell>
                    <TableCell className="py-3 text-gray-900 dark:text-gray-50">{log.description}</TableCell>
                    <TableCell className="py-3 text-gray-900 dark:text-gray-50">{log.entity_name || "-"}</TableCell>
                    <TableCell className="py-3 text-gray-900 dark:text-gray-50">{log.entity_type}</TableCell>

                    <TableCell
                      className={`py-3 font-medium ${
                        log.status === "success" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {log.status}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="p-4 flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredLogs.length / pageSize)}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
