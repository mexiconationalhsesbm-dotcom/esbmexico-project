"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";

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
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1000px]">
          <Table>
            {/* Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell className="font-medium text-gray-500 text-theme-xs">Timestamp</TableCell>
                <TableCell className="font-medium text-gray-500 text-theme-xs">Admin</TableCell>
                <TableCell className="font-medium text-gray-500 text-theme-xs">Action</TableCell>
                <TableCell className="font-medium text-gray-500 text-theme-xs">Description</TableCell>
                <TableCell className="font-medium text-gray-500 text-theme-xs">Entity</TableCell>
                <TableCell className="font-medium text-gray-500 text-theme-xs">Entity Type</TableCell>
                <TableCell className="font-medium text-gray-500 text-theme-xs">Status</TableCell>
              </TableRow>
            </TableHeader>

            {/* Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    No system logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="py-3">
                      <div>
                        <div className="font-medium">{log.admin_name || "Unknown"}</div>
                        <div className="text-xs text-gray-500">{log.admin_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-gray-700">{log.action}</TableCell>
                    <TableCell className="py-3 text-gray-700">{log.description}</TableCell>
                    <TableCell className="py-3 text-gray-700">{log.entity_name || "-"}</TableCell>
                    <TableCell className="py-3 text-gray-700 capitalize">{log.entity_type}</TableCell>
                    <TableCell className={`py-3 font-medium ${
                      log.status === "success" ? "text-green-600" : "text-red-600"
                    }`}>
                      {log.status}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
