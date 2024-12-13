"use client";

import { SidebarProps } from "@/types/component/sidebar/SidebarProps";
import { useRouter, usePathname } from "next/navigation";
import { logout } from "@/store/authentication/authSlice";
import SidebarSection from "@/components/sidebar/components/SidebarSection";
import SidebarNavItem from "@/components/sidebar/components/SidebarNavItem";
import { FaAddressBook, FaArrowLeft, FaSignOutAlt } from "react-icons/fa";
import Link from "next/link";
import { useAppDispatch } from "@/store/hooks";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

const Sidebar = ({ menuItems = [] }: SidebarProps) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [roleName, setRoleName] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data from Session Cookies
    const sessionUsername = Cookies.get("username");
    const sessionEmail = Cookies.get("email");
    const sessionRole = Cookies.get("role");

    const roleName = sessionRole ? sessionRole.replace(/^ROLE_/, "") : null;

    setUsername(sessionUsername || "Unknown User");
    setEmail(sessionEmail || "N/A");
    setRoleName(roleName || "Guest");
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/auth/login");
  };

  return (
    <div className="fixed top-0 left-0 w-64 h-screen bg-indigo-900 text-white p-6 flex flex-col justify-between shadow-lg">
      {/* Top Section: User Info */}
      <div>
        <div className="flex items-center mb-6">
          <Link href="/my-info" passHref>
            <FaAddressBook className="mr-3 text-white text-lg cursor-pointer hover:text-indigo-300 transition-all duration-300" />
          </Link>
          <div className="flex-1">
            <Link href="/my-info" passHref>
              <h2 className="text-lg font-semibold leading-tight hover:underline hover:text-indigo-300 cursor-pointer">
                {username}
              </h2>
            </Link>
            <p className="text-sm text-gray-300 mt-1">{email}</p>
            <p className="text-xs text-gray-400 mt-1">{roleName}</p>
          </div>
        </div>

        {/* Navigation Links */}
        <SidebarSection>
          {menuItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href}
            />
          ))}
        </SidebarSection>
      </div>

      {/* Bottom Section: Additional Links */}
      <div>
        <Link href="/" passHref>
          <div className="flex items-center p-3 text-sm text-gray-300 hover:text-white hover:bg-indigo-700 rounded-lg transition-colors duration-300">
            <FaArrowLeft className="mr-3" />
            Quay lại cổng đăng nhập
          </div>
        </Link>
        <hr className="my-4 border-gray-600" />
        <button
          className="w-full flex items-center justify-center p-3 text-sm text-gray-300 hover:text-white hover:bg-red-600 rounded-lg transition-colors duration-300"
          onClick={handleLogout}
        >
          <FaSignOutAlt className="mr-3" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
