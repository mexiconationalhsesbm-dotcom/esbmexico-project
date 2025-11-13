"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "../ui/modal";
import Button from "@/components/ui/button/Button";
import { Button as TrashButton } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, ChevronDownIcon } from "lucide-react";
import { supabase } from "@/libs/supabase";
import type { Dimension } from "@/types";
import Select from "../form/Select";
import { useAlert } from "@/context/AlertContext";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: "file" | "folder";
  itemId: number;
  itemName: string;
  currentDimensionId: number;
  onSuccess: () => void;
}

interface ShareEntry {
  dimensionId: number;
  accessLevel: "view" | "full_access";
  isExisting?: boolean;
  shareId?: number;
}

export function ShareModal({
  isOpen,
  onClose,
  itemType,
  itemId,
  itemName,
  currentDimensionId,
  onSuccess,
}: ShareModalProps) {
  const router = useRouter();
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [shareEntries, setShareEntries] = useState<ShareEntry[]>([]);
  const [originalShareEntries, setOriginalShareEntries] = useState<ShareEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {showAlert} = useAlert();

  const fetchData = useCallback(async () => {
  setIsLoading(true);
  setError(null);

  try {
    const { data: dimensionsData, error: dimensionsError } = await supabase
      .from("dimensions")
      .select("*")
      .neq("id", currentDimensionId)
      .order("name");

    if (dimensionsError) throw dimensionsError;
    setDimensions(dimensionsData || []);

    const { data: existingShares, error: sharesError } = await supabase
      .from("shared_items")
      .select("*")
      .eq("item_type", itemType)
      .eq("item_id", itemId)
      .eq("shared_from_dimension_id", currentDimensionId);

    if (sharesError) throw sharesError;

    const entries: ShareEntry[] = (existingShares || []).map((share) => ({
      dimensionId: share.shared_to_dimension_id,
      accessLevel: share.access_level as "view" | "full_access",
      isExisting: true,
      shareId: share.id,
    }));

    setShareEntries(entries);
    setOriginalShareEntries(entries);
  } catch (err: any) {
    console.error("Error fetching data:", err);
    setError("Failed to load sharing data");
  } finally {
    setIsLoading(false);
  }
}, [itemType, itemId, currentDimensionId]);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);


  const addShareEntry = () =>
    setShareEntries([...shareEntries, { dimensionId: 0, accessLevel: "view" }]);

  const updateShareEntry = (index: number, field: keyof ShareEntry, value: any) => {
    const updated = [...shareEntries];
    updated[index] = { ...updated[index], [field]: value };
    setShareEntries(updated);
  };

  const removeShareEntry = (index: number) =>
    setShareEntries(shareEntries.filter((_, i) => i !== index));

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const validEntries = shareEntries.filter((entry) => entry.dimensionId > 0);
      const dimensionIds = validEntries.map((entry) => entry.dimensionId);
      const uniqueDimensionIds = new Set(dimensionIds);

      if (dimensionIds.length !== uniqueDimensionIds.size)
        throw new Error("Cannot share to the same dimension multiple times");

      for (const entry of validEntries) {
        if (entry.isExisting && entry.shareId) {
          const { error: updateError } = await supabase
            .from("shared_items")
            .update({
              shared_to_dimension_id: entry.dimensionId,
              access_level: entry.accessLevel,
              updated_at: new Date().toISOString(),
            })
            .eq("id", entry.shareId);
          if (updateError) throw updateError;
        } else if (!entry.isExisting) {
          const { error: insertError } = await supabase.from("shared_items").insert({
            item_type: itemType,
            item_id: itemId,
            shared_from_dimension_id: currentDimensionId,
            shared_to_dimension_id: entry.dimensionId,
            access_level: entry.accessLevel,
          });
          if (insertError) throw insertError;
        }
      }

      const removedShares = originalShareEntries.filter(
        (originalEntry) =>
          !validEntries.some(
            (entry) => entry.isExisting && entry.shareId === originalEntry.shareId
          )
      );
      const sharesToDelete = removedShares.map((entry) => entry.shareId).filter(Boolean);
      if (sharesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("shared_items")
          .delete()
          .in("id", sharesToDelete);
        if (deleteError) throw deleteError;
      }

      onSuccess();
      showAlert({
        type: "success",
        title: `Share permissions update`,
        message: `Share permissions to ${itemType} ${itemName} successfully updated.`,
      });
      onClose();
    } catch (err: any) {
      console.error("Error saving shares:", err);
      setError(err.message || "Failed to save sharing settings");
      showAlert({
        type: "error",
        title: `Share permissions failed to save.`,
        message: "Failed to save sharing setting.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getDimensionName = (dimensionId: number) => {
    const dimension = dimensions.find((d) => d.id === dimensionId);
    return dimension?.name || "Unknown Dimension";
  };

  const getAvailableDimensions = (currentIndex: number) => {
    const currentSelectedId = shareEntries[currentIndex].dimensionId;
    const usedDimensionIds = shareEntries
      .filter((_, index) => index !== currentIndex)
      .map((entry) => entry.dimensionId);

    return dimensions.filter(
      (dimension) =>
        !usedDimensionIds.includes(dimension.id) &&
        dimension.id !== currentSelectedId
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] w-full max-h-[90vh]">
      <div className="relative flex flex-col w-full max-w-[700px] rounded-3xl bg-white dark:bg-gray-900 p-6">
        {/* Header */}
        <div>
          <h4 className="mb-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Share {itemType}
          </h4>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Configure which dimensions can access <b>{itemName}</b> and their permission level.
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
          {error && (
            <div className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : (
            <>
              {shareEntries.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  No sharing configured. Click “Add Share” to start sharing.
                </div>
              ) : (
                <div className="space-y-3">
                  {shareEntries.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 border rounded-lg dark:border-gray-700"
                    >
                      {/* Dimension Select */}
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500 dark:text-gray-400">
                          Dimension
                        </Label>
                        <div className="relative">
                          <Select
                            options={[
                              ...(entry.dimensionId > 0
                                ? [
                                    {
                                      value: entry.dimensionId.toString(),
                                      label: getDimensionName(entry.dimensionId),
                                    },
                                  ]
                                : []),
                              ...getAvailableDimensions(index).map((d) => ({
                                value: d.id.toString(),
                                label: d.name,
                              })),
                            ]}
                            placeholder="Select dimension"
                            defaultValue={
                              entry.dimensionId > 0 ? entry.dimensionId.toString() : ""
                            }
                            onChange={(value) =>
                              updateShareEntry(index, "dimensionId", Number.parseInt(value))
                            }
                            className="mt-1"
                          />
                          <span className="absolute text-gray-500 dark:text-gray-400 right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDownIcon />
                          </span>
                        </div>
                      </div>

                      {/* Access Level Select */}
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500 dark:text-gray-400">
                          Access Level
                        </Label>
                        <div className="relative">
                          <Select
                            options={[
                              { value: "view", label: "View Only" },
                              { value: "full_access", label: "Full Access" },
                            ]}
                            placeholder="Select access"
                            defaultValue={entry.accessLevel}
                            onChange={(value) =>
                              updateShareEntry(index, "accessLevel", value as "view" | "full_access")
                            }
                            className="mt-1"
                          />
                          <span className="absolute text-gray-500 dark:text-gray-400 right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDownIcon />
                          </span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <TrashButton
                        variant="ghost"
                        onClick={() => removeShareEntry(index)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </TrashButton>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" onClick={addShareEntry} className="w-full mt-5">
                <Plus className="h-4 w-4 mr-2" />
                Add Share
              </Button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
