"use client";

import { NotificationProps } from "@/types/component/notification/notification";
import React, { useEffect } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
} from "react-icons/fa";

const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <FaCheckCircle />;
      case "error":
        return <FaExclamationCircle />;
      case "info":
        return <FaInfoCircle />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex items center p-4 rounded-lg shadow-lg text-white
                ${getColor()} transition-transform duration-300 transform
                translate-y-0 opacity-100}`}
    >
      <span className="mr-2 text-xl">{getIcon()}</span>
      <span className="text-md flex-1">{message}</span>
      <button className="ml-2 text-xl" onClick={onClose}>
        &times;
      </button>
    </div>
  );
};

export default Notification;
