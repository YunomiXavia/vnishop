"use client";

import {
  FaBox,
  FaCalendarDay, FaChalkboardTeacher,
  FaChartBar,
  FaFileContract,
  FaQuestionCircle,
  FaUser,
  FaUserTie,
} from "react-icons/fa";
import Sidebar from "@/components/sidebar/components/Sidebar";

const SidebarAdmin = () => {
  const adminMenuItems = [
    {
      href: "/admin/admins",
      icon: FaChalkboardTeacher,
      label: "Quản lý Admin",
    },
    {
      href: "/admin/users",
      icon: FaUser,
      label: "Quản lý người dùng",
    },
    {
      href: "/admin/collaborators",
      icon: FaUserTie,
      label: "Quản lý cộng tác viên",
    },
    {
      href: "/admin/products",
      icon: FaFileContract,
      label: "Quản lý sản phẩm",
    },
    {
      href: "/admin/surveys",
      icon: FaQuestionCircle,
      label: "Câu hỏi người dùng",
    },
    {
      href: "/admin/orders",
      icon: FaBox,
      label: "Quản lý đơn hàng",
    },
    {
      href: "/admin/revenue",
      icon: FaChartBar,
      label: "Quản lý doanh thu",
    },
    {
      href: "/admin/service-date",
      icon: FaCalendarDay,
      label: "Quản lý đăng kí dịch vụ",
    },
    // {
    //   href: "/admin/roles",
    //   icon: FaUser,
    //   label: "Roles",
    // },
  ];

  return (
    <Sidebar
      roleName="Admin"
      email="admin@gmail.com"
      menuItems={adminMenuItems}
    />
  );
};

export default SidebarAdmin;
