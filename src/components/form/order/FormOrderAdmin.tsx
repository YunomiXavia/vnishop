"use client";

import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getOrdersHistory, getServiceDates } from "@/store/order/orderSlice";
import { FaFileExcel } from "react-icons/fa";
import Notification from "@/components/notification/Notification";
import Pagination from "@/components/pagination/Pagination";
import Chart from "@/components/chart/Chart";
import { barChartOptions } from "@/types/component/chart/chart";
import { formatCurrencyVND, formatPhoneNumber } from "@/utils/utils/utils";
import { OrderDistribution, OrderItemsResponse } from "@/types/order/order";
import { ErrorResponseProps } from "@/types/error/error";

const FormOrderAdmin: React.FC = () => {
  const dispatch = useAppDispatch();
  const { orders, serviceDates, loading, error } = useAppSelector(
    (state) => state.orders
  );

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<
    OrderItemsResponse[]
  >([]);

  const [filters, setFilters] = useState({
    username: "",
    collaboratorUsername: "",
    orderStatus: "",
    orderDate: "",
    startDate: "",
    endDate: "",
    referralCodeUsed: "",
  });

  // Fetch tất cả đơn hàng khi component mount
  useEffect(() => {
    // Giả sử backend hỗ trợ size=1000 để lấy tất cả đơn hàng
    dispatch(getOrdersHistory({ page: 0, size: 1000 }));
  }, [dispatch]);

  const handleRowSelect = (orderId: string) => {
    if (selectedOrder === orderId) {
      setSelectedOrder(null);
      setSelectedOrderItems([]);
    } else {
      const order = orders.find((order) => order.id === orderId);
      setSelectedOrder(orderId);
      setSelectedOrderItems(order?.orderItems || []);
      dispatch(getServiceDates({ orderId, page: 0, size: 10 }));
    }
  };

  const handleExportToExcel = () => {
    try {
      const excelData = orders.flatMap((order, index) => {
        return order.orderItems.map((orderItem, itemIndex) => ({
          STT: index + 1,
          ["Mục thứ"]: itemIndex + 1,
          ["ID Đơn"]: order.id,
          ["Tên người mua"]: order.user?.username || "Ẩn danh",
          ["Email / SĐT người mua"]: order.user?.email
            ? `${order.user.email} / ${
                formatPhoneNumber(order.user.phoneNumber) || "N/A"
              }`
            : `Ẩn danh / ${
                formatPhoneNumber(order.anonymousUser?.phoneNumber) || "N/A"
              }`,
          ["Tên CTV"]: order.collaborator?.user?.username || "N/A",
          ["Email / SĐT CTV"]: order.collaborator?.user?.email
            ? `${order.collaborator.user.email} / ${
                formatPhoneNumber(order.collaborator.user.phoneNumber) || "N/A"
              }`
            : `N/A / ${
                formatPhoneNumber(order.collaborator?.user?.phoneNumber) ||
                "N/A"
              }`,
          ["Tổng đơn CTV"]: order.collaborator?.totalOrdersHandled || "0",
          ["Tình trạng"]: order.statusName,
          ["Tổng tiền"]: formatCurrencyVND(order.totalAmount),
          ["Ngày đặt"]: order.orderDate
            ? new Date(order.orderDate).toLocaleDateString()
            : "N/A",
          ["Ngày bắt đầu"]: order.startDate
            ? new Date(order.startDate).toLocaleDateString()
            : "N/A",
          ["Ngày kết thúc"]: order.endDate
            ? new Date(order.endDate).toLocaleDateString()
            : "N/A",
          ["Mã giới thiệu"]: order.referralCodeUsed || "N/A",
          ["Tên SP"]: orderItem.product.productName,
          ["Mã SP"]: orderItem.product.productCode,
          ["SL"]: orderItem.quantity,
          ["Giá"]: formatCurrencyVND(orderItem.price),
          ["Hạn dùng"]: orderItem.expiryDate
            ? new Date(orderItem.expiryDate).toLocaleDateString()
            : "N/A",
        }));
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "DonHang");

      XLSX.writeFile(workbook, "DonHang.xlsx");

      setNotification({
        message: "Xuất dữ liệu thành công!",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: "Xuất dữ liệu thất bại: " + error,
        type: "error",
      });
    }
  };

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );
  const totalProducts = orders.reduce(
    (sum, order) =>
      sum +
      order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );
  const totalCollaborators = new Set(
    orders.map((order) => order.collaborator?.user?.username).filter(Boolean)
  ).size;

  const orderStatusDistribution: OrderDistribution = orders.reduce(
    (acc, order) => {
      acc[order.statusName] = (acc[order.statusName] || 0) + 1;
      return acc;
    },
    {} as OrderDistribution
  );

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

  const productQuantityDistribution: OrderDistribution = orders
    .flatMap((order) => order.orderItems)
    .reduce((acc, item) => {
      acc[item.product.productName] =
        (acc[item.product.productName] || 0) + item.quantity;
      return acc;
    }, {} as OrderDistribution);

  const topProducts = Object.entries(productQuantityDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topProductsChartData = {
    labels: topProducts.map(([name]) => name),
    datasets: [
      {
        label: "SL Bán",
        data: topProducts.map(([, quantity]) => quantity),
        backgroundColor: "#2196f3",
        hoverBackgroundColor: "#64b5f6",
      },
    ],
  };

  const collaboratorRevenue: OrderDistribution = orders.reduce((acc, order) => {
    const collaboratorName = order.collaborator?.user?.username || "Ẩn danh";
    acc[collaboratorName] = (acc[collaboratorName] || 0) + order.totalAmount;
    return acc;
  }, {} as OrderDistribution);

  const topCollaborators = Object.entries(collaboratorRevenue)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topCollaboratorsChartData = {
    labels: topCollaborators.map(([name]) => name),
    datasets: [
      {
        label: "Doanh thu",
        data: topCollaborators.map(([, revenue]) => revenue),
        backgroundColor: "#4caf50",
        hoverBackgroundColor: "#66bb6a",
      },
    ],
  };

  const handleExportStatisticsToExcel = () => {
    try {
      const statisticalData = [
        {
          ["Chỉ Số"]: "Tổng đơn",
          ["Giá Trị"]: totalOrders,
        },
        {
          ["Chỉ Số"]: "Tổng tiền (VND)",
          ["Giá Trị"]: totalRevenue.toLocaleString(),
        },
        {
          ["Chỉ Số"]: "Tổng sản phẩm",
          ["Giá Trị"]: totalProducts,
        },
        {
          ["Chỉ Số"]: "Tổng CTV",
          ["Giá Trị"]: totalCollaborators,
        },
      ];

      const topProductsData = topProducts.map(([name, quantity]) => ({
        ["Tên SP"]: name,
        ["SL Bán"]: quantity,
      }));

      const topCollaboratorsData = topCollaborators.map(([name, revenue]) => ({
        ["Tên CTV"]: name,
        ["Doanh thu (VND)"]: revenue,
      }));

      const statisticalSheet = XLSX.utils.json_to_sheet(statisticalData);
      const topProductsSheet = XLSX.utils.json_to_sheet(topProductsData);
      const topCollaboratorsSheet =
        XLSX.utils.json_to_sheet(topCollaboratorsData);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        statisticalSheet,
        "ThongKeTongQuan"
      );
      XLSX.utils.book_append_sheet(workbook, topProductsSheet, "TopSanPham");
      XLSX.utils.book_append_sheet(workbook, topCollaboratorsSheet, "TopCT");

      XLSX.writeFile(workbook, "DuLieuThongKe.xlsx");

      setNotification({
        message: "Xuất dữ liệu thống kê thành công!",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: "Xuất dữ liệu thống kê thất bại: " + error,
        type: "error",
      });
    }
  };

  const {
    username,
    collaboratorUsername,
    orderStatus,
    orderDate,
    startDate,
    endDate,
    referralCodeUsed,
  } = filters;

  const filteredOrders = orders.filter((order) => {
    const matchUsername = username
      ? (order.user?.username &&
          order.user.username.toLowerCase().includes(username.toLowerCase())) ||
        (order.anonymousUser?.name &&
          order.anonymousUser.name
            .toLowerCase()
            .includes(username.toLowerCase()))
      : true;

    const matchCollaborator = collaboratorUsername
      ? order.collaborator?.user?.username &&
        order.collaborator.user.username
          .toLowerCase()
          .includes(collaboratorUsername.toLowerCase())
      : true;

    const matchStatus = orderStatus ? order.statusName === orderStatus : true;

    const matchOrderDate = orderDate
      ? new Date(order.orderDate).toISOString().split("T")[0] === orderDate
      : true;

    const matchStartDate = startDate
      ? order.startDate
        ? new Date(order.startDate).toISOString().split("T")[0] === startDate
        : false
      : true;

    const matchEndDate = endDate
      ? order.endDate
        ? new Date(order.endDate).toISOString().split("T")[0] === endDate
        : false
      : true;

    const matchReferralCode = referralCodeUsed
      ? order.referralCodeUsed &&
        order.referralCodeUsed
          .toLowerCase()
          .includes(referralCodeUsed.toLowerCase())
      : true;

    return (
      matchUsername &&
      matchCollaborator &&
      matchStatus &&
      matchOrderDate &&
      matchStartDate &&
      matchEndDate &&
      matchReferralCode
    );
  });

  const pageSize = 5; // Số mục hiển thị trên mỗi trang
  const totalFilteredPages = Math.ceil(filteredOrders.length / pageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
            Quản lý đơn hàng
          </h2>
          <div className="flex space-x-2">
            <button
              className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 ease-in-out transform hover:scale-105"
              onClick={handleExportStatisticsToExcel}
            >
              <FaFileExcel className="mr-2" />
              Xuất TK
            </button>
            <button
              className="flex items-center px-3 py-1 bg-indigo-500 text-white
                    rounded-lg hover:bg-indigo-600 transition duration-200
                    ease-in-out transform hover:scale-105"
              onClick={handleExportToExcel}
            >
              <FaFileExcel className="mr-2" />
              Xuất Excel
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-wrap space-x-4 mb-4 justify-end items-center">
          {/* Lọc theo người mua */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700">
              Người mua:
            </label>
            <input
              type="text"
              name="username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              placeholder="Tên người mua"
              onChange={handleFilterChange}
              value={username}
            />
          </div>

          {/* Lọc theo cộng tác viên */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700">
              Cộng tác viên:
            </label>
            <input
              type="text"
              name="collaboratorUsername"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              placeholder="Tên CTV"
              onChange={handleFilterChange}
              value={collaboratorUsername}
            />
          </div>

          {/* Lọc theo mã giới thiệu */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700">
              Mã giới thiệu:
            </label>
            <input
              type="text"
              name="referralCodeUsed"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              placeholder="Mã giới thiệu"
              onChange={handleFilterChange}
              value={referralCodeUsed}
            />
          </div>

          {/* Lọc theo trạng thái đơn hàng */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700">
              Tình trạng:
            </label>
            <select
              name="orderStatus"
              className="border p-2 rounded"
              onChange={handleFilterChange}
              value={orderStatus}
            >
              <option value="">Chọn trạng thái</option>
              {["Open", "In Progress", "Complete", "Cancel"].map(
                (status, i) => (
                  <option key={i} value={status}>
                    {status}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Lọc theo ngày đặt hàng */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700">
              Ngày đặt:
            </label>
            <input
              type="date"
              name="orderDate"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleFilterChange}
              value={orderDate}
            />
          </div>

          {/* Lọc theo ngày bắt đầu */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700">
              Ngày bắt đầu:
            </label>
            <input
              type="date"
              name="startDate"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleFilterChange}
              value={startDate}
            />
          </div>

          {/* Lọc theo ngày kết thúc */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700">
              Ngày kết thúc:
            </label>
            <input
              type="date"
              name="endDate"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleFilterChange}
              value={endDate}
            />
          </div>
        </div>
      </div>

      {filteredOrders.length > 0 ? (
        <>
          <h3 className="text-xl font-semibold mb-2">Đơn hàng</h3>
          <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
            <table className="min-w-full bg-white border rounded-lg shadow-sm">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="px-4 py-2 text-center">STT</th>
                  <th className="px-4 py-2 text-center">Người mua</th>
                  <th className="px-4 py-2 text-center">
                    Email / SĐT người mua
                  </th>
                  <th className="px-4 py-2 text-center">CTV</th>
                  <th className="px-4 py-2 text-center">Email / SĐT CTV</th>
                  <th className="px-4 py-2 text-center">Đơn CTV</th>
                  <th className="px-4 py-2 text-center">Tình trạng</th>
                  <th className="px-4 py-2 text-center">Tổng tiền</th>
                  <th className="px-4 py-2 text-center">Ngày đặt</th>
                  <th className="px-4 py-2 text-center">Ngày bắt đầu</th>
                  <th className="px-4 py-2 text-center">Ngày kết thúc</th>
                  <th className="px-4 py-2 text-center">Mã giới thiệu</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order, index) => (
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
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {order.user?.username ||
                        order.anonymousUser?.name ||
                        "Ẩn danh"}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      <span>
                        {order.user?.email ? `${order.user.email}` : "Ẩn danh"}
                      </span>
                      <div>
                        {order.user?.phoneNumber
                          ? formatPhoneNumber(order.user.phoneNumber)
                          : "N/A"}
                      </div>
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {order.collaborator?.user?.username || "N/A"}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      <span>
                        {order.collaborator?.user?.email
                          ? `${order.collaborator.user.email}`
                          : "N/A"}
                      </span>
                      <div>
                        {order.collaborator?.user?.phoneNumber
                          ? formatPhoneNumber(
                              order.collaborator.user.phoneNumber
                            )
                          : "N/A"}
                      </div>
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {order.collaborator?.totalOrdersHandled || "0"}
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
                      {order.referralCodeUsed || "N/A"}
                    </td>
                  </tr>
                ))}
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
                  <th className="px-4 py-2 text-center">Người dùng</th>
                  <th className="px-4 py-2 text-center">Email / SĐT</th>
                  <th className="px-4 py-2 text-center">CTV</th>
                  <th className="px-4 py-2 text-center">Email / SĐT CTV</th>
                  <th className="px-4 py-2 text-center">Đơn CTV</th>
                  <th className="px-4 py-2 text-center">Tình trạng</th>
                  <th className="px-4 py-2 text-center">Tổng tiền</th>
                  <th className="px-4 py-2 text-center">Ngày đặt</th>
                  <th className="px-4 py-2 text-center">Ngày bắt đầu</th>
                  <th className="px-4 py-2 text-center">Ngày kết thúc</th>
                  <th className="px-4 py-2 text-center">Mã giới thiệu</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={12} className="text-center py-4">
                    Không có đơn hàng
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-600">
          Đang hiển thị trang {(currentPage - 1) * pageSize + 1} trên{" "}
          {Math.min(currentPage * pageSize, filteredOrders.length)}, tổng số{" "}
          {filteredOrders.length} mục
        </p>
        <Pagination
          currentPage={currentPage}
          totalPages={totalFilteredPages}
          onPageChange={(newPage) => {
            if (newPage > 0 && newPage <= totalFilteredPages) {
              setCurrentPage(newPage);
              setSelectedOrder(null);
              setSelectedOrderItems([]);
            }
          }}
        />
      </div>

      {selectedOrder && selectedOrderItems.length > 0 && (
        <>
          <h3 className="text-xl font-semibold mt-4 mb-2">Mục đơn hàng</h3>
          <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
            <table className="min-w-full bg-white border rounded-lg shadow-sm">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="px-4 py-2 text-center">STT</th>
                  <th className="px-4 py-2 text-center">Tên SP</th>
                  <th className="px-4 py-2 text-center">Mã SP</th>
                  <th className="px-4 py-2 text-center">SL</th>
                  <th className="px-4 py-2 text-center">Giá</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedOrder && serviceDates && serviceDates.length > 0 && (
        <>
          <h3 className="text-xl font-semibold mt-4 mb-2">Ngày dịch vụ</h3>
          <div className="overflow-x-auto border rounded-lg shadow-sm mb-6">
            <table className="min-w-full bg-white border rounded-lg shadow-sm">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="px-4 py-2 text-center">Tên SP</th>
                  <th className="px-4 py-2 text-center">Hạn dùng</th>
                </tr>
              </thead>
              <tbody>
                {serviceDates.map((service) => (
                  <tr key={service.id}>
                    <td className="border px-4 py-2 text-center">
                      {service.product.productName}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {service.expiryDate
                        ? new Date(service.expiryDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="col-span-full bg-white p-6 rounded-lg shadow-lg mb-6 mt-6">
        <h3 className="text-lg font-semibold text-center mb-4">
          Thống kê tổng hợp
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 text-center gap-4">
          <div>
            <p className="text-xl font-bold">{totalOrders}</p>
            <p>Tổng đơn</p>
          </div>
          <div>
            <p className="text-xl font-bold">{totalRevenue.toLocaleString()}</p>
            <p>Tổng tiền (VND)</p>
          </div>
          <div>
            <p className="text-xl font-bold">{totalProducts}</p>
            <p>Tổng SP bán</p>
          </div>
          <div>
            <p className="text-xl font-bold">{totalCollaborators}</p>
            <p>Tổng CTV</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8 mx-auto max-w-8xl px-4">
        <Chart
          type="pie"
          data={orderStatusChartData}
          options={{ maintainAspectRatio: false }}
          title="Tình trạng đơn hàng"
        />

        <Chart
          type="bar"
          data={topProductsChartData}
          options={{
            ...barChartOptions,
            indexAxis: "y",
          }}
          title="Top 5 SP Bán nhiều"
        />

        <Chart
          type="bar"
          data={topCollaboratorsChartData}
          options={barChartOptions}
          title="Top 5 CTV Doanh thu"
        />
      </div>
    </div>
  );
};

export default FormOrderAdmin;
