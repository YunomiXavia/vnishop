import Link from "next/link";
import { NavItemProps } from "@/types/component/nav/nav";
import React from "react";

const NavItem: React.FC<NavItemProps> = ({ href, icon: Icon, label }) => {
  if (!Icon) {
    return null;
  }

  return (
    <Link href={href} passHref>
      <div
        className="flex items-center p-3 bg-indigo-800 rounded-lg
        hover:bg-indigo-700 transition-colors duration-200 mb-2"
      >
        <Icon className="mr-3" />
        <span>{label}</span>
      </div>
    </Link>
  );
};

export default NavItem;
