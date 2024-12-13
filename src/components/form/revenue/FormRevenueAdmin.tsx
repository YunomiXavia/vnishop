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
  const { collaborators, loading, error, currentPage, totalPages, pageSize } =
    useAppSelector((state) => state.collaborators);
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

  // Gọi API lần đầu
  useEffect(() => {
    dispatch(getCollaborators({ page: 0, size: pageSize }));
  }, [dispatch, pageSize]);

  // Mỗi khi collaborators thay đổi, fetch doanh thu cho từng collaborator
  useEffect(() => {
    collaborators.forEach((collaborator) => {
      dispatch(getCollaboratorRevenueDetails(collaborator.id));
    });
  }, [collaborators, dispatch]);

  // Xử lý chọn dòng
  const handleRowSelect = (collaboratorId: string) => {
    setSelectedCollaborators((prevCollaborators) => {
      if (prevCollaborators.includes(collaboratorId)) {
        return prevCollaborators.filter((id) => id !== collaboratorId);
      }
      return [...prevCollaborators, collaboratorId];
    });
  };

  // Lọc dữ liệu
  const filteredCollaborators = collaborators.filter((collaborator) => {
    const revenueData = revenueDetails.find(
      (detail) => detail.collaboratorId === collaborator.id
    );

    const {
      username,
      totalOrdersHandled,
      totalCommission,
      totalRevenue,
      revenueWithCommission,
    } = filters;

    const orderVal = totalOrdersHandled ? Number(totalOrdersHandled) : null;
    const commissionVal = totalCommission ? Number(totalCommission) : null;
    const revenueVal = totalRevenue ? Number(totalRevenue) : null;
    const revenueCommVal = revenueWithCommission
      ? Number(revenueWithCommission)
      : null;

    const matchUsername =
      username === "" ||
      collaborator.user.username.toLowerCase().includes(username.toLowerCase());

    const matchTotalOrders =
      totalOrdersHandled === "" ||
      (collaborator.totalOrdersHandled ?? 0) >= (orderVal ?? 0);

    const matchTotalCommission =
      totalCommission === "" ||
      (revenueData?.totalCommission || 0) >= (commissionVal ?? 0);

    const matchTotalRevenue =
      totalRevenue === "" ||
      (revenueData?.totalRevenue || 0) >= (revenueVal ?? 0);

    const matchRevenueWithCommission =
      revenueWithCommission === "" ||
      (revenueData?.totalRevenueWithCommission || 0) >= (revenueCommVal ?? 0);

    return (
      matchUsername &&
      matchTotalOrders &&
      matchTotalCommission &&
      matchTotalRevenue &&
      matchRevenueWithCommission
    );
  });

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value,
    });
  };

  // Tính toán dữ liệu tổng quan
  const overviewData = filteredCollaborators.map((collaborator) => {
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

  // Dữ liệu chart
  const chartData = {
    labels: overviewData.map((data) => data.username),
    datasets: [
      {
        label: "D.thu",
        data: overviewData.map((data) => data.totalRevenue),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: "D.thu+HH",
        data: overviewData.map((data) => data.revenueWithCommission),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: "H.hồng",
        data: overviewData.map((data) => data.totalCommission),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "ĐH xử lý",
        data: overviewData.map((data) => data.totalOrdersHandled),
        backgroundColor: "rgba(153, 102, 255, 0.6)",
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1,
      },
    ],
  };

  const handleExportToExcel = () => {
    try {
      const excelData = filteredCollaborators.map((collaborator, index) => {
        const revenueData = revenueDetails.find(
          (detail) => detail.collaboratorId === collaborator.id
        );
        return {
          STT: index + 1,
          ["CTV ID"]: collaborator.id,
          ["User ID"]: collaborator.user.id,
          Email: collaborator.user.email,
          Role: collaborator.user.role,
          FName: collaborator.user.firstName,
          LName: collaborator.user.lastName,
          Phone: collaborator.user.phoneNumber,
          Joined: new Date(collaborator.user.dateJoined).toLocaleDateString(),
          Birth: collaborator.user.birthDate
            ? new Date(collaborator.user.birthDate).toLocaleDateString()
            : "N/A",
          Spent: collaborator.user.totalSpent,
          RefCode: collaborator.referralCode,
          CommRate: collaborator.commissionRate,
          ["ĐH xử lý"]: collaborator.totalOrdersHandled,
          Survey: collaborator.totalSurveyHandled,
          ["HH nhận"]: formatCurrencyVND(collaborator.totalCommissionEarned),
          ["D.thu"]: formatCurrencyVND(revenueData?.totalRevenue || 0),
          ["HH"]: formatCurrencyVND(revenueData?.totalCommission || 0),
          ["D.thu+HH"]: formatCurrencyVND(
            revenueData?.totalRevenueWithCommission || 0
          ),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "CTV");
      XLSX.writeFile(workbook, "CTV.xlsx");

      setNotification({
        message: "Xuất dữ liệu (CTV) ra Excel thành công!",
        type: "success",
      });
    } catch (error: any) {
      setNotification({
        message: "Xuất dữ liệu thất bại: " + error,
        type: "error",
      });
    }
  };

  const handleExportStatisticalDataToExcel = () => {
    // Tính tổng
    const totalCommissionSum = overviewData.reduce(
      (sum, data) => sum + data.totalCommission,
      0
    );
    const totalRevenueSum = overviewData.reduce(
      (sum, data) => sum + data.totalRevenue,
      0
    );
    const totalRevenueWithCommissionSum = overviewData.reduce(
      (sum, data) => sum + data.revenueWithCommission,
      0
    );
    const totalOrdersSum = overviewData.reduce(
      (sum, data) => sum + data.totalOrdersHandled,
      0
    );

    // Dữ liệu thống kê xuất ra
    const statisticalData = [
      {
        ["Tổng HH (VND)"]: totalCommissionSum,
        ["Tổng DT (VND)"]: totalRevenueSum,
        ["DT+HH (VND)"]: totalRevenueWithCommissionSum,
        ["ĐH xử lý"]: totalOrdersSum,
      },
    ];

    try {
      const worksheet = XLSX.utils.json_to_sheet(statisticalData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "ThongKe");
      XLSX.writeFile(workbook, "ThongKe.xlsx");

      setNotification({
        message: "Xuất dữ liệu thống kê ra Excel thành công!",
        type: "success",
      });
    } catch (error: any) {
      setNotification({
        message: "Xuất dữ liệu thống kê thất bại: " + error,
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

  const displayPage = currentPage + 1;

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
              className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 ease-in-out transform hover:scale-105"
              onClick={handleExportStatisticalDataToExcel}
            >
              <FaFileExcel className="mr-2" />
              Xuất TK
            </button>
            <button
              className="flex items-center px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 ease-in-out transform hover:scale-105"
              onClick={handleExportToExcel}
            >
              <FaFileExcel className="mr-2" />
              Xuất Excel
            </button>
          </div>
        </div>

        {/* Bộ lọc */}
        <div className="flex space-x-4 mb-4 justify-end items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tên CTV:
            </label>
            <input
              type="text"
              name="username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleFilterChange}
              value={filters.username}
              placeholder="Nhập tên"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              ĐH {">="}
            </label>
            <input
              type="number"
              name="totalOrdersHandled"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleFilterChange}
              value={filters.totalOrdersHandled}
              placeholder="VD: 10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              HH {">="}
            </label>
            <input
              type="number"
              name="totalCommission"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleFilterChange}
              value={filters.totalCommission}
              placeholder="VD: 5000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              DT {">="}
            </label>
            <input
              type="number"
              name="totalRevenue"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleFilterChange}
              value={filters.totalRevenue}
              placeholder="VD: 50000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              DT+HH {">="}
            </label>
            <input
              type="number"
              name="revenueWithCommission"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleFilterChange}
              value={filters.revenueWithCommission}
              placeholder="VD: 50000000"
            />
          </div>
        </div>
      </div>

      {/* Bảng cộng tác viên */}
      <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
        <table className="min-w-full bg-white border rounded-lg shadow-sm">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="px-4 py-2 text-center">STT</th>
              <th className="px-4 py-2 text-center">CTV</th>
              <th className="px-4 py-2 text-center">Ngày</th>
              <th className="px-4 py-2 text-center">H.Hồng</th>
              <th className="px-4 py-2 text-center">D.Thu</th>
              <th className="px-4 py-2 text-center">D.Thu+HH</th>
              <th className="px-4 py-2 text-center">ĐH</th>
            </tr>
          </thead>
          <tbody>
            {filteredCollaborators.length > 0 ? (
              filteredCollaborators.map((collaborator, index) => {
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
                      {displayPage * pageSize - pageSize + index + 1}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {collaborator.user.username}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {new Date(
                        collaborator.user.dateJoined
                      ).toLocaleDateString()}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {formatCurrencyVND(revenueData?.totalCommission || 0)}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {formatCurrencyVND(revenueData?.totalRevenue || 0)}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {formatCurrencyVND(
                        revenueData?.totalRevenueWithCommission || 0
                      )}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {collaborator.totalOrdersHandled}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="border px-4 py-2 text-center text-red-500"
                >
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <Pagination
        currentPage={displayPage}
        totalPages={totalPages}
        onPageChange={(newPage) => {
          dispatch(getCollaborators({ page: newPage - 1, size: pageSize }));
        }}
      />

      {/* Thống kê tổng quan */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Thống kê tổng quan
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-white shadow rounded-lg">
            <h4 className="text-lg font-semibold">Tổng HH (VND)</h4>
            <p>
              {formatCurrencyVND(
                overviewData.reduce(
                  (sum, data) => sum + data.totalCommission,
                  0
                )
              )}
            </p>
          </div>
          <div className="p-4 bg-white shadow rounded-lg">
            <h4 className="text-lg font-semibold">Tổng DT (VND)</h4>
            <p>
              {formatCurrencyVND(
                overviewData.reduce((sum, data) => sum + data.totalRevenue, 0)
              )}
            </p>
          </div>
          <div className="p-4 bg-white shadow rounded-lg">
            <h4 className="text-lg font-semibold">DT+HH (VND)</h4>
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
            <h4 className="text-lg font-semibold">Tổng ĐH xử lý</h4>
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
        title="Thống kê"
      />
    </div>
  );
};

export default FormRevenueAdmin;
