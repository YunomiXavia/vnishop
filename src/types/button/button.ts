import React from "react";

export interface ButtonTableProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "success" | "info" | "warning";
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const variantClasses: Record<string, string> = {
  primary: "bg-indigo-500 hover:bg-indigo-600 text-white",
  danger: "bg-red-500 hover:bg-red-600 text-white",
  success: "bg-green-500 hover:bg-green-600 text-white",
  info: "bg-blue-500 hover:bg-blue-600 text-white",
  warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
};
