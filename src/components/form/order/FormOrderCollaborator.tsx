"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useState } from "react";
import Notification from "@/components/notification/Notification";
import { FaCheck, FaChevronCircleLeft, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { getMyInfo } from "@/store/user/userSlice";
import { getCollaboratorByUserId } from "@/store/collaborator/collaboratorSlice";
import {
  completeOrder,
  getCollaboratorOrderHistory,
  processOrder,
} from "@/store/order/orderSlice";
import Pagination from "@/components/pagination/Pagination";
import { barChartOptions } from "@/types/component/chart/chart";
import Chart from "@/components/chart/Chart";
import { OrderItemsResponse } from "@/types/order/order";
import { formatCurrencyVND, formatPhoneNumber } from "@/utils/utils/utils";
import { ErrorResponseProps } from "@/types/error/error";
import {extractError} from "@/utils/utils/helper";

const FormOrderCollaborator = () => {
  const dispatch = useAppDispatch();
  const { orders, loading, error } = useAppSelector((state) => state.orders);

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [collaboratorId, setCollaboratorId] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItemsResponse[]>([]);

  const [filters, setFilters] = useState({
    username: "",
    orderStatus: "",
    orderDate: "",
    startDate: "",
    endDate: "",
    totalAmount: "",
  });

  // Lấy dữ liệu cộng tác viên
  const getCollaboratorData = async () => {
    try {
      await dispatch(getMyInfo());
      const id = await dispatch(getCollaboratorByUserId()).unwrap();
      setCollaboratorId(id);
      dispatch(getCollaboratorOrderHistory(id));
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Lấy dữ liệu cộng tác viên thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  // Xử lý đơn hàng
  const handleProcessOrder = async (orderId: string) => {
    if (!collaboratorId) return;
    try {
      await dispatch(
          processOrder({
            orderId,
            collaboratorId,
          })
      ).unwrap();
      setNotification({
        message: "Xử lý đơn hàng thành công!",
        type: "success",
      });
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Xử lý đơn hàng thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  // Hoàn thành đơn hàng
  const handleCompleteOrder = async (orderId: string) => {
    if (!collaboratorId) return;
    try {
      await dispatch(
          completeOrder({
            orderId,
            collaboratorId,
          })
      ).unwrap();
      setNotification({
        message: "Hoàn thành đơn hàng thành công!",
        type: "success",
      });
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Hoàn thành đơn hàng thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  // Chọn dòng
  const handleRowSelect = (orderId: string) => {
    if (selectedOrder === orderId) {
      setSelectedOrder(null);
      setSelectedOrderItems([]);
    } else {
      const order = orders.find((order) => order.id === orderId);
      setSelectedOrder(orderId);
      setSelectedOrderItems(order?.orderItems || []);
    }
  };

  const handleExportToExcel = () => {
    try {
      const excelData = orders.flatMap((order, index) => {
        return order.orderItems.map((orderItem, itemIndex) => ({
          STT: index + 1,
          ["STT Sản phẩm"]: itemIndex + 1,
          ["ID Đơn hàng"]: order.id,
          ["Tên người mua"]: order.user?.username || "Anonymous",
          ["Email người mua"]: order.user?.email || "N/A",
          ["SĐT người mua"]: order.user?.phoneNumber || "N/A",
          ["Tổng số tiền"]: order.totalAmount,
          ["Ngày đặt hàng"]: order.orderDate
              ? new Date(order.orderDate).toLocaleDateString()
              : "N/A",
          ["Ngày bắt đầu"]: order.startDate
              ? new Date(order.startDate).toLocaleDateString()
              : "N/A",
          ["Ngày kết thúc"]: order.endDate
              ? new Date(order.endDate).toLocaleDateString()
              : "N/A",
          ["Mã giới thiệu"]: order.referralCodeUsed || "N/A",
          ["Tên sản phẩm"]: orderItem.product.productName,
          ["Mã sản phẩm"]: orderItem.product.productCode,
          ["Số lượng"]: orderItem.quantity,
          ["Giá"]: orderItem.price,
          ["Ngày hết hạn"]: new Date(orderItem.expiryDate).toLocaleDateString(),
        }));
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Đơn hàng");

      XLSX.writeFile(workbook, "DonHang.xlsx");

      setNotification({
        message: "Xuất dữ liệu thành công!",
        type: "success",
      });
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Xuất dữ liệu thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  useEffect(() => {
    getCollaboratorData();
  }, [dispatch]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredOrders = orders.filter((order) => {
    const matchesUsername =
        filters.username === "" || order.user?.username === filters.username;

    const matchesOrderStatus =
        filters.orderStatus === "" || order.statusName === filters.orderStatus;

    const matchesOrderDate =
        filters.orderDate === "" ||
        (order.orderDate &&
            new Date(order.orderDate).toLocaleDateString() === filters.orderDate);

    const matchesStartDate =
        filters.startDate === "" ||
        (order.startDate &&
            new Date(order.startDate).toLocaleDateString() === filters.startDate);

    const matchesEndDate =
        filters.endDate === "" ||
        (order.endDate &&
            new Date(order.endDate).toLocaleDateString() === filters.endDate);

    const matchesTotalAmount =
        filters.totalAmount === "" ||
        (order.totalAmount || 0) >= parseFloat(filters.totalAmount);

    return (
        matchesUsername &&
        matchesOrderStatus &&
        matchesOrderDate &&
        matchesStartDate &&
        matchesEndDate &&
        matchesTotalAmount
    );
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setSelectedOrder(null);
      setSelectedOrderItems([]);
    }
  };

  const paginatedOrders = filteredOrders.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
  );

  const totalOrders = orders.length;

  const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
  );

  const orderStatusDistribution = orders.reduce((acc, order) => {
    acc[order.statusName] = (acc[order.statusName] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const referralCodeUsage = orders.reduce((acc, order) => {
    const referralCode = order.referralCodeUsed || "Không có mã giới thiệu";
    acc[referralCode] = (acc[referralCode] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const orderStatusChartData = {
    labels: Object.keys(orderStatusDistribution),
    datasets: [
      {
        data: Object.values(orderStatusDistribution),
        backgroundColor: ["#4caf50", "#ff9800", "#f44336", "#2196f3"],
        hoverBackgroundColor: ["#66bb6a", "#ffb74d", "#e57373", "#64b5f6"],
      },
    ],
  };

  const referralCodeChartData = {
    labels: Object.keys(referralCodeUsage),
    datasets: [
      {
        label: "Số đơn hàng với mã giới thiệu",
        data: Object.values(referralCodeUsage),
        backgroundColor: "#2196f3",
        hoverBackgroundColor: "#64b5f6",
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

  const uniqueDates = Array.from(
      new Set(orders.map((order) => new Date(order.orderDate).toLocaleDateString()))
  );

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
              Quản lý đơn hàng
            </h2>
            <div className="flex space-x-2">
              <button
                  className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 ease-in-out transform hover:scale-105"
              >
                <FaFileExcel className="mr-2" />
                Xuất dữ liệu thống kê sang Excel
              </button>
              <button
                  className="flex items-center px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 ease-in-out transform hover:scale-105"
                  onClick={handleExportToExcel}
              >
                <FaFileExcel className="mr-2" />
                Xuất sang Excel
              </button>
            </div>
          </div>

          <div className="flex space-x-4 mb-4 justify-end items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo tên người dùng:
              </label>
              <select
                  name="username"
                  value={filters.username}
                  onChange={handleFilterChange}
                  className="mt-1 border p-2 rounded"
              >
                <option value="">Lọc theo tên</option>
                {Array.from(
                    new Set(orders.map((order) => order.user?.username))
                ).map((username, index) => (
                    <option key={index} value={username}>
                      {username}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo trạng thái đơn hàng:
              </label>
              <select
                  name="orderStatus"
                  value={filters.orderStatus}
                  onChange={handleFilterChange}
                  className="mt-1 border p-2 rounded"
              >
                <option value="">Lọc theo trạng thái đơn hàng</option>
                {Array.from(new Set(orders.map((order) => order.statusName))).map(
                    (status, index) => (
                        <option key={index} value={status}>
                          {status}
                        </option>
                    )
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo ngày đặt hàng:
              </label>
              <select
                  name="orderDate"
                  value={filters.orderDate}
                  onChange={handleFilterChange}
                  className="mt-1 border p-2 rounded"
              >
                <option value="">Lọc theo ngày đặt hàng</option>
                {uniqueDates.map((date, index) => (
                    <option key={index} value={date}>
                      {date}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo ngày bắt đầu dịch vụ:
              </label>
              <select
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="mt-1 border p-2 rounded"
              >
                <option value="">Lọc theo ngày bắt đầu</option>
                {uniqueDates.map((date, index) => (
                    <option key={index} value={date}>
                      {date}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo ngày kết thúc dịch vụ:
              </label>
              <select
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="mt-1 border p-2 rounded"
              >
                <option value="">Lọc theo ngày kết thúc</option>
                {uniqueDates.map((date, index) => (
                    <option key={index} value={date}>
                      {date}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo tổng giá trị đơn hàng:
              </label>
              <select
                  name="totalAmount"
                  value={filters.totalAmount}
                  onChange={handleFilterChange}
                  className="mt-1 border p-2 rounded"
              >
                <option value="">Lọc theo tổng giá trị ({"≥"})</option>
                <option value="100000">100,000</option>
                <option value="500000">500,000</option>
                <option value="1000000">1,000,000</option>
              </select>
            </div>
          </div>
        </div>

        {orders.length > 0 ? (
            <>
              <h3 className="text-xl font-semibold mb-2">Đơn hàng</h3>
              <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
                <table className="min-w-full bg-white border rounded-lg shadow-sm">
                  <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="px-4 py-2 text-center">STT</th>
                    <th className="px-4 py-2 text-center">Tên người mua</th>
                    <th className="px-4 py-2 text-center">Email Người mua</th>
                    <th className="px-4 py-2 text-center">
                      Số điện thoại người mua
                    </th>
                    <th className="px-4 py-2 text-center">Trạng thái đơn hàng</th>
                    <th className="px-4 py-2 text-center">Tổng số tiền</th>
                    <th className="px-4 py-2 text-center">Ngày đặt hàng</th>
                    <th className="px-4 py-2 text-center">Ngày bắt đầu</th>
                    <th className="px-4 py-2 text-center">Ngày kết thúc</th>
                    <th className="px-4 py-2 text-center">Mã giới thiệu</th>
                  </tr>
                  </thead>
                  <tbody>
                  {paginatedOrders.length > 0 ? (
                      paginatedOrders.map((order, index) => (
                          <tr
                              key={`${order.id}-${index}`}
                              className={`hover:bg-gray-50 transition ease-in-out duration-200 cursor-pointer ${
                                  selectedOrder === order.id ? "bg-indigo-100" : ""
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
                                  "Anonymous"
                              )}
                            </td>
                            <td className="border px-4 py-2">
                              {String(
                                  order.user?.email ||
                                  order.anonymousUser?.email ||
                                  "N/A"
                              )}
                            </td>
                            <td className="border px-4 py-2">
                              {formatPhoneNumber(
                                  String(
                                      order.user?.phoneNumber ||
                                      order.anonymousUser?.phoneNumber ||
                                      "N/A"
                                  )
                              )}
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
                              {formatCurrencyVND(order.totalAmount)}
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
                            <td className="border px-4 py-2 text-center space-x-2">
                              <button
                                  className={`text-yellow-600 hover:text-yellow-800 transition transform ${
                                      order.statusName === "In Progress" ||
                                      order.statusName === "Complete"
                                          ? "opacity-50 cursor-not-allowed"
                                          : "hover:scale-110"
                                  }`}
                                  disabled={
                                      order.statusName === "Complete" ||
                                      order.statusName === "In Progress"
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleProcessOrder(order.id);
                                  }}
                              >
                                <FaChevronCircleLeft />
                              </button>
                            </td>
                            <td className="border px-4 py-2 text-center space-x-2">
                              <button
                                  className={`text-green-600 hover:text-green-800 transition transform ${
                                      order.statusName === "Complete" ||
                                      order.statusName === "Open"
                                          ? "opacity-50 cursor-not-allowed"
                                          : "hover:scale-110"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCompleteOrder(order.id);
                                  }}
                                  disabled={
                                      order.statusName === "Open" ||
                                      order.statusName === "Complete"
                                  }
                              >
                                <FaCheck />
                              </button>
                            </td>
                          </tr>
                      ))
                  ) : (
                      <tr>
                        <td colSpan={14} className="text-center py-4">
                          Không có đơn hàng
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </>
        ) : (
            <div className="text-center py-4 text-gray-500">Không có đơn hàng</div>
        )}

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Đang hiển thị từ {(currentPage - 1) * rowsPerPage + 1} đến{" "}
            {Math.min(currentPage * rowsPerPage, orders.length)} trên tổng số{" "}
            {orders.length} mục
          </p>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>

        {selectedOrder && selectedOrderItems.length > 0 && (
            <>
              <h3 className="text-xl font-semibold mt-4 mb-2">Sản phẩm trong đơn hàng</h3>
              <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
                <table className="min-w-full bg-white border rounded-lg shadow-sm">
                  <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="px-4 py-2 text-center">STT</th>
                    <th className="px-4 py-2 text-center">Tên sản phẩm</th>
                    <th className="px-4 py-2 text-center">Mã sản phẩm</th>
                    <th className="px-4 py-2 text-center">Số lượng</th>
                    <th className="px-4 py-2 text-center">Giá</th>
                    <th className="px-4 py-2 text-center">Ngày hết hạn</th>
                  </tr>
                  </thead>
                  <tbody>
                  {selectedOrderItems.map((orderItem, index) => (
                      <tr key={`${orderItem.id}-${index}`}>
                        <td className="border px-4 py-2 text-center">
                          {index + 1}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {orderItem.product.productName}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {orderItem.product.productCode}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {orderItem.quantity}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {orderItem.price}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {new Date(orderItem.expiryDate).toLocaleDateString()}
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Tổng đơn hàng
            </h3>
            <p className="text-3xl font-bold text-indigo-600">{totalOrders}</p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Tổng doanh thu
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {totalRevenue.toLocaleString()} VND
            </p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Trạng thái đơn hàng
            </h3>
            <ul className="text-gray-600">
              {Object.entries(orderStatusDistribution).map(([status, count]) => (
                  <li key={status}>
                    {status}: {count}
                  </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Chart
              type="pie"
              data={orderStatusChartData}
              options={{ maintainAspectRatio: false }}
              title="Phân phối trạng thái đơn hàng"
          />
          <Chart
              type="bar"
              data={referralCodeChartData}
              options={barChartOptions}
              title="Sử dụng mã giới thiệu"
          />
        </div>
      </div>
  );
};

export default FormOrderCollaborator;
