"use client";

import React, { useRef, useState } from "react";
import { Upload, AlertCircle, FolderIcon, FileIcon } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/auth-context";
import { Modal } from "../ui/modal";

interface UploadFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  dimensionId: number;
  currentFolderId: number | null;
  onSuccess: () => void;
  folderStatus?: "draft" | "for_checking" | "checked" | "revisions";
}

interface FileTreeNode {
  name: string;
  type: "file" | "folder";
  size?: number;
  children?: FileTreeNode[];
}

export default function UploadFolderModal({
  isOpen,
  onClose,
  dimensionId,
  currentFolderId,
  onSuccess,
  folderStatus = "draft",
}: UploadFolderModalProps) {
  const { isDimensionLeader, isMasterAdmin } = useAuth();

  const [files, setFiles] = useState<File[]>([]);
  const [tree, setTree] = useState<FileTreeNode | null>(null);
  const [progress, setProgress] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const filePathMap = useRef<Map<File, string>>(new Map());
  const rootFolderName = useRef<string>("");

  const canUpload = () =>
    isMasterAdmin || isDimensionLeader || folderStatus === "draft" || folderStatus === "revisions";

  /* ==========================================
   * PICK FOLDER
   * ========================================== */
  const pickFolder = async () => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      rootFolderName.current = dirHandle.name;

      filePathMap.current.clear();
      setError(null);

      const collected = await readDirectory(dirHandle, "");

      if (collected.length === 0) {
        setError("Selected folder is empty.");
        return;
      }

      setFiles(collected);
      setTree(buildTree(collected));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to pick folder.");
    }
  };

  /* ==========================================
   * RECURSIVE FOLDER READING
   * ========================================== */
  const readDirectory = async (dirHandle: any, basePath: string) => {
    const list: File[] = [];

    for await (const [name, entry] of dirHandle.entries()) {
      const full = basePath ? `${basePath}/${name}` : name;

      if (entry.kind === "file") {
        const file = await entry.getFile();
        filePathMap.current.set(file, full);
        list.push(file);
      }

      if (entry.kind === "directory") {
        const nested = await readDirectory(entry, full);
        list.push(...nested);
      }
    }

    return list;
  };

  /* ==========================================
   * BUILD PREVIEW TREE
   * ========================================== */
  const buildTree = (files: File[]) => {
    const root: FileTreeNode = {
      name: rootFolderName.current,
      type: "folder",
      children: [],
    };

    const dirMap: Record<string, FileTreeNode> = { "": root };

    for (const file of files) {
      const rel = filePathMap.current.get(file)!;
      const parts = rel.split("/");

      let current = "";

      // build folders
      for (let i = 0; i < parts.length - 1; i++) {
        const segment = parts[i];
        const prev = current;
        current = prev ? `${prev}/${segment}` : segment;

        if (!dirMap[current]) {
          const folderNode: FileTreeNode = {
            name: segment,
            type: "folder",
            children: [],
          };
          dirMap[prev].children!.push(folderNode);
          dirMap[current] = folderNode;
        }
      }

      // file node
      const fileNode: FileTreeNode = {
        name: file.name,
        type: "file",
        size: file.size,
      };

      const parentPath = parts.slice(0, -1).join("/") || "";
      dirMap[parentPath].children!.push(fileNode);
    }

    return root;
  };

  /* ==========================================
   * FAKE PROGRESS HELPERS
   * ========================================== */
  const fakeStep = (from: number, to: number, label: string, speed = 20) =>
    new Promise<void>((resolve) => {
      let value = from;
      const tick = () => {
        value += 2 + Math.random() * 5;

        if (value >= to) {
          setProgress(`${label} ${to}%`);
          setProgressPercent(to);
          resolve();
          return;
        }

        setProgress(`${label} ${Math.round(value)}%`);
        setProgressPercent(Math.round(value));
        setTimeout(tick, speed);
      };
      tick();
    });

  /* ==========================================
   * UPLOAD
   * ========================================== */
  const upload = async () => {
    if (!files.length) return setError("Select a folder first.");
    if (!canUpload()) return setError("Uploads are disabled.");

    setUploading(true);
    setError(null);

    try {
      /* STAGE 1 — PACKING (0 → 40%) */
      setProgress("Packing files... 0%");
      setProgressPercent(0);
      await fakeStep(0, 40, "Packing files...");

      // Build FormData
      const fd = new FormData();
      fd.append("dimensionId", String(dimensionId));
      if (currentFolderId !== null) fd.append("parentFolderId", String(currentFolderId));

      /* Generate folder structure */
      const folderSet = new Set<string>();
      for (const file of files) {
        const rel = filePathMap.current.get(file)!;
        const dirs = rel.split("/").slice(0, -1);

        let current = "";
        for (const segment of dirs) {
          current = current ? `${current}/${segment}` : segment;
          folderSet.add(current);
        }
      }

      let folderIndex = 0;

      // Root
      fd.append(
        `folders_${folderIndex++}`,
        JSON.stringify({
          name: rootFolderName.current,
          path: rootFolderName.current,
          type: "folder",
        })
      );

      // Subfolders
      for (const p of folderSet) {
        fd.append(
          `folders_${folderIndex++}`,
          JSON.stringify({
            name: p.split("/").pop(),
            path: `${rootFolderName.current}/${p}`,
            type: "folder",
          })
        );
      }

      // Files
      for (const file of files) {
        const rel = filePathMap.current.get(file)!;
        const fullPath = `${rootFolderName.current}/${rel}`;
        const encoded = fullPath.replace(/\//g, "__");
        fd.append(`file_${encoded}`, file);
      }

      /* STAGE 2 — UPLOADING (40 → 90%) */
      setProgress("Uploading... 40%");
      await fakeStep(40, 90, "Uploading...", 25);

      const res = await fetch("/api/folders/upload-folder", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Upload failed");
      }

      /* STAGE 3 — FINALIZING (90 → 100%) */
      setProgress("Finalizing... 90%");
      await fakeStep(90, 100, "Finalizing...", 30);

      setProgress("Completed!");
      setProgressPercent(100);

      setTimeout(() => {
        setUploading(false);
        onSuccess();
        onClose();
      }, 400);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Upload failed");
      setUploading(false);
      setProgress("Upload failed");
      setProgressPercent(100);
    }
  };

  /* ==========================================
   * RESET
   * ========================================== */
  const reset = () => {
    setFiles([]);
    setTree(null);
    setProgress("");
    setProgressPercent(0);
    setError(null);
    filePathMap.current.clear();
    rootFolderName.current = "";
  };

  /* ==========================================
   * RENDER TREE
   * ========================================== */
  const renderTree = (node: FileTreeNode | null) => {
    if (!node) return null;

    return (
      <div>
        <div className="flex items-center gap-2 font-medium">
          {node.type === "folder" ? (
            <FolderIcon className="h-4 w-4 text-blue-500" />
          ) : (
            <FileIcon className="h-4 w-4 text-gray-500" />
          )}
          {node.name}
        </div>

        {node.children?.length ? (
          <div className="ml-6 mt-1 space-y-1">
            {node.children.map((c, i) => (
              <div key={i}>{renderTree(c)}</div>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  /* ==========================================
   * UI
   * ========================================== */
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      className="max-w-[700px] m-4"
    >
      <div className="relative w-full max-w-[700px] rounded-3xl bg-white dark:bg-gray-900 p-4 lg:p-11">
        {/* HEADER */}
        <div className="px-2">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Upload Folder
          </h4>
          {/* PROGRESS OR DESCRIPTION */}
          {progress ? (
            <div className="space-y-3 mt-2 mb-4">
              <p
                className={`text-sm font-medium ${
                  error ? "text-red-500" : progressPercent === 100 ? "text-green-600" : "text-blue-600"
                }`}
              >
                {error ? error : progress}
              </p>

              <div className="w-full h-3 bg-gray-300/60 dark:bg-gray-700/60 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className={`
                    h-full transition-all duration-300 ease-out
                    ${
                      error
                        ? "bg-red-500"
                        : progressPercent === 100
                        ? "bg-green-500"
                        : "bg-linear-to-r from-blue-500 to-blue-400"
                    }
                  `}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Select a folder — its structure will be preserved on upload.
            </p>
          )}

        </div>

        {!canUpload() && (
          <p className="text-red-600 flex items-center gap-2 px-2">
            <AlertCircle className="h-4 w-4" />
            Uploads are disabled in this folder state.
          </p>
        )}

        {/* SCROLLABLE AREA */}
        <div className="overflow-y-scroll custom-scrollbar max-h-[400px] px-2 pb-3 space-y-4">
          {/* PICK FOLDER */}
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onClick={pickFolder}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Click to select a folder</span>
              </div>
            </div>
          </div>

          {/* TREE PREVIEW */}
          {tree ? (
            <div className="border rounded-lg p-4 bg-gray-100 dark:bg-gray-800 max-h-[300px] overflow-y-auto custom-scrollbar">
              {renderTree(tree)}
            </div>
          ) : (
            <div className="border border-dashed rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
              No folder selected
            </div>
          )}

          {/* ERROR */}
          {error && <p className="text-sm text-red-600">{error}</p>}


        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 mt-6 px-2">
          <Button
            variant="outline"
            disabled={uploading}
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>

          {files.length > 0 && (
            <Button variant="outline" onClick={reset} disabled={uploading}>
              Clear
            </Button>
          )}

          <Button disabled={!files.length || uploading || !canUpload()} onClick={upload}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
