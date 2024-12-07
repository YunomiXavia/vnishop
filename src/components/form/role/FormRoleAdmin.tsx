"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createRole,
  deleteRole,
  deleteRoles,
  getRoles,
  updateRole,
} from "@/store/role/roleSlice";
import { Role } from "@/types/role/role";
import * as XLSX from "xlsx";
import Notification from "@/components/notification/Notification";
import { FaPen, FaFileExcel, FaTrash, FaUserPlus } from "react-icons/fa";
import Pagination from "@/components/pagination/Pagination";

const FormRoleAdmin: React.FC = () => {
  const dispatch = useAppDispatch();
  const { roles, loading, error } = useAppSelector((state) => state.roles);

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRoleId, setCurrentRoleId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Manage Form Data
  const [formData, setFormData] = useState({
    roleName: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(roles.length / rowsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Lấy danh sách roles cho trang hiện tại
  const paginatedRoles = roles.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const formRef = useRef<HTMLFormElement>(null);

  // Function Handle Input Change
  // Change Role's Data when Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Function Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && currentRoleId) {
        await dispatch(
          updateRole({
            id: currentRoleId,
            roleData: formData,
          })
        );
        setNotification({
          message: "Role Updated Successfully",
          type: "info",
        });
      } else {
        await dispatch(createRole(formData));
        setNotification({
          message: "Role Created Successfully",
          type: "success",
        });
      }
      setShowForm(false);
    } catch (error) {
      setNotification({
        message: isEditing
          ? "Failed to update roles: " + error
          : "Failed to create roles: " + error,
        type: "error",
      });
    }
  };

  // Handle Click Edit Role
  const handleEditClick = (role: Role) => {
    setIsEditing(true);
    setCurrentRoleId(role.id);
    setFormData({
      roleName: role.roleName,
    });
    setShowForm(true);
  };

  // Handle Delete Role
  const handleDeleteRole = async (roleId: string) => {
    try {
      // Delete Role
      await dispatch(deleteRole(roleId));
      setNotification({
        message: "Role Deleted Successfully",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: "Failed to delete role: " + error,
        type: "error",
      });
    }
  };

  // Handle Delete Roles
  const handleDeleteRoles = async (roleIds: string[]) => {
    try {
      // Delete Roles
      await dispatch(deleteRoles(roleIds));
      setNotification({
        message: "Roles Deleted Successfully",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: "Failed to delete roles: " + error,
        type: "error",
      });
    }
  };

  // Handle Show Confirm Popup
  const handleShowConfirmPopup = () => {
    setShowConfirmPopup(true);
  };

  // Handle Bulk Delete
  const handleBulkDelete = () => {
    handleDeleteRoles(selectedRoles);
    setSelectedRoles([]);
    setShowConfirmPopup(false);
  };

  // Handle Row Select
  const handleRowSelect = (roleId: string) => {
    setSelectedRoles((prevRoles) => {
      if (prevRoles.includes(roleId)) {
        return prevRoles.filter((id) => id !== roleId);
      } else {
        return [...prevRoles, roleId];
      }
    });
  };

  // Handle Export to Excel File
  const handleExportToExcel = () => {
    try {
      // Format Data for Excel
      const excelData = roles.map((role, index) => ({
        Index: index + 1,
        ID: role.id,
        Role: role.roleName,
      }));

      // Create a Worksheet and Workbook
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Roles");

      // Export to Excel File
      XLSX.writeFile(workbook, "Roles.xlsx");

      // Display Notification
      setNotification({
        message: "Export successfully !",
        type: "success",
      });
    } catch (error) {
      // Display Notification
      setNotification({
        message: "Export failed: " + error,
        type: "error",
      });
    }
  };

  // Get Roles When Reload
  useEffect(() => {
    dispatch(getRoles());
  }, [dispatch]);

  // Handle event when click outside of form
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setShowForm(false);
      }
    };

    if (showForm) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showForm]);

  if (loading) return <p>Loading roles...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-4">
      {/* Notification when User Created, Updated, Deleted */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 transition-opacity">
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      <div className="p-4 mx-auto ">
        {/* Header */}
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-semibold text-indigo-700">
            Role Management
          </h2>
          <div className="flex space-x-2">
            <button
              className="flex items-center px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 ease-in-out transform hover:scale-105"
              onClick={handleExportToExcel}
            >
              <FaFileExcel className="mr-2" />
              Export to Excel
            </button>
            <button
              className="flex items-center px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 ease-in-out transform hover:scale-105"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  roleName: "",
                });
                setShowForm(true);
              }}
            >
              <FaUserPlus className="mr-2" />
              Add New Role
            </button>
            <button
              className="flex items-center px-3 py-1 bg-red-500 text-white ounded-lg hover:bg-red-600 transition duration-200 ease-in-out transform hover:scale-105"
              onClick={handleShowConfirmPopup}
              disabled={selectedRoles.length === 0}
            >
              <FaTrash className="mr-2" />
              Delete Roles
            </button>
          </div>
        </div>
      </div>

      {showConfirmPopup && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50
                    backdrop-blur-sm transition-opacity duration-300 ease-out"
        >
          <div
            className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full
                        transform transition-all duration-300 ease-out scale-95"
          >
            <h3 className="mb-6 text-lg font-semibold text-gray-800 text-center">
              Are you sure you want to delete selected {selectedRoles.length}{" "}
              roles ?
            </h3>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowConfirmPopup(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 font-semibold
                                rounded-lg hover:bg-gray-400 transition duration-200
                                ease-in-out transform hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-6 py-2 bg-red-300 text-white font-semibold
                                rounded-lg hover:bg-red-700 transition duration-200
                                ease-in-out transform hover:scale-105"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Add && Update User */}
      {showForm && (
        <>
          <div
            className="fixed inset-0 bg-black opacity-50 z-40 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          ></div>
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <form
              onSubmit={handleSubmit}
              className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full
                relative z-50"
              ref={formRef}
            >
              <h3 className="text-lg font-semibold mb-4">
                {isEditing ? "Update User" : "Add New User"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="roleName"
                  placeholder="Role Name"
                  value={formData.roleName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
                  required
                />
              </div>
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg shadow-md hover:bg-gray-400 hover:text-gray-900 transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-500 text-white rounded-lg shadow-md hover:bg-indigo-600 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Table Roles */}
      {roles.length > 0 && (
        <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
          <table className="min-w-full bg-white border rounded-lg shadow-sm">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="px-4 py-2 text-center">Id</th>
                <th className="px-4 py-2 text-center">Role Name</th>
              </tr>
            </thead>

            <tbody>
              {paginatedRoles.map((role, index) => (
                <tr
                  key={role.id}
                  className={`hover:bg-gray-50 transition ease-in-out 
                            duration-200 cursor-pointer ${
                              selectedRoles.includes(role.id)
                                ? "bg-indigo-100"
                                : "hover:bg-gray-50"
                            }  `}
                  onClick={() => handleRowSelect(role.id)}
                >
                  <td className="border px-4 py-2 text-center">
                    {(currentPage - 1) * rowsPerPage + index + 1}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {role.roleName}
                  </td>

                  <td className="border px-4 py-2 text-center space-x-2">
                    <button
                      className="text-blue-600 hover:text-blue-800 transition transform hover:scale-110"
                      onClick={() => handleEditClick(role)}
                    >
                      <FaPen />
                    </button>
                  </td>
                  <td className="border px-4 py-2 text-center space-x-2">
                    <button
                      className="text-red-600 hover:text-red-800 transition transform hover:scale-110"
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Showing Entries */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-600">
          Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
          {Math.min(currentPage * rowsPerPage, roles.length)} of {roles.length}{" "}
          entries
        </p>

        {/* Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default FormRoleAdmin;
