"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useAlert } from "@/context/AlertContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { createClient } from "@/utils/supabase/client";
import { ArrowUpDown, Pencil, Trash2, Check, X, Plus, Loader2 } from "lucide-react";
import Button from "../ui/button/Button"
import AddDimensionModal from "../dashboard/AddDimensionModal";
import ConfirmDeleteDimension from "../modals/ConfirmDeleteDimension";

type Dimension = {
  id: string;
  name: string;
  created_at: string;
};

type SortOptions = {
  field: "name" | "created_at";
  order: "asc" | "desc";
};

export default function DimensionsTable({ data }: { data: Dimension[] }) {
  const supabase = createClient();

  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dimensionsList, setDimensionsList] = useState<Dimension[]>(data);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: "name",
    order: "asc",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // 🟢 For Add modal

  const { showAlert } = useAlert();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
        const fetchUser = async () => {
          const { data, error } = await supabase.auth.getUser();
          if (!error && data?.user) setCurrentUser(data.user);
          setIsLoading(false)
        };
        fetchUser();
      }, [supabase]);
  
      const logSystemActivity = async ({
        userId,
        action,
        entityType,
        status,
        description
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

  const confirmDelete = (id: string) => {
    setSelectedId(id);
    setShowModal(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!selectedId) return;
    setIsDeleting(true);

    const { error } = await supabase.from("dimensions").delete().eq("id", selectedId);

    if (error) {
      await logSystemActivity({
      userId: currentUser?.id,
      action: "DELETE_DIMENSION",
      entityType: "dimension",
      status: "failed",
      description: `Failed to delete dimension ID: ${selectedId}. Error: ${error.message}`,
    });

      showAlert({
        type: "error",
        title: "Deletion Failed",
        message: error.message,
      });
      setIsDeleting(false);
      return;
    }

    setDimensionsList((prev) => prev.filter((dimension) => dimension.id !== selectedId));
    await logSystemActivity({
      userId: currentUser?.id,
      action: "DELETE_DIMENSION",
      entityType: "dimension",
      status: "success",
      description: `Deleted dimension with ID: ${selectedId}.`,
    });

    showAlert({
      type: "success",
      title: "Deleted",
      message: "The dimension was successfully deleted.",
    });
    setShowModal(false);
    setSelectedId(null);
    setIsDeleting(false);
  };

  const startEditing = (dimension: Dimension) => {
    setEditingId(dimension.id);
    setEditValue(dimension.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from("dimensions").update({ name: editValue }).eq("id", id);

    if (error) {
      await logSystemActivity({
      userId: currentUser?.id,
      action: "UPDATE_DIMENSION",
      entityType: "dimension",
      status: "failed",
      description: `Failed to update dimension ID: ${id}. Error: ${error.message}`,
    });

      showAlert({
        type: "error",
        title: "Update Failed",
        message: error.message,
      });
      return;
    }

    setDimensionsList((prev) =>
      prev.map((dimension) => (dimension.id === id ? { ...dimension, name: editValue } : dimension))
    );
    setEditingId(null);
    setEditValue("");
     await logSystemActivity({
    userId: currentUser?.id,
    action: "UPDATE_DIMENSION",
    entityType: "dimension",
    status: "success",
    description: `Updated dimension ID: ${id} to new name "${editValue}".`,
  });
    showAlert({
      type: "success",
      title: "Updated",
      message: "The dimension was renamed successfully.",
    });
  };

const createSlug = (name: string) => {
  return (
    name
      .toLowerCase()                       
      .replace(/[^a-z0-9\s]/g, "")         
      .split(/\s+/)                      
      .map((word, index) =>
        index === 0
          ? word                         
          : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join("") + "Files"                 
  );
};


  // 🟢 Add new dimension
  const handleAddDimension = async (name: string) => {
  const slug = createSlug(name);

  const { data, error } = await supabase
    .from("dimensions")
    .insert([{ name, slug }]) // ✅ Include slug in insert
    .select()
    .single();

  if (error) {
    await logSystemActivity({
      userId: currentUser?.id,
      action: "CREATE_DIMENSION",
      entityType: "dimension",
      status: "failed",
      description: `Failed to create dimension "${name}". Error: ${error.message}`,
    });
    showAlert({
      type: "error",
      title: "Creation Failed",
      message: error.message,
    });
    return;
  }

  setDimensionsList((prev) => [data, ...prev]);
  await logSystemActivity({
    userId: currentUser?.id,
    action: "CREATE_DIMENSION",
    entityType: "dimension",
    status: "success",
    description: `Created new dimension: "${name}".`,
  });
  showAlert({
    type: "success",
    title: "Created",
    message: "The new dimension was successfully added.",
  });
};

  // Search + Sort
  const filteredDimensions = useMemo(() => {
    if (!searchQuery.trim()) return dimensionsList;
    return dimensionsList.filter((d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dimensionsList, searchQuery]);

  const sortedDimensions = useMemo(() => {
    const sorted = [...filteredDimensions];
    switch (sortOptions.field) {
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "created_at":
        sorted.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
    }
    if (sortOptions.order === "desc") sorted.reverse();
    return sorted;
  }, [filteredDimensions, sortOptions]);

  const toggleSort = (field: "name" | "created_at") => {
    setSortOptions((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      {/* Search + Add Button */}
      <div className="pb-6 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Dimensions</h2>

        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="Search dimensions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="dark:bg-dark-900 h-11 rounded-lg border border-gray-200 bg-transparent py-2.5 pl-4 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
          />

          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Dimension
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[600px]">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/5">
                <TableRow>
                  <TableCell
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer"
                    onClick={() => toggleSort("name")}
                  >
                    Name <ArrowUpDown className="inline-block w-4 h-4 ml-1" />
                  </TableCell>
                  <TableCell
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer"
                    onClick={() => toggleSort("created_at")}
                  >
                    Created At <ArrowUpDown className="inline-block w-4 h-4 ml-1" />
                  </TableCell>
                  <TableCell className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                {sortedDimensions.map((dimension) => (
                  <TableRow key={dimension.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      {editingId === dimension.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                          />
                          <button onClick={() => saveEdit(dimension.id)} className="text-green-600">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEditing} className="text-red-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {dimension.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      {new Date(dimension.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-2 py-1 text-gray-500 text-theme-sm dark:text-gray-400">
                      <div className="flex flex-row justify-center items-center gap-4">
                        {editingId !== dimension.id && (
                          <button onClick={() => startEditing(dimension)} className="text-blue-600">
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => confirmDelete(dimension.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4" />
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

      {/* Modals */}
      <ConfirmDeleteDimension
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDeleteConfirmed}
        isLoading={isDeleting}
      />

      {/* 🟢 Add Dimension Modal */}
      <AddDimensionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddDimension}
      />
    </div>
  );
}
