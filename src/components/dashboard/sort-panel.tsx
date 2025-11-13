"use client"
import { useState } from "react"
import Button from "@/components/ui/button/Button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import Radio from "../form/input/Radio"

export type SortField = "name" | "type" | "size" | "date" | "role"
export type SortOrder = "asc" | "desc"

export interface SortOptions {
  field: SortField
  order: SortOrder
}

interface SortPanelProps {
  isOpen: boolean
  onClose: () => void
  options: SortOptions
  onSort: (options: SortOptions) => void
  title: string
  availableFields?: SortField[]

  // Optional props for filtering
  dimensionFilter?: string
  onDimensionFilterChange?: (value: string) => void
  roleFilter?: string
  onRoleFilterChange?: (value: string) => void
}

export function SortPanel({
  isOpen,
  onClose,
  options,
  onSort,
  title,
  availableFields = ["name", "type", "size", "date"],
  dimensionFilter,
  onDimensionFilterChange,
  roleFilter,
  onRoleFilterChange,
}: SortPanelProps) {
  const [field, setField] = useState<SortField>(options.field)
  const [order, setOrder] = useState<SortOrder>(options.order)

  const handleSort = () => {
    onSort({ field, order })
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Sorting Section */}
          <div className="space-y-3">
            <div className="text-md">Sort By</div>
            <div className="flex flex-col space-y-2">
              {availableFields.includes("name") && (
                <Radio
                  id={`sort-name-${title}`}
                  name="sortField"
                  value="name"
                  checked={field === "name"}
                  onChange={() => setField("name")}
                  label="Name"
                />
              )}
              {availableFields.includes("type") && (
                <Radio
                  id={`sort-type-${title}`}
                  name="sortField"
                  value="type"
                  checked={field === "type"}
                  onChange={() => setField("type")}
                  label="Type"
                />
              )}
              {availableFields.includes("size") && (
                <Radio
                  id={`sort-size-${title}`}
                  name="sortField"
                  value="size"
                  checked={field === "size"}
                  onChange={() => setField("size")}
                  label="Size"
                />
              )}
              {availableFields.includes("date") && (
                <Radio
                  id={`sort-date-${title}`}
                  name="sortField"
                  value="date"
                  checked={field === "date"}
                  onChange={() => setField("date")}
                  label="Date Modified"
                />
              )}
              {availableFields.includes("role") && (
                <Radio
                  id={`sort-role-${title}`}
                  name="sortField"
                  value="role"
                  checked={field === "role"}
                  onChange={() => setField("role")}
                  label="Role"
                />
              )}
            </div>
          </div>

          {/* Order Section */}
          <div className="space-y-3">
            <div className="text-md">Order</div>
            <div className="flex flex-col space-y-2">
              <Radio
                id={`sort-asc-${title}`}
                name="sortOrder"
                value="asc"
                checked={order === "asc"}
                onChange={() => setOrder("asc")}
                label="Ascending"
              />
              <Radio
                id={`sort-desc-${title}`}
                name="sortOrder"
                value="desc"
                checked={order === "desc"}
                onChange={() => setOrder("desc")}
                label="Descending"
              />
            </div>
          </div>

          {/* Dimension Filter (optional) */}
          {dimensionFilter !== undefined && onDimensionFilterChange && (
            <div className="space-y-3">
              <div className="text-md">Filter by Dimension</div>
              <div className="flex flex-col space-y-2">
                {[
                  { value: "", label: "All Dimensions" },
                  { value: "1", label: "Leadership" },
                  { value: "2", label: "Governance" },
                  { value: "3", label: "Curriculum and Instructions" },
                  { value: "4", label: "Human Resource and Team Development" },
                  { value: "5", label: "Resource Management and Mobilization" },
                  { value: "6", label: "Learning Environment" },
                ].map((option) => (
                  <Radio
                    key={option.value}
                    id={`dimension-${option.value}-${title}`}
                    name="dimensionFilter"
                    value={option.value}
                    checked={dimensionFilter === option.value}
                    onChange={() => onDimensionFilterChange(option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Role Filter (optional) */}
          {roleFilter !== undefined && onRoleFilterChange && (
            <div className="space-y-3">
              <div className="text-md">Filter by Role</div>
              <div className="flex flex-col space-y-2">
                {[
                  { value: "", label: "All Roles" },
                  { value: "Unassigned", label: "Unassigned" },
                  { value: "Overall Focal Person", label: "Overall Focal Person" },
                  { value: "Dimension Leader", label: "Dimension Leader" },
                  { value: "Dimension Member", label: "Dimension Member" },
                ].map((option) => (
                  <Radio
                    key={option.value}
                    id={`role-${option.value}-${title}`}
                    name="roleFilter"
                    value={option.value}
                    checked={roleFilter === option.value}
                    onChange={() => onRoleFilterChange(option.value)}
                    label={option.label}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <SheetFooter>
          <Button onClick={handleSort}>Apply Sort</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
