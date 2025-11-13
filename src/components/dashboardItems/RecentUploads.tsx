"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Image from "next/image";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { MoreDotIcon } from "@/icons";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useRef, useState } from "react";
import Link from "next/link";

type Files = {
  id: number;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  dimension: {
    id: number;
    name: string;
  } | null;
  folder: {
    id: number;
    name: string;
  } | null;
  uploaded_by: string;
  public_url: string;
  created_at: string;
};

export default function RecentUploads({ files }: { files: Files[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  
    const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "/images/icons/pdf.svg";
    if (fileType.includes("word") || fileType.includes("doc")) return "/images/icons/doc-icon.svg";
    if (fileType.includes("excel") || fileType.includes("xls")) return "/images/icons/excel-icon.svg";
    if (fileType.includes("powerpoint") || fileType.includes("ppt")) return "/images/icons/ppt-icon.svg";
    if (fileType.includes("text") || fileType.includes("txt")) return "/images/icons/txt-icon.svg";
    return "/images/icons/file-icon.svg"; // default
  };

  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  function toggleDropdown(id: number) {
    setOpenDropdownId(prev => (prev === id ? null : id));
  }
  
  function closeDropdown() {
    setOpenDropdownId(null);
  }  

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Files
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <Link href={"/dashboard/all-documents"} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            See all
          </Link>
        </div>
      </div>
<div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1102px]">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Document
                  </TableCell>
                  <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Dimension
                  </TableCell>
                  <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Upload Date
                  </TableCell>
                  <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Size
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center">
                          <Image
                            width={30}
                            height={30}
                            src={getFileIcon(file.file_type)}
                            alt={file.name}
                          />
                        </div>
                        <div>
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {file.name}
                          </span>
                          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                            {file.folder?.name || "-"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {file.dimension?.name || "N/A"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {new Date(file.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
