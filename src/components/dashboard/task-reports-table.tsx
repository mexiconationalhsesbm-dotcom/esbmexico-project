'use client';

import { useEffect, useState } from 'react';
import { FileSpreadsheet, Search } from 'lucide-react';
import { getRemarkBadgeStyle, formatTimestamp } from '@/libs/report-utils';
import Pagination from '../tables/Pagination';
import * as XLSX from "xlsx";
import Image from 'next/image';
import { DatePicker } from '../ui/calendar/date-picker';

type TaskLog = {
  id: string;
  timestamp: string;
  task_id: number;
  folder_id: string;
  dimension_id: string;
  action: string;
  actor_id: string;
  actor_role: string;
  description: string;
  remarks: string;
  task_title: string;
  folder_name: string;
  dimension_name: string;
  actor_name: string;
  actor_email: string;
  due: string;
};

export function TaskReportsTable() {
    
const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const dateStr = selectedDate.toISOString().split("T")[0];
        setLoading(true);
        const response = await fetch(
          `/api/tasks/reports?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}&date=${dateStr}`
        );
        const result = await response.json();

        if (result.error) {
          console.error("[v0] Error fetching reports:", result.error);
          return;
        }

        setLogs(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalRecords(result.pagination.totalRecords);
      } catch (error) {
        console.error("[v0] Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [page, pageSize, search, selectedDate]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setPage(1);
    }
  };

  const exportToExcel = () => {
  if (logs.length === 0) {
    alert("No data to export");
    return;
  }

  // Convert logs to worksheet-friendly format
  const worksheetData = logs.map((log) => ({
    Timestamp: formatTimestamp(log.timestamp),
    "Task Title": log.task_title,
    "Folder Name": log.folder_name,
    Dimension: log.dimension_name,
    Action: log.action,
    Actor: log.actor_name,
    "Actor Email": log.actor_email,
    Description: log.description,
    Remarks: log.remarks,
  }));

  // Create worksheet & workbook
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Task Reports");

  // Optional: auto-size columns
  const columnWidths = Object.keys(worksheetData[0]).map((key) => ({
    wch: Math.max(
      key.length,
      ...worksheetData.map((row) => String(row[key as keyof typeof row]).length)
    ),
  }));
  worksheet["!cols"] = columnWidths;

  // Export file
  XLSX.writeFile(workbook, `Task-Reports-${selectedDate}.xlsx`);
};


  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            Total Records: <span className="font-semibold">{totalRecords}</span>
          </div>
          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
            title="Export to Excel"
          >
            <Image src="/images/icons/excel-icon.svg" width={20} height={20} alt=""/>
            <span className="text-sm font-medium">Export</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <DatePicker
            date={selectedDate}
            onDateChange={handleDateChange}
            placeholder="Select date"
            className='w-60'
          />
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
                    placeholder="Search task, folder, actor, remarks..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-white dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                  />
            </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-x-auto bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Timestamp</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Dimension</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Folder Name</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Task</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Due Date</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Person</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Action</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Description</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Loading reports...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No reports found
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const badgeStyle = getRemarkBadgeStyle(log.remarks);
                return (
                  <tr
                    key={log.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-foreground">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {log.dimension_name}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {log.folder_name}
                    </td>
                    <td className="px-4 py-3 text-foreground max-w-xs truncate">
                      {log.task_title}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {formatTimestamp(log.due)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-50">{log.actor_name || "Unknown"}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{log.actor_email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-foreground max-w-sm">
                      {log.description}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${badgeStyle}`}
                      >
                        {log.remarks}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
    </div>
  );
}
