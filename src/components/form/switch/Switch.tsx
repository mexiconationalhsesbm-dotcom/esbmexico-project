"use client";
import React, { useState } from "react";

interface SwitchProps {
  id?: string;
  label?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  color?: "blue" | "gray";
}


const Switch: React.FC<SwitchProps> = ({
  id,
  label,
  checked,
  disabled = false,
  onCheckedChange,
  color = "blue",
}) => {
  const handleToggle = () => {
    if (disabled) return;
    onCheckedChange(!checked);
  };

  const switchColors =
    color === "blue"
      ? {
          background: checked
            ? "bg-brand-500"
            : "bg-gray-200 dark:bg-white/10",
          knob: checked
            ? "translate-x-full bg-white"
            : "translate-x-0 bg-white",
        }
      : {
          background: checked
            ? "bg-gray-800 dark:bg-white/10"
            : "bg-gray-200 dark:bg-white/10",
          knob: checked
            ? "translate-x-full bg-white"
            : "translate-x-0 bg-white",
        };

  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer select-none items-center gap-3 text-sm font-medium ${
        disabled ? "text-gray-400" : "text-gray-700 dark:text-gray-400"
      }`}
      onClick={handleToggle}
    >
      <div className="relative">
        <div
          className={`block h-6 w-11 rounded-full transition ${
            disabled
              ? "bg-gray-100 pointer-events-none dark:bg-gray-800"
              : switchColors.background
          }`}
        />
        <div
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow-theme-sm transform transition ${switchColors.knob}`}
        />
      </div>
      {label && <span>{label}</span>}
    </label>
  );
};


export default Switch;
