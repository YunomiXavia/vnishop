import React from "react";
import Link from "next/link";

const SidebarNavItem = ({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: React.ComponentType<any>;
  label: string;
  isActive: boolean;
}) => (
  <Link href={href} passHref>
    <div
      className={`flex items-center p-3 text-sm rounded-lg transition-all duration-300 ease-in-out cursor-pointer mb-2 ${
        isActive
          ? "text-white bg-indigo-700 shadow-md"
          : "text-gray-300 hover:bg-indigo-700 hover:text-white"
      }`}
    >
      <Icon className="mr-3" />
      {label}
    </div>
  </Link>
);

export default SidebarNavItem;
