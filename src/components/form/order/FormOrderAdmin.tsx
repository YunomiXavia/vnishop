"use client";

import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getOrdersHistory,
  getServiceDates,
} from "@/store/order/orderSlice";
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

  const handleRowSelect = (orderId: string) => {
    if (selectedOrder === orderId) {
      setSelectedOrder(null);
      setSelectedOrderItems([]);
    } else {
      const order = orders.find((order) => order.id === orderId);
      setSelectedOrder(orderId);
      setSelectedOrderItems(order?.orderItems || []);
      dispatch(getServiceDates(orderId));
    }
  };

  const handleExportToExcel = () => {
    try {
      const excelData = orders.flatMap((order, index) => {
        return order.orderItems.map((orderItem, itemIndex) => ({
          STT: index + 1,
          ["Mục thứ"]: itemIndex + 1,
          ["ID Đơn Hàng"]: order.id,
          ["Tên đăng nhập người mua"]: order.user?.username || "Ẩn danh",
          ["Email người mua"]: order.user?.email || "N/A",
          ["Số điện thoại người mua"]:
              formatPhoneNumber(order.user?.phoneNumber) || "N/A",
         ["Tên đăng nhập cộng tác viên"]:
              order.collaborator?.user?.username || "N/A",
          ["Email cộng tác viên"]: order.collaborator?.user?.email || "N/A",
          ["Số điện thoại cộng tác viên"]:
              formatPhoneNumber(order.collaborator?.user?.phoneNumber) || "N/A",
          ["Tổng đơn hàng cộng tác viên đã xử lý"]:
              order.collaborator?.totalOrdersHandled || "0",
          ["Tổng tiền"]: order.totalAmount,
          ["Ngày đặt hàng"]: new Date(order.orderDate).toLocaleDateString(),
          ["Ngày bắt đầu"]: order.startDate
              ? new Date(order.startDate).toLocaleDateString()
              : "N/A",
          ["Ngày kết thúc"]: order.endDate
              ? new Date(order.endDate).toLocaleDateString()
              : "N/A",
          ["Mã giới thiệu đã sử dụng"]: order.referralCodeUsed || "N/A",
          ["Tên sản phẩm"]: orderItem.product.productName,
          ["Mã sản phẩm"]: orderItem.product.productCode,
          ["Số lượng"]: orderItem.quantity,
          ["Giá"]: orderItem.price,
          ["Ngày hết hạn"]: new Date(orderItem.expiryDate).toLocaleDateString(),
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
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
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
        label: "Số lượng bán ra",
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
        label: "Doanh thu (VND)",
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
          ["ChỉSố"]: "Tổng đơn hàng",
          ["GiáTrị"]: totalOrders,
        },
        {
          ["ChỉSố"]: "Tổng số tiền (VND)",
          ["GiáTrị"]: totalRevenue.toLocaleString(),
        },
        {
          ["ChỉSố"]: "Tổng sản phẩm đã bán",
          ["GiáTrị"]: totalProducts,
        },
        {
          ["ChỉSố"]: "Tổng số cộng tác viên",
          ["GiáTrị"]: totalCollaborators,
        },
      ];

      const topProductsData = topProducts.map(([name, quantity]) => ({
        ["Tên sản phẩm"]: name,
        ["Số lượng bán ra"]: quantity,
      }));

      const topCollaboratorsData = topCollaborators.map(([name, revenue]) => ({
        ["Tên cộng tác viên"]: name,
        ["Tổng doanh thu (VND)"]: revenue,
      }));

      const statisticalSheet = XLSX.utils.json_to_sheet(statisticalData);
      const topProductsSheet = XLSX.utils.json_to_sheet(topProductsData);
      const topCollaboratorsSheet = XLSX.utils.json_to_sheet(topCollaboratorsData);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, statisticalSheet, "ThongKeTongQuan");
      XLSX.utils.book_append_sheet(workbook, topProductsSheet, "TopSanPham");
      XLSX.utils.book_append_sheet(
          workbook,
          topCollaboratorsSheet,
          "TopCongTacVien"
      );

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

  useEffect(() => {
    dispatch(getOrdersHistory());
  }, [dispatch]);

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
        ? ((typeof order.user?.username === "string" &&
                order.user.username.includes(username)) ||
            (typeof order.anonymousUser?.username === "string" &&
                order.anonymousUser.username))
        : true;
    const matchCollaborator = collaboratorUsername
        ? order.collaborator?.user?.username?.includes(collaboratorUsername)
        : true;
    const matchStatus = orderStatus ? order.statusName === orderStatus : true;
    const matchOrderDate = orderDate
        ? new Date(order.orderDate).toLocaleDateString() === orderDate
        : true;
    const matchStartDate = startDate
        ? order.startDate
            ? new Date(order.startDate).toLocaleDateString() === startDate
            : false
        : true;
    const matchEndDate = endDate
        ? order.endDate
            ? new Date(order.endDate).toLocaleDateString() === endDate
            : false
        : true;
    const matchReferralCode = referralCodeUsed
        ? order.referralCodeUsed?.includes(referralCodeUsed)
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

  const totalFilteredPages = Math.ceil(filteredOrders.length / 5);
  const [currentPage, setCurrentPage] = useState(1);
  const paginatedOrders = filteredOrders.slice(
      (currentPage - 1) * 5,
      currentPage * 5
  );

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value,
    });
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
                Xuất dữ liệu thống kê sang Excel
              </button>
              <button
                  className="flex items-center px-3 py-1 bg-indigo-500 text-white
                        rounded-lg hover:bg-indigo-600 transition duration-200
                        ease-in-out transform hover:scale-105"
                  onClick={handleExportToExcel}
              >
                <FaFileExcel className="mr-2" />
                Xuất sang Excel
              </button>
            </div>
          </div>

          {/* Filters Section */}
          <div className="flex space-x-4 mb-4 justify-end items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo người mua:
              </label>
              <select
                  name="username"
                  className="border p-2 rounded"
                  onChange={handleFilterChange}
                  value={username}
              >
                <option value="">Chọn tên người mua</option>
                {[...new Set(orders.map((o) => o.user?.username || o.anonymousUser?.username))]
                    .filter(Boolean)
                    .map((u, i) => (
                        <option key={i} value={String(u || "")}>
                          {String(u || "Ẩn danh")}
                        </option>
                    ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo cộng tác viên:
              </label>
              <select
                  name="collaboratorUsername"
                  className="border p-2 rounded"
                  onChange={handleFilterChange}
                  value={collaboratorUsername}
              >
                <option value="">Chọn tên cộng tác viên</option>
                {[...new Set(orders.map((o) => o.collaborator?.user?.username))]
                    .filter(Boolean)
                    .map((c, i) => (
                        <option key={i} value={c || ""}>
                          {c}
                        </option>
                    ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo trạng thái đơn:
              </label>
              <select
                  name="orderStatus"
                  className="border p-2 rounded"
                  onChange={handleFilterChange}
                  value={orderStatus}
              >
                <option value="">Chọn trạng thái đơn hàng</option>
                {["Open", "In Progress", "Complete", "Cancel"].map((status, i) => (
                    <option key={i} value={status}>
                      {status}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo ngày order:
              </label>
              <select
                  name="orderDate"
                  className="border p-2 rounded"
                  onChange={handleFilterChange}
                  value={orderDate}
              >
                <option value="">Chọn ngày đặt hàng</option>
                {[...new Set(orders.map((o) => new Date(o.orderDate).toLocaleDateString()))]
                    .map((date, i) => (
                        <option key={i} value={date}>
                          {date}
                        </option>
                    ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo ngày bắt đầu:
              </label>
              <select
                  name="startDate"
                  className="border p-2 rounded"
                  onChange={handleFilterChange}
                  value={startDate}
              >
                <option value="">Chọn ngày bắt đầu</option>
                {[...new Set(orders.map((o) => o.startDate ? new Date(o.startDate).toLocaleDateString() : ""))].filter(Boolean)
                    .map((date, i) => (
                        <option key={i} value={date}>
                          {date}
                        </option>
                    ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo ngày kết thúc:
              </label>
              <select
                  name="endDate"
                  className="border p-2 rounded"
                  onChange={handleFilterChange}
                  value={endDate}
              >
                <option value="">Chọn ngày kết thúc</option>
                {[...new Set(orders.map((o) => o.endDate ? new Date(o.endDate).toLocaleDateString() : ""))].filter(Boolean)
                    .map((date, i) => (
                        <option key={i} value={date}>
                          {date}
                        </option>
                    ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo mã giới thiệu:
              </label>
              <select
                  name="referralCodeUsed"
                  className="border p-2 rounded"
                  onChange={handleFilterChange}
                  value={referralCodeUsed}
              >
                <option value="">Chọn mã giới thiệu</option>
                {[...new Set(orders.map((o) => o.referralCodeUsed).filter(Boolean))]
                    .map((code, i) => (
                        <option key={i} value={code || ""}>
                          {code}
                        </option>
                    ))}
              </select>
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
                    <th className="px-4 py-2 text-center">Tên đăng nhập người mua</th>
                    <th className="px-4 py-2 text-center">Email người mua</th>
                    <th className="px-4 py-2 text-center">Số điện thoại người mua</th>
                    <th className="px-4 py-2 text-center">Tên đăng nhập cộng tác viên</th>
                    <th className="px-4 py-2 text-center">Email cộng tác viên</th>
                    <th className="px-4 py-2 text-center">Số điện thoại cộng tác viên</th>
                    <th className="px-4 py-2 text-center">Tổng đơn cộng tác viên đã xử lý</th>
                    <th className="px-4 py-2 text-center">Trạng thái đơn hàng</th>
                    <th className="px-4 py-2 text-center">Tổng tiền</th>
                    <th className="px-4 py-2 text-center">Ngày đặt hàng</th>
                    <th className="px-4 py-2 text-center">Ngày bắt đầu</th>
                    <th className="px-4 py-2 text-center">Ngày kết thúc</th>
                    <th className="px-4 py-2 text-center">Mã giới thiệu đã sử dụng</th>
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
                          {(currentPage - 1) * 5 + index + 1}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {String(
                              order.user?.username ||
                              order.anonymousUser?.username ||
                              "Ẩn danh"
                          )}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {String(order.user?.email || order.anonymousUser?.email || "N/A")}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {formatPhoneNumber(
                              String(
                                  order.user?.phoneNumber ||
                                  order.anonymousUser?.phoneNumber ||
                                  ""
                              )
                          ) || "N/A"}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {order.collaborator?.user?.username || "N/A"}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {order.collaborator?.user?.email || "N/A"}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {formatPhoneNumber(order.collaborator?.user?.phoneNumber || "") || "N/A"}
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
                    <th className="px-4 py-2 text-center">Tên người dùng</th>
                    <th className="px-4 py-2 text-center">Email người dùng</th>
                    <th className="px-4 py-2 text-center">Số điện thoại người dùng</th>
                    <th className="px-4 py-2 text-center">Tên cộng tác viên</th>
                    <th className="px-4 py-2 text-center">Email cộng tác viên</th>
                    <th className="px-4 py-2 text-center">Số điện thoại cộng tác viên</th>
                    <th className="px-4 py-2 text-center">Tổng số đơn hàng cộng tác viên đã xử lý</th>
                    <th className="px-4 py-2 text-center">Trạng thái đơn hàng</th>
                    <th className="px-4 py-2 text-center">Tổng tiền</th>
                    <th className="px-4 py-2 text-center">Ngày đặt hàng</th>
                    <th className="px-4 py-2 text-center">Ngày bắt đầu</th>
                    <th className="px-4 py-2 text-center">Ngày kết thúc</th>
                    <th className="px-4 py-2 text-center">Mã giới thiệu đã sử dụng</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr>
                    <td colSpan={14} className="text-center py-4">
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
            Đang hiển thị từ {(currentPage - 1) * 5 + 1} đến{" "}
            {Math.min(currentPage * 5, filteredOrders.length)} trong tổng số{" "}
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
              <h3 className="text-xl font-semibold mt-4 mb-2">Các mục đơn hàng</h3>
              <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
                <table className="min-w-full bg-white border rounded-lg shadow-sm">
                  <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="px-4 py-2 text-center">STT</th>
                    <th className="px-4 py-2 text-center">Tên sản phẩm</th>
                    <th className="px-4 py-2 text-center">Mã sản phẩm</th>
                    <th className="px-4 py-2 text-center">Số lượng</th>
                    <th className="px-4 py-2 text-center">Giá</th>
                  </tr>
                  </thead>
                  <tbody>
                  {selectedOrderItems.map((orderItem, index) => (
                      <tr key={`${orderItem.id}-${index}`}>
                        <td className="border px-4 py-2 text-center">{index + 1}</td>
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

        <div className="col-span-full bg-white p-6 rounded-lg shadow-lg mb-6 mt-6">
          <h3 className="text-lg font-semibold text-center mb-4">
            Thống kê tổng quan
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 text-center gap-4">
            <div>
              <p className="text-xl font-bold">{totalOrders}</p>
              <p>Tổng đơn hàng</p>
            </div>
            <div>
              <p className="text-xl font-bold">{totalRevenue.toLocaleString()}</p>
              <p>Tổng số tiền (VND)</p>
            </div>
            <div>
              <p className="text-xl font-bold">{totalProducts}</p>
              <p>Tổng sản phẩm đã bán</p>
            </div>
            <div>
              <p className="text-xl font-bold">{totalCollaborators}</p>
              <p>Tổng số cộng tác viên</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8 mx-auto max-w-8xl px-4">
          <Chart
              type="pie"
              data={orderStatusChartData}
              options={{ maintainAspectRatio: false }}
              title="Phân phối trạng thái đơn hàng"
          />

          <Chart
              type="bar"
              data={topProductsChartData}
              options={{
                ...barChartOptions,
                indexAxis: "y",
              }}
              title="Top 5 sản phẩm theo số lượng"
          />

          <Chart
              type="bar"
              data={topCollaboratorsChartData}
              options={barChartOptions}
              title="Top 5 cộng tác viên theo doanh thu"
          />
        </div>
      </div>
  );
};

export default FormOrderAdmin;
