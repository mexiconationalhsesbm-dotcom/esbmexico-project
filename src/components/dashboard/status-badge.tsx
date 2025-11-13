import type { FolderStatus } from "@/types"
import Badge from "../ui/badge/Badge";

interface StatusBadgeProps {
  status: "draft" | "for_checking" | "checked" | "revisions";
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const statusConfig = {
    draft: {
      label: "Draft",
      description: "Members can edit and upload files",
      color: "info" as const,
    },
    for_checking: {
      label: "For Checking",
      description: "Awaiting leader review",
      color: "warning" as const,
    },
    checked: {
      label: "Checked",
      description: "Members can only download and request revision",
      color: "success" as const,
    },
    revisions: {
      label: "Revisions",
      description: "Members can edit again",
      color: "primary" as const,
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <Badge color={config.color} size={size}>
        {config.label}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {config.description}
      </span>
    </div>
  );
}

