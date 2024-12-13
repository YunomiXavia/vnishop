"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createAdmin,
  deleteUser,
  deleteUsers,
  getAdmins,
  updateUser,
  updateUserWithoutPassword,
} from "@/store/user/userSlice";

import Notification from "@/components/notification/Notification";
import * as XLSX from "xlsx";
import { User } from "@/types/user/user";
import Pagination from "@/components/pagination/Pagination";
import { FormProvider, useForm } from "react-hook-form";
import { FormUserData } from "@/types/component/form/form";
import { extractError } from "@/utils/utils/helper";
import UserForm from "@/components/form/user/UserForm";
import TableData from "@/components/table/TableData";
import { Column } from "@/types/component/table/table";
import { FaPen, FaFileExcel, FaTrash, FaUserPlus } from "react-icons/fa";
import ButtonTable from "@/components/button/ButtonTable";
import { formatCurrencyVND, formatPhoneNumber } from "@/utils/utils/utils";

const FormAdminAdmin: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    users,
    loading,
    error,
    currentPage,
    totalPages,
    pageSize,
    totalElements,
  } = useAppSelector((state) => state.users);

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordUpdated, setIsPasswordUpdated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  const methods = useForm<FormUserData>({
    defaultValues: {
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      birthDate: null,
    },
  });

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const onSubmit = async (data: FormUserData) => {
    const payload: FormUserData = { ...data, birthDate: data.birthDate };
    try {
      if (isEditing && currentUserId) {
        if (isPasswordUpdated && data.password) {
          const resultAction = await dispatch(
            updateUser({ id: currentUserId, userData: payload })
          );
          if (updateUser.fulfilled.match(resultAction)) {
            setNotification({
              message: "Cập nhật admin thành công!",
              type: "success",
            });
          }
        } else {
          const { ...updatedData } = data;
          const resultAction = await dispatch(
            updateUserWithoutPassword({
              id: currentUserId,
              userData: updatedData,
            })
          );
          if (updateUserWithoutPassword.fulfilled.match(resultAction)) {
            setNotification({
              message: "Cập nhật admin thành công!",
              type: "success",
            });
          }
        }
      } else {
        const resultAction = await dispatch(createAdmin(data));
        if (createAdmin.fulfilled.match(resultAction)) {
          setNotification({
            message: "Tạo admin thành công!",
            type: "success",
          });
        }
      }
      setShowForm(false);
      methods.reset();
      setIsPasswordUpdated(false);
      await dispatch(getAdmins({ page: currentPage, size: pageSize }));
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: isEditing
          ? `Cập nhật admin thất bại: ${err.code}: ${err.message}`
          : `Tạo admin thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  const handleEditClick = (user: User) => {
    setIsEditing(true);
    setCurrentUserId(user.id);
    methods.setValue("username", user.username);
    methods.setValue("email", user.email);
    methods.setValue("firstName", user.firstName || "");
    methods.setValue("lastName", user.lastName || "");
    methods.setValue("phoneNumber", user.phoneNumber || "");
    methods.setValue(
      "birthDate",
      user.birthDate ? new Date(user.birthDate) : null
    );
    setIsPasswordUpdated(false);
    setShowForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const resultAction = await dispatch(deleteUser(userId));
      if (deleteUser.fulfilled.match(resultAction)) {
        setNotification({
          message: "Xóa admin thành công!",
          type: "success",
        });
      }
      if (currentPage > 0) {
        await dispatch(getAdmins({ page: currentPage - 1, size: pageSize }));
      } else {
        await dispatch(getAdmins({ page: 0, size: pageSize }));
      }
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Xóa admin thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  const handleDeleteUsers = async (userIds: string[]) => {
    try {
      const resultAction = await dispatch(deleteUsers(userIds));
      if (deleteUsers.fulfilled.match(resultAction)) {
        setNotification({
          message: "Xóa các admin thành công!",
          type: "success",
        });
      }
      if (currentPage > 0) {
        await dispatch(getAdmins({ page: currentPage - 1, size: pageSize }));
      } else {
        await dispatch(getAdmins({ page: 0, size: pageSize }));
      }
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Xóa các admin thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  const handleShowConfirmPopup = () => {
    setShowConfirmPopup(true);
  };

  const handleBulkDelete = () => {
    handleDeleteUsers(selectedUsers);
    setSelectedUsers([]);
    setShowConfirmPopup(false);
  };

  const handleRowSelect = (userId: string) => {
    setSelectedUsers((prevUsers) =>
      prevUsers.includes(userId)
        ? prevUsers.filter((id) => id !== userId)
        : [...prevUsers, userId]
    );
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      dispatch(getAdmins({ page: newPage - 1, size: pageSize }));
    }
  };

  const handleExportToExcel = () => {
    try {
      const excelData = users.map((user, index) => ({
        STT: index + 1,
        ID: user.id,
        ["Tên đăng nhập"]: user.username,
        ["Họ & Tên"]: user.lastName + " " + user.firstName,
        ["Email"]: user.email,
        ["Số điện thoại"]: user.phoneNumber,
        ["Vai trò"]: user.role,
        ["Ngày tham gia"]: new Date(user.dateJoined).toLocaleDateString(),
        ["Tổng chi tiêu"]: user.totalSpent,
        ["Ngày sinh"]: user.birthDate
          ? new Date(user.birthDate).toLocaleDateString()
          : "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Admins");

      XLSX.writeFile(workbook, "Admins.xlsx");

      setNotification({
        message: "Xuất dữ liệu thành công!",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: `Xuất dữ liệu thất bại: ${error}`,
        type: "error",
      });
    }
  };

  useEffect(() => {
    dispatch(getAdmins({ page: 0, size: 5 }));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setNotification({
        message: `Lỗi ${error.code}: ${error.message}`,
        type: "error",
      });
    }
  }, [error]);

  if (loading) return <p>Đang tải admin...</p>;

  // Chỉnh sửa cột: rút gọn tên cột, gộp họ & tên, gộp Email/ĐT
  const columns: Column<User>[] = [
    {
      header: "#",
      render: (item: User) => {
        const i = users.indexOf(item);
        return i + 1;
      },
    },
    {
      header: "Tên ĐN",
      accessor: "username",
      render: (item: User) => (
        <span className="text-indigo-600 font-medium">{item.username}</span>
      ),
    },
    {
      header: "Mail/ĐT",
      render: (item: User) => (
        <div className="flex flex-col items-center">
          <span>{item.email}</span>
          <span>{formatPhoneNumber(item.phoneNumber)}</span>
        </div>
      ),
    },
    {
      header: "Vai trò",
      render: (user: User) => (
        <span className="px-2 py-1 rounded-full text-white text-sm bg-indigo-500">
          {user.role}
        </span>
      ),
    },
    {
      header: "Họ & Tên",
      render: (user: User) => `${user.lastName} ${user.firstName}`,
    },
    {
      header: "Tham gia",
      render: (item: User) => new Date(item.dateJoined).toLocaleDateString(),
    },
    {
      header: "Chi tiêu",
      render: (item: User) => formatCurrencyVND(item.totalSpent),
    },
    {
      header: "Sinh",
      render: (item: User) =>
        item.birthDate ? new Date(item.birthDate).toLocaleDateString() : "N/A",
    },
    {
      header: "Sửa",
      render: (item: User) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEditClick(item);
          }}
          className="text-blue-600 hover:text-blue-800 transition transform hover:scale-110"
        >
          <FaPen />
        </button>
      ),
    },
    {
      header: "X",
      render: (item: User) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteUser(item.id);
          }}
          className="text-red-600 hover:text-red-800 transition transform hover:scale-110"
        >
          <FaTrash />
        </button>
      ),
    },
  ];

  return (
    <div className="p-4">
      {notification && (
        <div className="fixed top-4 right-4 z-50 transition-opacity">
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      {showConfirmPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm transition-opacity duration-300 ease-out">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full transform transition-all duration-300 ease-out scale-95">
            <h3 className="mb-6 text-lg font-semibold text-gray-800 text-center">
              Xóa {selectedUsers.length} admin đã chọn?
            </h3>
            <div className="flex justify-center space-x-4">
              <ButtonTable
                variant="primary"
                onClick={() => setShowConfirmPopup(false)}
              >
                Hủy
              </ButtonTable>
              <ButtonTable variant="danger" onClick={handleBulkDelete}>
                Xác Nhận
              </ButtonTable>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => setShowForm(false)}
          ></div>

          <div className="relative z-50">
            <FormProvider {...methods}>
              <UserForm
                isEditing={isEditing}
                isPasswordUpdated={isPasswordUpdated}
                onClose={() => setShowForm(false)}
                onSubmit={onSubmit}
                onTogglePasswordUpdate={() =>
                  setIsPasswordUpdated(!isPasswordUpdated)
                }
              />
            </FormProvider>
          </div>
        </div>
      )}

      <div className="p-4 mx-auto ">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-semibold text-indigo-700">
            Quản lý Admin
          </h2>
          <div className="flex space-x-2">
            <button
              className="flex items-center px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 ease-in-out transform hover:scale-105"
              onClick={handleExportToExcel}
            >
              <FaFileExcel className="mr-2" />
              Xuất Excel
            </button>
            <button
              className="flex items-center px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 ease-in-out transform hover:scale-105"
              onClick={() => {
                setIsEditing(false);
                methods.reset();
                setIsPasswordUpdated(true);
                setShowForm(true);
              }}
            >
              <FaUserPlus className="mr-2" />
              Thêm
            </button>
            <button
              className="flex items-center px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 ease-in-out transform hover:scale-105"
              onClick={handleShowConfirmPopup}
              disabled={selectedUsers.length === 0}
            >
              <FaTrash className="mr-2" />
              Xóa nhiều
            </button>
          </div>
        </div>
      </div>

      <TableData
        columns={columns}
        data={users}
        onRowClick={(item) => handleRowSelect(item.id)}
        selectedRowIds={selectedUsers}
      />

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Đang hiển thị trang {currentPage + 1} trên {totalPages}, tổng số{" "}
          {totalElements} mục
        </div>

        <Pagination
          currentPage={currentPage + 1}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default FormAdminAdmin;
