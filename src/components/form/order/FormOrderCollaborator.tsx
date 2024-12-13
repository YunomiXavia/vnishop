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
import { OrderItemsResponse } from "@/types/order/order";
import { formatCurrencyVND, formatPhoneNumber } from "@/utils/utils/utils";
import { ErrorResponseProps } from "@/types/error/error";
import { extractError } from "@/utils/utils/helper";
import Chart from "@/components/chart/Chart";
import { barChartOptions } from "@/types/component/chart/chart";

const FormOrderCollaborator = () => {
  const dispatch = useAppDispatch();
  const { orders, loading, error, totalPages, totalElements, pageSize } =
    useAppSelector((state) => state.orders);

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1); // 1-based
  const [collaboratorId, setCollaboratorId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<
    OrderItemsResponse[]
  >([]);
  const [filters, setFilters] = useState({
    username: "",
    orderStatus: "",
    orderDateFrom: "",
    orderDateTo: "",
    serviceStartDateFrom: "",
    serviceStartDateTo: "",
    serviceEndDateFrom: "",
    serviceEndDateTo: "",
    minTotalAmount: "",
  });
  const [statistics, setStatistics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    // totalCollaborators: 0, // Đã loại bỏ
  });
  const [chartsData, setChartsData] = useState({
    orderStatusDistribution: {
      labels: [] as string[],
      datasets: [
        {
          data: [] as number[],
          backgroundColor: ["#4caf50", "#ff9800", "#f44336", "#2196f3"],
          hoverBackgroundColor: ["#66bb6a", "#ffb74d", "#e57373", "#64b5f6"],
        },
      ],
    },
    topProducts: {
      labels: [] as string[],
      datasets: [
        {
          label: "Số lượng bán",
          data: [] as number[],
          backgroundColor: "#2196f3",
          hoverBackgroundColor: "#64b5f6",
        },
      ],
    },
    // topCollaborators: { // Đã loại bỏ
    //   labels: [] as string[],
    //   datasets: [
    //     {
    //       label: "Doanh thu (VND)",
    //       data: [] as number[],
    //       backgroundColor: "#4caf50",
    //       hoverBackgroundColor: "#66bb6a",
    //     },
    //   ],
    // },
  });

  const getCollaboratorData = async (page: number = 1, size: number = 10) => {
    try {
      await dispatch(getMyInfo());
      const id = await dispatch(getCollaboratorByUserId()).unwrap();
      setCollaboratorId(id);
      dispatch(
        getCollaboratorOrderHistory({
          collaboratorId: id,
          page: page - 1,
          size,
          filters, // Truyền bộ lọc
        })
      );
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Lấy dữ liệu cộng tác viên thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

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
      getCollaboratorData(currentPage, pageSize);
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Xử lý đơn hàng thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

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
      getCollaboratorData(currentPage, pageSize);
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Hoàn thành đơn hàng thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

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
          STT: (currentPage - 1) * pageSize + index + 1, // Rút gọn STT
          ["STT SP"]: itemIndex + 1, // Rút gọn STT Sản phẩm
          ["ID ĐH"]: order.id, // Rút gọn ID Đơn hàng
          ["Người mua"]: order.user?.username || "Anonymous", // Rút gọn Tên người mua
          ["Email"]: order.user?.email || "N/A", // Tách Email và SĐT
          ["SĐT"]: order.user?.phoneNumber || "N/A",
          ["Trạng thái"]: order.statusName, // Giữ nguyên
          ["Tổng tiền"]: order.totalAmount, // Giữ nguyên
          ["Đặt hàng"]: order.orderDate
            ? new Date(order.orderDate).toLocaleDateString()
            : "N/A", // Rút gọn Ngày đặt hàng
          ["Bắt đầu"]: order.startDate
            ? new Date(order.startDate).toLocaleDateString()
            : "N/A", // Rút gọn Ngày bắt đầu dịch vụ
          ["Kết thúc"]: order.endDate
            ? new Date(order.endDate).toLocaleDateString()
            : "N/A", // Rút gọn Ngày kết thúc dịch vụ
          ["Tổng giá trị"]: order.totalAmount, // Rút gọn Tổng giá trị đơn hàng
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

  const handleExportStatisticsToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Phân bố trạng thái đơn hàng
      const statusData = chartsData.orderStatusDistribution.labels.map(
        (label, index) => ({
          ["Trạng thái"]: label,
          ["Số lượng"]:
            chartsData.orderStatusDistribution.datasets[0].data[index],
        })
      );
      const statusSheet = XLSX.utils.json_to_sheet(statusData);
      XLSX.utils.book_append_sheet(workbook, statusSheet, "PhanBoTrangThai");

      // Sheet 2: Top 5 Sản phẩm bán chạy
      const productsData = chartsData.topProducts.labels.map(
        (label, index) => ({
          ["Sản phẩm"]: label,
          ["Số lượng bán"]: chartsData.topProducts.datasets[0].data[index],
        })
      );
      const productsSheet = XLSX.utils.json_to_sheet(productsData);
      XLSX.utils.book_append_sheet(workbook, productsSheet, "Top5SanPham");

      // Nếu bạn muốn thêm các sheet khác, hãy làm tương tự

      XLSX.writeFile(workbook, "ThongKeCharts.xlsx");

      setNotification({
        message: "Xuất dữ liệu thống kê thành công!",
        type: "success",
      });
    } catch (error: unknown) {
      const err = extractError(error);
      setNotification({
        message: `Xuất dữ liệu thống kê thất bại: ${err.code}: ${err.message}`,
        type: "error",
      });
    }
  };

  useEffect(() => {
    getCollaboratorData(currentPage, pageSize);
  }, [currentPage, pageSize, filters]); // Thêm filters vào dependency

  const handleFilterChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1); // Reset về trang đầu tiên khi bộ lọc thay đổi
  };

  useEffect(() => {
    if (orders.length > 0) {
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      );
      const totalProducts = orders.reduce(
        (sum, order) =>
          sum +
          order.orderItems.reduce(
            (itemSum, item) => itemSum + item.quantity,
            0
          ),
        0
      );
      // const totalCollaborators = new Set( // Đã loại bỏ
      //     orders
      //         .map((order) => order.collaborator?.user?.username)
      //         .filter(Boolean)
      // ).size;

      setStatistics({
        totalOrders,
        totalRevenue,
        totalProducts,
        // totalCollaborators, // Đã loại bỏ
      });

      const orderStatusDistribution: { [key: string]: number } = orders.reduce(
        (acc, order) => {
          acc[order.statusName] = (acc[order.statusName] || 0) + 1;
          return acc;
        },
        {} as { [key: string]: number }
      );

      const productQuantityDistribution: { [key: string]: number } = orders
        .flatMap((order) => order.orderItems)
        .reduce((acc, item) => {
          acc[item.product.productName] =
            (acc[item.product.productName] || 0) + item.quantity;
          return acc;
        }, {} as { [key: string]: number });

      const topProducts = Object.entries(productQuantityDistribution)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      // const collaboratorRevenue: { [key: string]: number } = orders.reduce( // Đã loại bỏ
      //     (acc, order) => {
      //       const collaboratorName = order.collaborator?.user?.username || "Ẩn danh";
      //       acc[collaboratorName] =
      //           (acc[collaboratorName] || 0) + order.totalAmount;
      //       return acc;
      //     },
      //     {} as { [key: string]: number }
      // );

      // const topCollaborators = Object.entries(collaboratorRevenue) // Đã loại bỏ
      //     .sort(([, a], [, b]) => b - a)
      //     .slice(0, 5);

      setChartsData({
        orderStatusDistribution: {
          labels: Object.keys(orderStatusDistribution),
          datasets: [
            {
              data: Object.values(orderStatusDistribution),
              backgroundColor: ["#4caf50", "#ff9800", "#f44336", "#2196f3"],
              hoverBackgroundColor: [
                "#66bb6a",
                "#ffb74d",
                "#e57373",
                "#64b5f6",
              ],
            },
          ],
        },
        topProducts: {
          labels: topProducts.map(([name]) => name),
          datasets: [
            {
              label: "Số lượng bán",
              data: topProducts.map(([, quantity]) => quantity),
              backgroundColor: "#2196f3",
              hoverBackgroundColor: "#64b5f6",
            },
          ],
        },
        // topCollaborators: { // Đã loại bỏ
        //   labels: topCollaborators.map(([name]) => name),
        //   datasets: [
        //     {
        //       label: "Doanh thu (VND)",
        //       data: topCollaborators.map(([, revenue]) => revenue),
        //       backgroundColor: "#4caf50",
        //       hoverBackgroundColor: "#66bb6a",
        //     },
        //   ],
        // },
      });
    }
  }, [orders]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setSelectedOrder(null);
      setSelectedOrderItems([]);
    }
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

      <div className="p-4 mx-auto">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-semibold text-indigo-700">
            Quản lý đơn hàng
          </h2>
          <div className="flex space-x-2">
            <button
              type="button"
              className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 ease-in-out transform hover:scale-105"
              onClick={handleExportToExcel}
            >
              <FaFileExcel className="mr-2" />
              Xuất Excel
            </button>
            <button
              type="button"
              className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 ease-in-out transform hover:scale-105"
              onClick={handleExportStatisticsToExcel}
            >
              <FaFileExcel className="mr-2" />
              Xuất Thống Kê
            </button>
          </div>
        </div>

        <div className="flex flex-wrap space-x-4 mb-4 justify-end items-center">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700">
              Tên người dùng:
            </label>
            <input
              type="text"
              name="username"
              className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              placeholder="Nhập tên người dùng"
              onChange={handleFilterChange}
              value={filters.username}
            />
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700">
              Trạng thái:
            </label>
            <select
              name="orderStatus"
              className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleFilterChange}
              value={filters.orderStatus}
            >
              <option value="">Tất cả</option>
              {["Open", "In Progress", "Complete", "Cancel"].map(
                (status, i) => (
                  <option key={i} value={status}>
                    {status}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700">
              Đặt hàng:
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                name="orderDateFrom"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                onChange={handleFilterChange}
                value={filters.orderDateFrom}
              />
              <span className="self-end">-</span>
              <input
                type="date"
                name="orderDateTo"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                onChange={handleFilterChange}
                value={filters.orderDateTo}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700">
              Bắt đầu:
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                name="serviceStartDateFrom"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                onChange={handleFilterChange}
                value={filters.serviceStartDateFrom}
              />
              <span className="self-end">-</span>
              <input
                type="date"
                name="serviceStartDateTo"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                onChange={handleFilterChange}
                value={filters.serviceStartDateTo}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700">
              Kết thúc:
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                name="serviceEndDateFrom"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                onChange={handleFilterChange}
                value={filters.serviceEndDateFrom}
              />
              <span className="self-end">-</span>
              <input
                type="date"
                name="serviceEndDateTo"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                onChange={handleFilterChange}
                value={filters.serviceEndDateTo}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700">
              Giá trị từ:
            </label>
            <input
              type="number"
              name="minTotalAmount"
              className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              placeholder="Số tiền tối thiểu"
              onChange={handleFilterChange}
              value={filters.minTotalAmount}
              min="0"
            />
          </div>
        </div>
      </div>

      {orders.length > 0 ? (
        <>
          <h3 className="text-xl font-semibold mb-2 mt-8">Đơn hàng</h3>
          <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
            <table className="min-w-full bg-white border rounded-lg shadow-sm">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="px-4 py-2 text-center">STT</th>
                  <th className="px-4 py-2 text-center">Người mua</th>
                  <th className="px-4 py-2 text-center">Email</th>
                  <th className="px-4 py-2 text-center">Trạng thái</th>
                  <th className="px-4 py-2 text-center">Tổng tiền</th>
                  <th className="px-4 py-2 text-center">Đặt hàng</th>
                  <th className="px-4 py-2 text-center">Bắt đầu</th>
                  <th className="px-4 py-2 text-center">Kết thúc</th>
                  <th className="px-4 py-2 text-center">Tổng giá trị</th>
                  <th className="px-4 py-2 text-center">Xử lý</th>
                  <th className="px-4 py-2 text-center">Hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr
                    key={`${order.id}-${index}`}
                    className={`hover:bg-gray-50 transition ease-in-out duration-200 cursor-pointer ${
                      selectedOrder === order.id ? "bg-indigo-100" : ""
                    }`}
                    onClick={() => handleRowSelect(order.id)}
                  >
                    <td className="border px-4 py-2 text-center">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {order.user?.username || "Anonymous"}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      <span>{order.user?.email || "N/A"}</span>
                      <div>
                        {formatPhoneNumber(order.user?.phoneNumber || "N/A")}
                      </div>
                    </td>
                    <td className="border px-4 py-2 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-white text-sm whitespace-nowrap flex justify-center items-center ${
                          order.statusName === "Open"
                            ? "bg-green-500"
                            : order.statusName === "In Progress"
                            ? "bg-indigo-500"
                            : order.statusName === "Complete"
                            ? "bg-slate-400"
                            : "bg-red-500"
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
                      {formatCurrencyVND(order.totalAmount)}
                    </td>
                    <td className="border px-4 py-2 text-center space-x-2">
                      <button
                        type="button"
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
                        type="button"
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
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-4 text-gray-500">Không có đơn hàng</div>
      )}

      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-600">
          Đang hiển thị từ {(currentPage - 1) * pageSize + 1} đến{" "}
          {Math.min(currentPage * pageSize, totalElements)} trên tổng số{" "}
          {totalElements} mục
        </p>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {selectedOrder && selectedOrderItems.length > 0 && (
        <>
          <h3 className="text-xl font-semibold mt-8 mb-2">
            Sản phẩm trong đơn hàng
          </h3>
          <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
            <table className="min-w-full bg-white border rounded-lg shadow-sm">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="px-4 py-2 text-center">STT</th>
                  <th className="px-4 py-2 text-center">Sản phẩm</th>
                  <th className="px-4 py-2 text-center">Mã SP</th>
                  <th className="px-4 py-2 text-center">SL</th>
                  <th className="px-4 py-2 text-center">Giá</th>
                  <th className="px-4 py-2 text-center">Hết hạn</th>
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
                      {formatCurrencyVND(orderItem.price)}
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

      {/* Loại bỏ phần thống kê tổng quan - Tổng CTV */}
      <div className="col-span-full bg-white p-6 rounded-lg shadow-lg mb-6 mt-6">
        <h3 className="text-lg font-semibold text-center mb-4">
          Thống kê tổng quan
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 text-center gap-4">
          <div>
            <p className="text-xl font-bold">{statistics.totalOrders}</p>
            <p>Tổng đơn</p>
          </div>
          <div>
            <p className="text-xl font-bold">
              {formatCurrencyVND(statistics.totalRevenue)}
            </p>
            <p>Tổng doanh thu</p>
          </div>
          <div>
            <p className="text-xl font-bold">{statistics.totalProducts}</p>
            <p>Tổng sản phẩm</p>
          </div>
          {/* Đã loại bỏ Tổng CTV */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 mt-8 mx-auto max-w-8xl px-4">
        <Chart
          type="pie"
          data={chartsData.orderStatusDistribution}
          options={{ maintainAspectRatio: false }}
          title="Trạng thái Đơn hàng"
        />

        <Chart
          type="bar"
          data={chartsData.topProducts}
          options={{
            ...barChartOptions,
            indexAxis: "y",
          }}
          title="Top 5 Sản phẩm"
        />

        {/* Đã loại bỏ Chart Top 5 CTV Doanh thu cao */}
      </div>
    </div>
  );
};

export default FormOrderCollaborator;
