import React from "react";
import { ButtonTableProps, variantClasses } from "@/types/button/button";

const ButtonTable: React.FC<ButtonTableProps> = ({
  variant = "primary",
  icon,
  children,
  ...props
}) => {
  return (
    <button
      className={`flex items-center px-3 py-1 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 ${variantClasses[variant]}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default ButtonTable;
