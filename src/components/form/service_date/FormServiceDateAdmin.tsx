"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useState } from "react";
import Notification from "@/components/notification/Notification";
import { FaFileExcel } from "react-icons/fa";
import { getOrdersHistory, getServiceDates } from "@/store/order/orderSlice";
import Pagination from "@/components/pagination/Pagination";
import { barChartOptions } from "@/types/component/chart/chart";
import Chart from "@/components/chart/Chart";
import { ErrorResponseProps } from "@/types/error/error";

const FormServiceDateAdmin = () => {
  const dispatch = useAppDispatch();
  const {
    orders = [],
    serviceDates = [],
    loading,
    error,
  } = useAppSelector((state) => state.orders);

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    username: "",
    collaboratorUsername: "",
    orderStatus: "",
    startDate: "",
    totalAmount: "",
    orderDate: "",
    referralCodeUsed: "",
    endDate: "",
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Xử lý chọn dòng để xem ngày dịch vụ
  const handleRowSelect = (orderId: string) => {
    if (selectedOrder === orderId) {
      setSelectedOrder(null);
    } else {
      setSelectedOrder(orderId);
      dispatch(getServiceDates(orderId));
    }
  };

  const handleExportToExcel = () => {
    // Chức năng xuất ra Excel
  };

  const handleExportStatisticsToExcel = () => {
    // Chức năng xuất dữ liệu thống kê ra Excel
  };

  useEffect(() => {
    dispatch(getOrdersHistory());
  }, [dispatch]);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const filteredOrders = orders.filter((order) => {
    return (
        (filters.username ? order.user?.username === filters.username : true) &&
        (filters.collaboratorUsername
            ? order.collaborator?.user?.username === filters.collaboratorUsername
            : true) &&
        (filters.orderStatus ? order.statusName === filters.orderStatus : true) &&
        (filters.startDate
            ? new Date(order.startDate ?? "").toLocaleDateString() ===
            filters.startDate
            : true) &&
        (filters.totalAmount
            ? order.totalAmount && order.totalAmount >= Number(filters.totalAmount)
            : true) &&
        (filters.orderDate
            ? new Date(order.orderDate).toLocaleDateString() === filters.orderDate
            : true) &&
        (filters.endDate
            ? new Date(order.endDate ?? "").toLocaleDateString() === filters.endDate
            : true) &&
        (filters.referralCodeUsed
            ? order.referralCodeUsed === filters.referralCodeUsed
            : true)
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setSelectedOrder(null);
    }
  };

  const paginatedOrders = filteredOrders.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
  );

  const totalServiceDates = serviceDates.length;
  const totalExpiredDates = serviceDates.filter(
      (service) => new Date(service.expiryDate) < new Date()
  ).length;

  const serviceDatesByProduct = serviceDates.reduce(
      (acc: Record<string, number>, service) => {
        const productName = service.product.productName;
        acc[productName] = (acc[productName] || 0) + 1;
        return acc;
      },
      {}
  );

  const barChartData = {
    labels: Object.keys(serviceDatesByProduct),
    datasets: [
      {
        label: "Số ngày dịch vụ",
        data: Object.values(serviceDatesByProduct),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const pieChartData = {
    labels: ["Ngày dịch vụ còn hiệu lực", "Ngày dịch vụ đã hết hạn"],
    datasets: [
      {
        data: [totalServiceDates - totalExpiredDates, totalExpiredDates],
        backgroundColor: ["#4caf50", "#f44336"],
      },
    ],
  };

  if (loading) return <p>Đang tải đơn hàng...</p>;
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
              Quản lý Ngày Dịch Vụ Đơn Hàng
            </h2>
            <div className="flex space-x-2">
              <button
                  className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 ease-in-out transform hover:scale-105"
                  onClick={handleExportStatisticsToExcel}
              >
                <FaFileExcel className="mr-2" />
                Xuất dữ liệu thống kê ra Excel
              </button>
              <button
                  className="flex items-center px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 ease-in-out transform hover:scale-105"
                  onClick={handleExportToExcel}
              >
                <FaFileExcel className="mr-2" />
                Xuất ra Excel
              </button>
            </div>
          </div>

          <div className="flex space-x-4 mb-4 justify-end items-center">
            {/* Lọc theo tên người mua */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo người mua:
              </label>
              <select
                  name="username"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
                  onChange={handleFilterChange}
                  value={filters.username}
              >
                <option value="">Lọc theo tên người mua</option>
                {orders.map((order) => (
                    <option key={order.id} value={order.user?.username || ""}>
                      {order.user?.username || "Ẩn danh"}
                    </option>
                ))}
              </select>
            </div>

            {/* Lọc theo cộng tác viên */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo cộng tác viên:
              </label>
              <select
                  name="collaboratorUsername"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
                  onChange={handleFilterChange}
                  value={filters.collaboratorUsername}
              >
                <option value="">Lọc theo tên cộng tác viên</option>
                {orders.map((order) => (
                    <option
                        key={order.id}
                        value={order.collaborator?.user?.username || ""}
                    >
                      {order.collaborator?.user?.username || "N/A"}
                    </option>
                ))}
              </select>
            </div>

            {/* Lọc theo trạng thái đơn hàng */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo trạng thái đơn hàng:
              </label>
              <select
                  name="orderStatus"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
                  onChange={handleFilterChange}
                  value={filters.orderStatus}
              >
                <option value="">Lọc theo trạng thái đơn hàng</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Complete">Complete</option>
                <option value="Cancel">Cancel</option>
              </select>
            </div>

            {/* Lọc theo ngày bắt đầu dịch vụ */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo ngày bắt đầu dịch vụ:
              </label>
              <select
                  name="startDate"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
                  onChange={handleFilterChange}
                  value={filters.startDate}
              >
                <option value="">Lọc theo ngày bắt đầu</option>
                {orders
                    .map((order) =>
                        order.startDate
                            ? new Date(order.startDate).toLocaleDateString()
                            : ""
                    )
                    .filter((date) => date !== "")
                    .map((date, index) => (
                        <option key={index} value={date}>
                          {date}
                        </option>
                    ))}
              </select>
            </div>

            {/* Lọc theo tổng giá trị đơn hàng */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo tổng giá trị đơn hàng:
              </label>
              <select
                  name="totalAmount"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
                  onChange={handleFilterChange}
                  value={filters.totalAmount}
              >
                <option value="">Lọc theo tổng giá trị</option>
                <option value="100000">{">"} 100,000 VND</option>
                <option value="500000">{">"} 500,000 VND</option>
                <option value="1000000">{">"} 1,000,000 VND</option>
              </select>
            </div>

            {/* Lọc theo ngày đặt hàng */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo ngày đặt hàng:
              </label>
              <select
                  name="orderDate"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
                  onChange={handleFilterChange}
                  value={filters.orderDate}
              >
                <option value="">Lọc theo ngày đặt hàng</option>
                {orders
                    .map((order) => new Date(order.orderDate).toLocaleDateString())
                    .filter((date, i, arr) => arr.indexOf(date) === i) // loại bỏ trùng lặp
                    .map((date, index) => (
                        <option key={index} value={date}>
                          {date}
                        </option>
                    ))}
              </select>
            </div>

            {/* Lọc theo ngày kết thúc dịch vụ */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo ngày kết thúc dịch vụ:
              </label>
              <select
                  name="endDate"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
                  onChange={handleFilterChange}
                  value={filters.endDate}
              >
                <option value="">Lọc theo ngày kết thúc</option>
                {orders
                    .map((order) =>
                        order.endDate
                            ? new Date(order.endDate).toLocaleDateString()
                            : ""
                    )
                    .filter((date) => date !== "")
                    .map((date, index) => (
                        <option key={index} value={date}>
                          {date}
                        </option>
                    ))}
              </select>
            </div>

            {/* Lọc theo mã giới thiệu */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo mã giới thiệu:
              </label>
              <select
                  name="referralCodeUsed"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 pr-10"
                  onChange={handleFilterChange}
                  value={filters.referralCodeUsed}
              >
                <option value="">Lọc theo mã giới thiệu</option>
                {orders
                    .map((order) => order.referralCodeUsed || "")
                    .filter((code) => code !== "")
                    .filter((code, i, arr) => arr.indexOf(code) === i) // loại bỏ trùng lặp
                    .map((code, index) => (
                        <option key={index} value={code}>
                          {code}
                        </option>
                    ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bảng Đơn hàng */}
        {filteredOrders.length > 0 ? (
            <>
              <h3 className="text-xl font-semibold mb-2">Đơn hàng</h3>
              <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
                <table className="min-w-full bg-white border rounded-lg shadow-sm">
                  <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="px-4 py-2 text-center">STT</th>
                    <th className="px-4 py-2 text-center">Tên người dùng</th>
                    <th className="px-4 py-2 text-center">Email người dùng</th>
                    <th className="px-4 py-2 text-center">Số điện thoại người dùng</th>
                    <th className="px-4 py-2 text-center">Tên cộng tác viên</th>
                    <th className="px-4 py-2 text-center">Email cộng tác viên</th>
                    <th className="px-4 py-2 text-center">Số điện thoại cộng tác viên</th>
                    <th className="px-4 py-2 text-center">Tổng số đơn hàng cộng tác viên đã xử lý</th>
                    <th className="px-4 py-2 text-center">Trạng thái đơn hàng</th>
                    <th className="px-4 py-2 text-center">Tổng giá trị</th>
                    <th className="px-4 py-2 text-center">Ngày đặt hàng</th>
                    <th className="px-4 py-2 text-center">Ngày bắt đầu</th>
                    <th className="px-4 py-2 text-center">Ngày kết thúc</th>
                    <th className="px-4 py-2 text-center">Mã giới thiệu đã sử dụng</th>
                  </tr>
                  </thead>

                  <tbody>
                  {paginatedOrders.length > 0 ? (
                      paginatedOrders.map((order, index) => (
                          <tr
                              key={`${order.id}-${index}`}
                              className={`hover:bg-gray-50 transition ease-in-out duration-200 cursor-pointer ${
                                  selectedOrder === order.id
                                      ? "bg-indigo-100"
                                      : "hover:bg-gray-50"
                              }`}
                              onClick={() => handleRowSelect(order.id)}
                          >
                            <td className="border px-4 py-2 text-center">
                              {(currentPage - 1) * rowsPerPage + index + 1}
                            </td>
                            <td className="border px-4 py-2 text-center">
                              {String(
                                  order.user?.username ||
                                  order.anonymousUser?.username ||
                                  "Ẩn danh"
                              )}
                            </td>
                            <td className="border px-4 py-2 text-center">
                              {String(
                                  order.user?.email ||
                                  order.anonymousUser?.email ||
                                  "N/A"
                              )}
                            </td>
                            <td className="border px-4 py-2 text-center">
                              {String(
                                  order.user?.phoneNumber ||
                                  order.anonymousUser?.phoneNumber ||
                                  "N/A"
                              )}
                            </td>
                            <td className="border px-4 py-2 text-center">
                              {order.collaborator?.user?.username || "N/A"}
                            </td>
                            <td className="border px-4 py-2 text-center">
                              {order.collaborator?.user?.email || "N/A"}
                            </td>
                            <td className="border px-4 py-2 text-center">
                              {order.collaborator?.user?.phoneNumber || "N/A"}
                            </td>
                            <td className="border px-4 py-2 text-center">
                              {order.collaborator?.totalOrdersHandled || "0"}
                            </td>
                            <td className="border px-4 py-2 text-center">
                        <span
                            className={`px-3 py-1 rounded-full text-white text-sm whitespace-nowrap flex justify-center items-center ${
                                order.statusName === "Open"
                                    ? "bg-green-500"
                                    : order.statusName === "Complete"
                                        ? "bg-slate-400"
                                        : "bg-indigo-500"
                            }`}
                        >
                          {order.statusName}
                        </span>
                            </td>
                            <td className="border px-4 py-2 text-center">
                              {order.totalAmount || "0"}
                            </td>
                            <td className="border px-4 py-2 text-center">
                              {order.orderDate
                                  ? new Date(order.orderDate).toLocaleDateString()
                                  : "N/A"}
                            </td>
                            <td className="border px-4 py-2 text-center">
                              {order.startDate
                                  ? new Date(order.startDate).toLocaleDateString()
                                  : "N/A"}
                            </td>
                            <td className="border px-4 py-2 text-center">
                              {order.endDate
                                  ? new Date(order.endDate).toLocaleDateString()
                                  : "N/A"}
                            </td>
                            <td className="border px-4 py-2 text-center">
                              {order.referralCodeUsed || "N/A"}
                            </td>
                          </tr>
                      ))
                  ) : (
                      <tr>
                        <td colSpan={14} className="text-center py-4">
                          Không có ngày dịch vụ
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </>
        ) : (
            <>
              <h3 className="text-xl font-semibold mb-2">Đơn hàng</h3>
              <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
                <table className="min-w-full bg-white border rounded-lg shadow-sm">
                  <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="px-4 py-2 text-center">STT</th>
                    <th className="px-4 py-2 text-center">Tên người dùng</th>
                    <th className="px-4 py-2 text-center">Email người dùng</th>
                    <th className="px-4 py-2 text-center">
                      Số điện thoại người dùng
                    </th>
                    <th className="px-4 py-2 text-center">Tên cộng tác viên</th>
                    <th className="px-4 py-2 text-center">Email cộng tác viên</th>
                    <th className="px-4 py-2 text-center">
                      Số điện thoại cộng tác viên
                    </th>
                    <th className="px-4 py-2 text-center">
                      Tổng số đơn hàng cộng tác viên đã xử lý
                    </th>
                    <th className="px-4 py-2 text-center">Trạng thái đơn hàng</th>
                    <th className="px-4 py-2 text-center">Tổng giá trị</th>
                    <th className="px-4 py-2 text-center">Ngày đặt hàng</th>
                    <th className="px-4 py-2 text-center">Ngày bắt đầu</th>
                    <th className="px-4 py-2 text-center">Ngày kết thúc</th>
                    <th className="px-4 py-2 text-center">
                      Mã giới thiệu đã sử dụng
                    </th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr>
                    <td colSpan={14} className="text-center py-4">
                      Không có ngày dịch vụ
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </>
        )}

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Đang hiển thị từ{" "}
            {Math.min((currentPage - 1) * rowsPerPage + 1, orders.length)} đến{" "}
            {Math.min(currentPage * rowsPerPage, orders.length)} trên tổng số{" "}
            {orders.length} mục
          </p>

          <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
          />
        </div>

        {selectedOrder && serviceDates.length > 0 && (
            <>
              <h3 className="text-xl font-semibold mt-4 mb-2">Ngày dịch vụ</h3>
              <div className="overflow-x-auto border rounded-lg shadow-sm mb-6">
                <table className="min-w-full bg-white border rounded-lg shadow-sm">
                  <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="px-4 py-2 text-center">Tên sản phẩm</th>
                    <th className="px-4 py-2 text-center">Ngày hết hạn</th>
                  </tr>
                  </thead>
                  <tbody>
                  {serviceDates.map((service) => (
                      <tr key={service.id}>
                        <td className="border px-4 py-2 text-center">
                          {service.product.productName}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {new Date(service.expiryDate).toLocaleDateString()}
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </>
        )}

        {/* Biểu đồ thống kê tổng quan ngày dịch vụ */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold">Tổng quan về ngày dịch vụ</h3>
          <div className="grid grid-cols-2 gap-4">
            <Chart
                type="bar"
                data={barChartData}
                options={barChartOptions}
                title="Phân phối ngày dịch vụ theo sản phẩm"
            />
            <Chart
                type="pie"
                data={pieChartData}
                title="Trạng thái ngày dịch vụ"
                options={barChartOptions}
            />
          </div>
        </div>
      </div>
  );
};

export default FormServiceDateAdmin;
