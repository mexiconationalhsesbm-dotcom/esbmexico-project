"use client";
import React, { useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Pagination from "./Pagination";
// ✅ import your pagination component

type Files = {
  id: number;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  dimension: { id: number; name: string, slug: string } | null;
  folder: { id: number; name: string } | null;
  uploaded_by: string;
  public_url: string;
  created_at: string;
};

export default function AllDocumentsTable({
  files,
  currentPage,
  totalPages,
  searchQuery,
}: {
  files: Files[];
  currentPage: number;
  totalPages: number;
  searchQuery: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery || "");

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "/images/icons/pdf.svg";
    if (fileType.includes("word") || fileType.includes("doc"))
      return "/images/icons/doc-icon.svg";
    if (fileType.includes("excel") || fileType.includes("xls"))
      return "/images/icons/excel-icon.svg";
    if (fileType.includes("powerpoint") || fileType.includes("ppt"))
      return "/images/icons/ppt-icon.svg";
    if (fileType.includes("text") || fileType.includes("txt"))
      return "/images/icons/txt-icon.svg";
    return "/images/icons/file-icon.svg";
  };

  // navigate preserving query
  const goToPage = (page: number) => {
    router.push(`?page=${page}&query=${encodeURIComponent(search)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`?page=1&query=${encodeURIComponent(search)}`);
  };

  return (
    <div>
      {/* 🔍 Search Bar */}
      <div className="pb-6 flex justify-end">
        <form onSubmit={handleSearch}>
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search Document"
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
            />
          </div>
        </form>
      </div>

      {/* 📄 Table */}
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
                {files.length > 0 ? (
                  files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <Image
                            width={30}
                            height={30}
                            src={getFileIcon(file.file_type)}
                            alt={file.name}
                          />
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {file.name}
                            </span>
                            <span
                              onClick={() => {
                                if (file.dimension?.slug && file.folder?.id) {
                                  router.push(`/dashboard/${file.dimension.slug}/${file.folder.id}`);
                                }
                              }}
                              className="block text-gray-500 text-theme-xs dark:text-gray-400 cursor-pointer hover:underline"
                            >
                              {file.folder?.name || "-"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {file.dimension?.name || "N/A"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {new Date(file.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {file.file_size
                          ? `${Math.round(file.file_size / 1024)} KB`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-6 text-gray-500 dark:text-gray-400"
                    >
                      No documents found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* 🧭 Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}
    </div>
  );
}
