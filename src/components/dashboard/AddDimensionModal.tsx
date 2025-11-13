"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Button2 from "../ui/button/Button";
import { Input } from "@/components/ui/input";

interface AddDimensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}

export default function AddDimensionModal({ isOpen, onClose, onAdd }: AddDimensionModalProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    await onAdd(name);
    setIsSubmitting(false);
    setName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="backdrop-blur-sm bg-white/90 dark:bg-neutral-900/90">
        <DialogHeader>
          <DialogTitle>Add New Dimension</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dimension Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter dimension name..."
          />
        </div>

        <DialogFooter className="mt-4">
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button2 onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? "Creating..." : "Create"}
          </Button2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
