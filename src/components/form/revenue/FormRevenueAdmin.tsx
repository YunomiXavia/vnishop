"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getCollaborators } from "@/store/collaborator/collaboratorSlice";
import Notification from "@/components/notification/Notification";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { getCollaboratorRevenueDetails } from "@/store/revenue/revenueSlice";
import Pagination from "@/components/pagination/Pagination";
import Chart from "@/components/chart/Chart";
import { barChartOptions } from "@/types/component/chart/chart";
import { formatCurrencyVND } from "@/utils/utils/utils";
import { ErrorResponseProps } from "@/types/error/error";

const FormRevenueAdmin: React.FC = () => {
  const dispatch = useAppDispatch();
  const { collaborators, loading, error } = useAppSelector(
      (state) => state.collaborators
  );
  const { revenueDetails } = useAppSelector((state) => state.revenue);

  const [filters, setFilters] = useState({
    username: "",
    totalOrdersHandled: "",
    totalCommission: "",
    totalRevenue: "",
    revenueWithCommission: "",
  });

  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>(
      []
  );
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    dispatch(getCollaborators());
  }, [dispatch]);

  useEffect(() => {
    collaborators.forEach((collaborator) => {
      dispatch(getCollaboratorRevenueDetails(collaborator.id));
    });
  }, [collaborators, dispatch]);

  // Handle Row Select
  const handleRowSelect = (collaboratorId: string) => {
    setSelectedCollaborators((prevCollaborators) => {
      if (prevCollaborators.includes(collaboratorId)) {
        return prevCollaborators.filter((id) => id !== collaboratorId);
      }
      return [...prevCollaborators, collaboratorId];
    });
  };

  // Filter collaborators
  const filteredCollaborators = collaborators.filter((collaborator) => {
    const revenueData = revenueDetails.find(
        (detail) => detail.collaboratorId === collaborator.id
    );

    const { username, totalOrdersHandled, totalCommission, totalRevenue, revenueWithCommission } = filters;

    const matchUsername =
        username === "" || collaborator.user.username.includes(username);

    const matchTotalOrders =
        totalOrdersHandled === "" ||
        (collaborator.totalOrdersHandled ?? 0) >= Number(totalOrdersHandled);

    const matchTotalCommission =
        totalCommission === "" ||
        (revenueData?.totalCommission || 0) >= Number(totalCommission);

    const matchTotalRevenue =
        totalRevenue === "" ||
        (revenueData?.totalRevenue || 0) >= Number(totalRevenue);

    const matchRevenueWithCommission =
        revenueWithCommission === "" ||
        (revenueData?.totalRevenueWithCommission || 0) >=
        Number(revenueWithCommission);

    return (
        matchUsername &&
        matchTotalOrders &&
        matchTotalCommission &&
        matchTotalRevenue &&
        matchRevenueWithCommission
    );
  });

  const totalPages = Math.ceil(filteredCollaborators.length / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const currentCollaborators = filteredCollaborators.slice(startIdx, endIdx);

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value,
    });
  };

  // Calculate overview data
  const overviewData = collaborators.map((collaborator) => {
    const revenueData = revenueDetails.find(
        (detail) => detail.collaboratorId === collaborator.id
    );
    return {
      username: collaborator.user.username,
      totalCommission: revenueData?.totalCommission || 0,
      totalRevenue: revenueData?.totalRevenue || 0,
      revenueWithCommission: revenueData?.totalRevenueWithCommission || 0,
      totalOrdersHandled: collaborator.totalOrdersHandled || 0,
    };
  });

  // Chart data
  const chartData = {
    labels: overviewData.map((data) => data.username),
    datasets: [
      {
        label: "Tổng doanh thu (VND)",
        data: overviewData.map((data) => data.totalRevenue),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: "Doanh thu có hoa hồng (VND)",
        data: overviewData.map((data) => data.revenueWithCommission),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: "Tổng hoa hồng (VND)",
        data: overviewData.map((data) => data.totalCommission),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "Tổng đơn hàng đã xử lý",
        data: overviewData.map((data) => data.totalOrdersHandled),
        backgroundColor: "rgba(153, 102, 255, 0.6)",
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1,
      },
    ],
  };

  const handleExportToExcel = () => {
    try {
      const excelData = collaborators.map((collaborator, index) => {
        const revenueData = revenueDetails.find(
            (detail) => detail.collaboratorId === collaborator.id
        );
        return {
          STT: index + 1,
          ["ID Cộng tác viên"]: collaborator.id,
          ["ID Người dùng"]: collaborator.user.id,
          Email: collaborator.user.email,
          ["Vai Trò"]: collaborator.user.role,
          ["Tên"]: collaborator.user.firstName,
          ["Họ"]: collaborator.user.lastName,
          ["Số điện thoại"]: collaborator.user.phoneNumber,
          ["Ngày tham gia"]: new Date(collaborator.user.dateJoined).toLocaleDateString(),
          ["Ngày sinh"]: collaborator.user.birthDate
              ? new Date(collaborator.user.birthDate).toLocaleDateString()
              : "N/A",
          ["Tổng chi tiêu"]: collaborator.user.totalSpent,
          ["Mã giới thiệu"]: collaborator.referralCode,
          ["Tỷ lệ hoa hồng"]: collaborator.commissionRate,
          ["Tổng đơn hàng đã xử lý"]: collaborator.totalOrdersHandled,
          ["Tổng khảo sát đã xử lý"]: collaborator.totalSurveyHandled,
         [ "Tổng hoa hồng đã nhận"]:
              formatCurrencyVND(collaborator.totalCommissionEarned),
          ["Tổng doanh thu (VND)"]:
              formatCurrencyVND(revenueData?.totalRevenue || 0),
          ["Tổng hoa hồng (VND)"]:
              formatCurrencyVND(revenueData?.totalCommission || 0),
          ["Doanh thu có hoa hồng (VND)"]:
              formatCurrencyVND(revenueData?.totalRevenueWithCommission || 0),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "CongTacVien");

      XLSX.writeFile(workbook, "CongTacVienDoanhThu.xlsx");

      setNotification({
        message: "Xuất dữ liệu ra Excel thành công!",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: "Xuất dữ liệu thất bại: " + error,
        type: "error",
      });
    }
  };

  if (loading) return <p>Đang tải dữ liệu doanh thu...</p>;

  if (error) {
    const err = error as ErrorResponseProps;
    return (
        <p>
          Lỗi {err.code}: {err.message}
        </p>
    );
  }

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

        <div className="p-4 mx-auto ">
          <div className="flex justify-between mb-4">
            <h2 className="text-2xl font-semibold text-indigo-700">
              Quản lý doanh thu
            </h2>
            <div className="flex space-x-2">
              <button
                  className="flex items-center px-3 py-1
                        bg-indigo-500 text-white rounded-lg
                        hover:bg-indigo-600 transition duration-200
                        ease-in-out transform hover:scale-105"
                  onClick={handleExportToExcel}
              >
                <FaFileExcel className="mr-2" />
                Xuất ra Excel
              </button>
            </div>
          </div>

          {/* Bộ lọc */}
          <div className="flex space-x-4 mb-4 justify-end items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo tên cộng tác viên:
              </label>
              <select
                  name="username"
                  className="border p-2 rounded"
                  onChange={handleFilterChange}
                  value={filters.username}
              >
                <option value="">Chọn tên</option>
                {Array.from(
                    new Set(collaborators.map((c) => c.user.username))
                ).map((username, i) => (
                    <option key={i} value={username}>
                      {username}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo số đơn hàng đã xử lý ({">"}=):
              </label>
              <select
                  name="totalOrdersHandled"
                  className="border p-2 rounded"
                  onChange={handleFilterChange}
                  value={filters.totalOrdersHandled}
              >
                <option value="">Chọn số đơn</option>
                <option value="10">10</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo tổng hoa hồng ({">"}=):
              </label>
              <select
                  name="totalCommission"
                  className="border p-2 rounded"
                  onChange={handleFilterChange}
                  value={filters.totalCommission}
              >
                <option value="">Chọn mức hoa hồng</option>
                <option value="5000000">5,000,000</option>
                <option value="10000000">10,000,000</option>
                <option value="20000000">20,000,000</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo tổng doanh thu ({">"}=):
              </label>
              <select
                  name="totalRevenue"
                  className="border p-2 rounded"
                  onChange={handleFilterChange}
                  value={filters.totalRevenue}
              >
                <option value="">Chọn tổng doanh thu</option>
                <option value="50000000">50,000,000</option>
                <option value="100000000">100,000,000</option>
                <option value="200000000">200,000,000</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo doanh thu có hoa hồng ({">"}=):
              </label>
              <select
                  name="revenueWithCommission"
                  className="border p-2 rounded"
                  onChange={handleFilterChange}
                  value={filters.revenueWithCommission}
              >
                <option value="">Chọn doanh thu có hoa hồng</option>
                <option value="50000000">50,000,000</option>
                <option value="100000000">100,000,000</option>
                <option value="200000000">200,000,000</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bảng cộng tác viên */}
        <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
          <table className="min-w-full bg-white border rounded-lg shadow-sm">
            <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="px-4 py-2 text-center">STT</th>
              <th className="px-4 py-2 text-center">Tên người dùng</th>
              <th className="px-4 py-2 text-center">Ngày tham gia</th>
              <th className="px-4 py-2 text-center">Tổng hoa hồng</th>
              <th className="px-4 py-2 text-center">Tổng doanh thu</th>
              <th className="px-4 py-2 text-center">Doanh thu có hoa hồng</th>
              <th className="px-4 py-2 text-center">Tổng đơn hàng đã xử lý</th>
            </tr>
            </thead>
            <tbody>
            {currentCollaborators.map((collaborator, index) => {
              const revenueData = revenueDetails.find(
                  (detail) => detail.collaboratorId === collaborator.id
              );
              return (
                  <tr
                      key={collaborator.id}
                      className={`hover:bg-gray-50 transition ease-in-out duration-200 cursor-pointer ${
                          selectedCollaborators.includes(collaborator.user.id)
                              ? "bg-indigo-100"
                              : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleRowSelect(collaborator.user.id)}
                  >
                    <td className="border px-4 py-2 text-center">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {collaborator.user.username}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {new Date(collaborator.user.dateJoined).toLocaleDateString()}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {formatCurrencyVND(revenueData?.totalCommission || 0)}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {formatCurrencyVND(revenueData?.totalRevenue || 0)}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {formatCurrencyVND(revenueData?.totalRevenueWithCommission || 0)}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {collaborator.totalOrdersHandled}
                    </td>
                  </tr>
              );
            })}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
        />

        {/* Thống kê tổng quan */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Thống kê tổng quan
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-white shadow rounded-lg">
              <h4 className="text-lg font-semibold">Tổng hoa hồng (VND)</h4>
              <p>
                {formatCurrencyVND(
                    overviewData.reduce((sum, data) => sum + data.totalCommission, 0)
                )}
              </p>
            </div>
            <div className="p-4 bg-white shadow rounded-lg">
              <h4 className="text-lg font-semibold">Tổng doanh thu (VND)</h4>
              <p>
                {formatCurrencyVND(
                    overviewData.reduce((sum, data) => sum + data.totalRevenue, 0)
                )}
              </p>
            </div>
            <div className="p-4 bg-white shadow rounded-lg">
              <h4 className="text-lg font-semibold">Doanh thu có hoa hồng (VND)</h4>
              <p>
                {formatCurrencyVND(
                    overviewData.reduce(
                        (sum, data) => sum + data.revenueWithCommission,
                        0
                    )
                )}
              </p>
            </div>
            <div className="p-4 bg-white shadow rounded-lg">
              <h4 className="text-lg font-semibold">Tổng số đơn hàng đã xử lý</h4>
              <p>
                {overviewData.reduce(
                    (sum, data) => sum + data.totalOrdersHandled,
                    0
                )}
              </p>
            </div>
          </div>
        </div>

        <Chart
            type="bar"
            data={chartData}
            options={barChartOptions}
            title="Thống kê doanh thu của cộng tác viên"
        />
      </div>
  );
};

export default FormRevenueAdmin;
