"use client";

import React, {useEffect, useState} from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createUser,
  deleteUser,
  deleteUsers,
  getUsers,
  updateUser,
  updateUserWithoutPassword,
} from "@/store/user/userSlice";

import Notification from "@/components/notification/Notification";
import * as XLSX from "xlsx";
import { User } from "@/types/user/user";
import Pagination from "@/components/pagination/Pagination";
import Chart from "@/components/chart/Chart";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { barChartOptions } from "@/types/component/chart/chart";
import { formatCurrencyVND, formatPhoneNumber } from "@/utils/utils/utils";
import { FormProvider, useForm } from "react-hook-form";
import { FormUserData } from "@/types/component/form/form";
import {extractError} from "@/utils/utils/helper";
import UserForm from "@/components/form/user/UserForm";
import TableData from "@/components/table/TableData";
import {Column} from "@/types/component/table/table";
import { FaPen, FaFileExcel, FaTrash, FaUserPlus } from "react-icons/fa";
import ButtonTable from "@/components/button/ButtonTable";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement
);

const FormUserAdmin: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, loading, error, currentPage, totalPages, pageSize, totalElements } = useAppSelector((state) => state.users);

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

  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [minTotalSpent, setMinTotalSpent] = useState<number>(0);

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
              message: "Cập nhật người dùng thành công!",
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
              message: "Cập nhật người dùng thành công!",
              type: "success",
            });
          }
        }
      } else {
        const resultAction = await dispatch(createUser(data));
        if (createUser.fulfilled.match(resultAction)) {
          setNotification({
            message: "Tạo người dùng thành công!",
            type: "success",
          });
        }
      }
      setShowForm(false);
      methods.reset();
      setIsPasswordUpdated(false);
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: isEditing
            ? `Cập nhật người dùng thất bại: ${err.code}: ${err.message}`
            : `Tạo người dùng thất bại: ${err.code}: ${err.message}`,
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
    methods.setValue("birthDate", user.birthDate ? new Date(user.birthDate) : null);
    setIsPasswordUpdated(false);
    setShowForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const resultAction = await dispatch(deleteUser(userId));
      if (deleteUser.fulfilled.match(resultAction)) {
        setNotification({
          message: "Xóa người dùng thành công!",
          type: "success",
        });
      }
      if (currentPage > 0) {
        await dispatch(getUsers({ page: currentPage - 1, size: pageSize }));
      } else {
        await dispatch(getUsers({ page: 0, size: pageSize }));
      }
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Xóa người dùng thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  const handleDeleteUsers = async (userIds: string[]) => {
    try {
      const resultAction = await dispatch(deleteUsers(userIds));
      if (deleteUsers.fulfilled.match(resultAction)) {
        setNotification({
          message: "Xóa các người dùng thành công!",
          type: "success",
        });
      }
      if (currentPage > 0) {
        await dispatch(getUsers({ page: currentPage - 1, size: pageSize }));
      } else {
        await dispatch(getUsers({ page: 0, size: pageSize }));
      }
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Xóa các người dùng thất bại: ${err.code}: ${err.message}`,
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
      dispatch(getUsers({ page: newPage - 1, size: pageSize }));
    }
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFrom(e.target.value);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateTo(e.target.value);
  };

  const handleMinTotalSpentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinTotalSpent(Number(e.target.value));
  };

  const filteredUsers = users.filter((user) => {
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && (new Date(user.dateJoined) >= new Date(dateFrom));
    }
    if (dateTo) {
      matchesDate = matchesDate && (new Date(user.dateJoined) <= new Date(dateTo));
    }

    let matchesTotalSpent = true;
    if (minTotalSpent > 0) {
      matchesTotalSpent = (user.totalSpent || 0) > minTotalSpent;
    }

    return matchesDate && matchesTotalSpent;
  });

  const handleExportToExcel = () => {
    try {
      const excelData = users.map((user, index) => ({
        "STT": index + 1,
        "ID": user.id,
        ["Tên đăng nhập"]: user.username,
        "Email": user.email,
        ["Vai trò"]: user.role,
        ["Tên"]: user.firstName,
        ["Họ"]: user.lastName,
        ["Số điện thoại"]: user.phoneNumber,
        ["Ngày tham gia"]: user.dateJoined,
        ["Tổng chi tiêu"]: user.totalSpent,
        ["Ngày sinh"]: user.birthDate
            ? new Date(user.birthDate).toLocaleDateString()
            : "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Người dùng");

      XLSX.writeFile(workbook, "NguoiDung.xlsx");

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

  const handleExportStatisticsToExcel = () => {
    try {
      const monthlyJoinsDataFormatted = Object.keys(monthlyJoins).map(
          (month) => ({
            ["Tháng"]: month,
            ["Số lượng tham gia"]: monthlyJoins[month],
          })
      );

      const ageDistributionDataFormatted = Object.keys(ageDistribution).map(
          (ageGroup) => ({
            ["Nhóm tuổi"]: ageGroup,
            ["Số lượng"]: ageDistribution[ageGroup],
          })
      );

      const topSpendersDataFormatted = topSpenders.map((spender) => ({
        ["Tên đăng nhập"]: spender.username,
        ["Tổng chi tiêu"]: spender.totalSpent,
      }));

      const workbook = XLSX.utils.book_new();

      const monthlyJoinsWorksheet = XLSX.utils.json_to_sheet(
          monthlyJoinsDataFormatted
      );
      XLSX.utils.book_append_sheet(
          workbook,
          monthlyJoinsWorksheet,
          "Tham gia hàng tháng"
      );

      const ageDistributionWorksheet = XLSX.utils.json_to_sheet(
          ageDistributionDataFormatted
      );
      XLSX.utils.book_append_sheet(
          workbook,
          ageDistributionWorksheet,
          "Phân phối độ tuổi"
      );

      const topSpendersWorksheet = XLSX.utils.json_to_sheet(
          topSpendersDataFormatted
      );
      XLSX.utils.book_append_sheet(
          workbook,
          topSpendersWorksheet,
          "Top 5 Người chi tiêu nhiều nhất"
      );

      XLSX.writeFile(workbook, "DuLieuThongKe.xlsx");

      setNotification({
        message: "Xuất dữ liệu thống kê thành công!",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: `Xuất dữ liệu thống kê thất bại: ${error}`,
        type: "error",
      });
    }
  };

  const monthlyJoins: { [key: string]: number } = {};
  const ageDistribution: { [key: string]: number } = {};
  const topSpenders: { username: string; totalSpent: number }[] = [];

  users.forEach((user) => {
    const joinMonth = new Date(user.dateJoined).toLocaleString("default", {
      month: "short",
    });
    monthlyJoins[joinMonth] = (monthlyJoins[joinMonth] || 0) + 1;

    if (user.birthDate) {
      const birthYear = new Date(user.birthDate).getFullYear();
      const age = new Date().getFullYear() - birthYear;
      const ageGroup = `${Math.floor(age / 10) * 10}-${Math.floor(age / 10) * 10 + 9}`;
      ageDistribution[ageGroup] = (ageDistribution[ageGroup] || 0) + 1;
    }
  });

  [...users]
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, 5)
      .forEach((u) => topSpenders.push({ username: u.username, totalSpent: u.totalSpent || 0 }));

  const monthlyJoinsData = {
    labels: Object.keys(monthlyJoins),
    datasets: [
      {
        label: "Số lượng tham gia",
        data: Object.values(monthlyJoins),
        backgroundColor: "#2196f3",
        hoverBackgroundColor: "#64b5f6",
      },
    ],
  };

  const ageDistributionData = {
    labels: Object.keys(ageDistribution),
    datasets: [
      {
        label: "Nhóm tuổi",
        data: Object.values(ageDistribution),
        backgroundColor: "#ff9800",
        hoverBackgroundColor: "#ffb74d",
      },
    ],
  };

  const topSpendersData = {
    labels: topSpenders.map((user) => user.username),
    datasets: [
      {
        label: "Tổng chi tiêu",
        data: topSpenders.map((user) => user.totalSpent),
        backgroundColor: "#4caf50",
        hoverBackgroundColor: "#66bb6a",
      },
    ],
  };

  const totalSpent = users.reduce(
      (sum, user) => sum + (user.totalSpent || 0),
      0
  );
  const numberOfMonths = Object.keys(monthlyJoins).length;
  const averageMonthlyJoins = numberOfMonths > 0 ? (totalElements / numberOfMonths) : 0;
  const averageSpending = totalElements > 0 ? (totalSpent / totalElements) : 0;

  const columns: Column<User>[] = [
    {
      header: "STT",
      render: (item: User) => {
        const i = filteredUsers.indexOf(item);
        return i + 1;
      }
    },
    {
      header: "Tên đăng nhập",
      accessor: "username",
      render: (item: User) => <span className="text-indigo-600 font-medium">{item.username}</span>
    },
    { header: "Email", accessor: "email" },
    {
      header: "Vai trò",
      accessor: "role",
      render: (user: User) => (
          <span className="px-2 py-1 rounded-full text-white text-sm bg-indigo-500">
          {user.role}
        </span>
      )
    },
    { header: "Tên", accessor: "firstName" },
    { header: "Họ", accessor: "lastName" },
    {
      header: "Số điện thoại",
      accessor: "phoneNumber",
      render: (item: User) => formatPhoneNumber(item.phoneNumber)
    },
    {
      header: "Ngày tham gia",
      accessor: "dateJoined",
      render: (item: User) => new Date(item.dateJoined).toLocaleDateString()
    },
    {
      header: "Tổng chi tiêu",
      accessor: "totalSpent",
      render: (item: User) => formatCurrencyVND(item.totalSpent)
    },
    {
      header: "Ngày sinh",
      accessor: "birthDate",
      render: (item: User) => item.birthDate ? new Date(item.birthDate).toLocaleDateString() : "N/A"
    },
    {
      header: "Chỉnh sửa",
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
      )
    },
    {
      header: "Xóa",
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
      )
    }
  ];

  useEffect(() => {
    dispatch(getUsers({ page: 0, size: 5 }));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setNotification({
        message: `Lỗi ${error.code}: ${error.message}`,
        type: "error",
      });
    }
  }, [error]);

  if (loading) return <p>Đang tải người dùng...</p>;

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
            <div
                className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm transition-opacity duration-300 ease-out">
              <div
                  className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full
                transform transition-all duration-300 ease-out scale-95"
              >
                <h3 className="mb-6 text-lg font-semibold text-gray-800 text-center">
                  Bạn có chắc chắn muốn xóa {selectedUsers.length} người dùng đã chọn không?
                </h3>
                <div className="flex justify-center space-x-4">
                  <ButtonTable
                      variant="primary"
                      onClick={() => setShowConfirmPopup(false)}
                  >
                    Hủy
                  </ButtonTable>
                  <ButtonTable
                      variant="danger"
                      onClick={handleBulkDelete}
                  >
                    Xác Nhận
                  </ButtonTable>
                </div>
              </div>
            </div>
        )}

        {showForm && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              {/* Overlay */}
              <div
                  className="absolute inset-0 bg-black opacity-50"
                  onClick={() => setShowForm(false)}
              ></div>

              {/* Form Container */}
              <div className="relative z-50">
                <FormProvider {...methods}>
                  <UserForm
                      isEditing={isEditing}
                      isPasswordUpdated={isPasswordUpdated}
                      onClose={() => setShowForm(false)}
                      onSubmit={onSubmit}
                      onTogglePasswordUpdate={() => setIsPasswordUpdated(!isPasswordUpdated)}
                  />
                </FormProvider>
              </div>
            </div>
        )}

        <div className="p-4 mx-auto ">
          <div className="flex justify-between mb-4">
            <h2 className="text-2xl font-semibold text-indigo-700">
              Quản lý người dùng
            </h2>
            <div className="flex space-x-2">
              <button
                  className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 ease-in-out transform hover:scale-105"
                  onClick={handleExportStatisticsToExcel}
              >
                <FaFileExcel className="mr-2"/>
                Xuất dữ liệu thống kê ra Excel
              </button>
              <button
                  className="flex items-center px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 ease-in-out transform hover:scale-105"
                  onClick={handleExportToExcel}
              >
                <FaFileExcel className="mr-2"/>
                Xuất dữ liệu ra Excel
              </button>
              <button
                  className="flex items-center px-3 py-1 bg-indigo-500 text-white
                rounded-lg hover:bg-indigo-600 transition duration-200
                ease-in-out transform hover:scale-105"
                  onClick={() => {
                    setIsEditing(false);
                    methods.reset();
                    setIsPasswordUpdated(true);
                    setShowForm(true);
                  }}
              >
                <FaUserPlus className="mr-2"/>
                Thêm người dùng mới
              </button>
              <button
                  className="flex items-center px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 ease-in-out transform hover:scale-105"
                  onClick={handleShowConfirmPopup}
                  disabled={selectedUsers.length === 0}
              >
                <FaTrash className="mr-2"/>
                Xóa nhiều người dùng
              </button>
            </div>
          </div>

          <div className="flex space-x-4 mb-4 justify-end items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Từ ngày:
              </label>
              <input
                  type="date"
                  value={dateFrom}
                  onChange={handleDateFromChange}
                  className="mt-1 p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Đến ngày:
              </label>
              <input
                  type="date"
                  value={dateTo}
                  onChange={handleDateToChange}
                  className="mt-1 p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc tổng chi tiêu lớn hơn:
              </label>
              <input
                  type="number"
                  min={0}
                  value={minTotalSpent}
                  onChange={handleMinTotalSpentChange}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <TableData
            columns={columns}
            data={filteredUsers}
            onRowClick={(item) => handleRowSelect(item.id)}
            selectedRowIds={selectedUsers}
        />

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Đang hiển thị trang {currentPage + 1} trên {totalPages}, tổng số {totalElements} mục
          </div>

          <Pagination
              currentPage={currentPage + 1}
              totalPages={totalPages}
              onPageChange={handlePageChange}
          />
        </div>

        <div className="col-span-full bg-white p-6 rounded-lg shadow-lg mb-6 mt-6">
          <h3 className="text-lg font-semibold text-center mb-4">
            Thống kê tổng hợp
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 text-center">
            <div>
              <p className="text-xl font-bold">{totalSpent.toLocaleString()}</p>
              <p>Tổng chi tiêu</p>
            </div>
            <div>
              <p className="text-xl font-bold">{averageSpending.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
              <p>Chi tiêu trung bình</p>
            </div>
            <div>
              <p className="text-xl font-bold">{averageMonthlyJoins.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
              <p>Tham gia hàng tháng (TB)</p>
            </div>
            <div>
              <p className="text-xl font-bold">{totalElements}</p>
              <p>Tổng số người dùng</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 mt-8 mx-auto max-w-8xl px-4">
          <Chart
              type="bar"
              data={monthlyJoinsData}
              options={barChartOptions}
              title="Tham gia hàng tháng"
          />
          <Chart
              type="bar"
              data={ageDistributionData}
              options={barChartOptions}
              title="Phân phối độ tuổi"
          />
          <Chart
              type="bar"
              data={topSpendersData}
              options={{
                ...barChartOptions,
                indexAxis: "y",
              }}
              title="Top 5 Người chi tiêu nhiều nhất"
          />
        </div>
      </div>
  );
};

export default FormUserAdmin;
