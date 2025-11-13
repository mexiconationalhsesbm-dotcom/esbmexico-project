import React from "react";

type BadgeVariant = "light" | "solid";
type BadgeSize = "sm" | "md";
type BadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark";

interface BadgeProps {
  variant?: BadgeVariant; // Light or solid variant
  size?: BadgeSize; // Badge size
  color?: BadgeColor; // Badge color
  startIcon?: React.ReactNode; // Icon at the start
  endIcon?: React.ReactNode; // Icon at the end
  className?: string; // Additional CSS classes
  children: React.ReactNode; // Badge content
}

const Badge: React.FC<BadgeProps> = ({
  variant = "light",
  color = "primary",
  size = "md",
  startIcon,
  endIcon,
  children,
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium transition-colors";

  // Define size styles
  const sizeStyles = {
    sm: "text-theme-xs",
    md: "text-sm",
  };

  // Define color styles for variants
  const variants = {
    light: {
      primary:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      success:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      error:
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      warning:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      info:
        "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
      light:
        "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
      dark:
        "bg-gray-600 text-white dark:bg-gray-800",
    },
    solid: {
      primary: "bg-blue-600 text-white",
      success: "bg-green-600 text-white",
      error: "bg-red-600 text-white",
      warning: "bg-yellow-600 text-white",
      info: "bg-sky-600 text-white",
      light: "bg-gray-300 text-gray-800",
      dark: "bg-gray-900 text-white",
    },
  };

  // Combine all class names manually
  const combinedClasses = [
    baseStyles,
    sizeStyles[size],
    variants[variant][color],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={combinedClasses} {...props}>
      {startIcon && <span className="mr-1">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-1">{endIcon}</span>}
    </span>
  );
};

export default Badge;
