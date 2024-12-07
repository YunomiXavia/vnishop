"use client";

import { FaQuestionCircle, FaBox } from "react-icons/fa";
import Sidebar from "@/components/sidebar/components/Sidebar";

const SidebarCollaborator = () => {
  const collaboratorMenuItems = [
    {
      href: "/collaborator/surveys",
      icon: FaQuestionCircle,
      label: "Quản lý khảo sát",
    },
    {
      href: "/collaborator/orders",
      icon: FaBox,
      label: "Quản lý đơn hàng",
    },
  ];

  return (
    <Sidebar
      roleName="Collaborator"
      email="collaborator@gmail.com"
      menuItems={collaboratorMenuItems}
    />
  );
};

export default SidebarCollaborator;
