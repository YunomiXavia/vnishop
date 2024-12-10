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
import { OrderItemsResponse, OrderResponse } from "@/types/order/order";
import { ErrorResponseProps } from "@/types/error/error";
import { extractError } from "@/utils/utils/helper";

const FormOrderAdmin: React.FC = () => {
  const dispatch = useAppDispatch();

  const { serviceDates, loading, error } = useAppSelector(
      (state) => state.orders
  );

  // State để lưu trữ tất cả đơn hàng
  const [allOrders, setAllOrders] = useState<OrderResponse[]>([]);

  // State để lưu trữ đơn hàng sau khi đã lọc
  const [filteredOrders, setFilteredOrders] = useState<OrderResponse[]>([]);

  const [currentPageLocal, setCurrentPageLocal] = useState(1);
  const [pageSize] = useState(5);

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItemsResponse[]>([]);

  const [filters, setFilters] = useState({
    username: "",
    collaboratorUsername: "",
    orderStatus: "",
    orderDate: "",
    startDate: "",
    endDate: "",
    referralCodeUsed: "",
  });


  // Hàm chọn hàng
  const handleRowSelect = (orderId: string) => {
    if (selectedOrder === orderId) {
      setSelectedOrder(null);
      setSelectedOrderItems([]);
    } else {
      const order = allOrders.find((order) => order.id === orderId);
      setSelectedOrder(orderId);
      setSelectedOrderItems(order?.orderItems || []);
      dispatch(getServiceDates(orderId));
    }
  };

  // Hàm xuất dữ liệu đơn hàng sang Excel
  const handleExportToExcel = () => {
    try {
      const excelData = filteredOrders.flatMap((order, index) => {
        return order.orderItems.map((orderItem, itemIndex) => ({
          STT: (currentPageLocal - 1) * pageSize + index + 1,
          ["Mục thứ"]: itemIndex + 1,
          ["ID Đơn Hàng"]: order.id,
          ["Tên đăng nhập người mua"]: order.user?.username || "Ẩn danh",
          ["Email người mua"]: order.user?.email || "N/A",
          ["Số điện thoại người mua"]: formatPhoneNumber(order.user?.phoneNumber) || "N/A",
          ["Tên đăng nhập CTV"]: order.collaborator?.user?.username || "N/A",
          ["Email CTV"]: order.collaborator?.user?.email || "N/A",
          ["Số điện thoại CTV"]: formatPhoneNumber(order.collaborator?.user?.phoneNumber) || "N/A",
          ["Tổng đơn CTV đã xử lý"]: order.collaborator?.totalOrdersHandled || "0",
          ["Tổng tiền"]: formatCurrencyVND(order.totalAmount),
          ["Ngày đặt hàng"]: new Date(order.orderDate).toLocaleDateString(),
          ["Ngày bắt đầu"]: order.startDate ? new Date(order.startDate).toLocaleDateString() : "N/A",
          ["Ngày kết thúc"]: order.endDate ? new Date(order.endDate).toLocaleDateString() : "N/A",
          ["Mã giới thiệu đã sử dụng"]: order.referralCodeUsed || "N/A",
          ["Tên sản phẩm"]: orderItem.product.productName,
          ["Mã sản phẩm"]: orderItem.product.productCode,
          ["Số lượng"]: orderItem.quantity,
          ["Giá"]: formatCurrencyVND(orderItem.price),
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

  // Hàm xuất dữ liệu thống kê sang Excel
  const handleExportStatisticsToExcel = () => {
    try {
      const statisticalData = [
        {
          ["ChỉSố"]: "Tổng đơn hàng",
          ["GiáTrị"]: filteredOrders.length,
        },
        {
          ["ChỉSố"]: "Tổng số tiền (VND)",
          ["GiáTrị"]: formatCurrencyVND(
              filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0)
          ),
        },
        {
          ["ChỉSố"]: "Tổng sản phẩm đã bán",
          ["GiáTrị"]: filteredOrders.reduce(
              (sum, order) =>
                  sum +
                  order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0),
              0
          ),
        },
        {
          ["ChỉSố"]: "Tổng số cộng tác viên",
          ["GiáTrị"]: new Set(
              filteredOrders.map((order) => order.collaborator?.user?.username).filter(Boolean)
          ).size,
        },
      ];

      const topProducts = Object.entries(
          filteredOrders
              .flatMap((order) => order.orderItems)
              .reduce((acc, item) => {
                acc[item.product.productName] = (acc[item.product.productName] || 0) + item.quantity;
                return acc;
              }, {} as Record<string, number>)
      )
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5);

      const topCollaborators = Object.entries(
          filteredOrders.reduce((acc, order) => {
            const collaboratorName = order.collaborator?.user?.username || "Ẩn danh";
            acc[collaboratorName] = (acc[collaboratorName] || 0) + order.totalAmount;
            return acc;
          }, {} as Record<string, number>)
      )
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5);

      const topProductsData = topProducts.map(([name, quantity]) => ({
        ["Tên sản phẩm"]: name,
        ["Số lượng bán ra"]: quantity,
      }));

      const topCollaboratorsData = topCollaborators.map(([name, revenue]) => ({
        ["Tên cộng tác viên"]: name,
        ["Tổng doanh thu (VND)"]: formatCurrencyVND(revenue),
      }));

      const statisticalSheet = XLSX.utils.json_to_sheet(statisticalData);
      const topProductsSheet = XLSX.utils.json_to_sheet(topProductsData);
      const topCollaboratorsSheet = XLSX.utils.json_to_sheet(topCollaboratorsData);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, statisticalSheet, "ThongKeTongQuan");
      XLSX.utils.book_append_sheet(workbook, topProductsSheet, "TopSanPham");
      XLSX.utils.book_append_sheet(workbook, topCollaboratorsSheet, "TopCongTacVien");

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

  // Fetch tất cả đơn hàng từ backend
  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        let page = 0;
        const size = 100; // Số lượng đơn hàng mỗi trang, điều chỉnh theo nhu cầu
        let allFetchedOrders: OrderResponse[] = [];
        let fetchedAll = false;

        while (!fetchedAll) {
          const resultAction = await dispatch(getOrdersHistory({ page, size }));
          if (getOrdersHistory.fulfilled.match(resultAction)) {
            const fetchedOrders = resultAction.payload.orders;
            allFetchedOrders = [...allFetchedOrders, ...fetchedOrders];
            if (page >= resultAction.payload.totalPages - 1) {
              fetchedAll = true;
            } else {
              page += 1;
            }
          } else {
            // Nếu có lỗi, dừng việc fetch
            fetchedAll = true;
            setNotification({
              message: `Lấy đơn hàng thất bại: ${resultAction.payload?.message || "Unknown Error"}`,
              type: "error",
            });
          }
        }

        setAllOrders(allFetchedOrders);
        setFilteredOrders(allFetchedOrders);
      } catch (error: unknown) {
        const err = extractError(error);
        setNotification({
          message: `Lấy đơn hàng thất bại: ${err.code}: ${err.message}`,
          type: "error",
        });
      }
    };

    fetchAllOrders();
  }, [dispatch]);

  // Áp dụng bộ lọc khi filters hoặc allOrders thay đổi
  useEffect(() => {
    const applyFilters = () => {
      const filtered = allOrders.filter((order) => {
        const matchUsername = filters.username
            ? (order.user?.username?.toLowerCase().includes(filters.username.toLowerCase()) ||
                (order.anonymousUser?.username &&
                    order.anonymousUser.username.toLowerCase().includes(filters.username.toLowerCase())))
            : true;
        const matchCollaborator = filters.collaboratorUsername
            ? order.collaborator?.user?.username?.toLowerCase().includes(filters.collaboratorUsername.toLowerCase())
            : true;
        const matchStatus = filters.orderStatus ? order.statusName === filters.orderStatus : true;
        const matchOrderDate = filters.orderDate
            ? new Date(order.orderDate).toLocaleDateString() === filters.orderDate
            : true;
        const matchStartDate = filters.startDate
            ? order.startDate
                ? new Date(order.startDate).toLocaleDateString() === filters.startDate
                : false
            : true;
        const matchEndDate = filters.endDate
            ? order.endDate
                ? new Date(order.endDate).toLocaleDateString() === filters.endDate
                : false
            : true;
        const matchReferralCode = filters.referralCodeUsed
            ? order.referralCodeUsed?.toLowerCase().includes(filters.referralCodeUsed.toLowerCase())
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

      setFilteredOrders(filtered);
    };

    applyFilters();
  }, [filters, allOrders]);

  // Phân trang phía client
  const totalFilteredPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice(
      (currentPageLocal - 1) * pageSize,
      currentPageLocal * pageSize
  );

  // Hàm xử lý thay đổi bộ lọc
  const handleFilterChange = (
      event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value,
    });
    // Không reset lại trang hiện tại
    // Focus vẫn giữ nguyên trên input
  };

  // Hàm xử lý thay đổi trang
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalFilteredPages) {
      setCurrentPageLocal(newPage);
      setSelectedOrder(null);
      setSelectedOrderItems([]);
    }
  };

  if (loading && allOrders.length === 0) return <p>Đang tải đơn hàng...</p>;

  if (error && allOrders.length === 0) {
    const err = error as ErrorResponseProps;
    return (
        <p>
          Lỗi {err.code}: {err.message}
        </p>
    );
  }

  return (
      <div className="p-4">
        {/* Notification */}
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
          <div className="flex flex-wrap gap-4 mb-4 justify-end items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo người mua:
              </label>
              <input
                  type="text"
                  name="username"
                  className="border p-2 rounded w-full"
                  placeholder="Nhập tên người mua"
                  onChange={handleFilterChange}
                  value={filters.username}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo cộng tác viên:
              </label>
              <input
                  type="text"
                  name="collaboratorUsername"
                  className="border p-2 rounded w-full"
                  placeholder="Nhập tên CTV"
                  onChange={handleFilterChange}
                  value={filters.collaboratorUsername}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo trạng thái đơn:
              </label>
              <select
                  name="orderStatus"
                  className="border p-2 rounded w-full"
                  onChange={handleFilterChange}
                  value={filters.orderStatus}
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
              <input
                  type="date"
                  name="orderDate"
                  className="border p-2 rounded w-full"
                  onChange={handleFilterChange}
                  value={filters.orderDate}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo ngày bắt đầu:
              </label>
              <input
                  type="date"
                  name="startDate"
                  className="border p-2 rounded w-full"
                  onChange={handleFilterChange}
                  value={filters.startDate}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo ngày kết thúc:
              </label>
              <input
                  type="date"
                  name="endDate"
                  className="border p-2 rounded w-full"
                  onChange={handleFilterChange}
                  value={filters.endDate}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lọc theo mã giới thiệu:
              </label>
              <input
                  type="text"
                  name="referralCodeUsed"
                  className="border p-2 rounded w-full"
                  placeholder="Nhập mã giới thiệu"
                  onChange={handleFilterChange}
                  value={filters.referralCodeUsed}
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
                    <th className="px-4 py-2 text-center">Tên ĐN Người Mua</th>
                    <th className="px-4 py-2 text-center">Email Người Mua</th>
                    <th className="px-4 py-2 text-center">SĐT Người Mua</th>
                    <th className="px-4 py-2 text-center">Tên ĐN CTV</th>
                    <th className="px-4 py-2 text-center">Email CTV</th>
                    <th className="px-4 py-2 text-center">SĐT CTV</th>
                    <th className="px-4 py-2 text-center">Tổng Đơn CTV Đã Xử Lý</th>
                    <th className="px-4 py-2 text-center">Trạng Thái Đơn</th>
                    <th className="px-4 py-2 text-center">Tổng Tiền</th>
                    <th className="px-4 py-2 text-center">Ngày Đặt Hàng</th>
                    <th className="px-4 py-2 text-center">Ngày Bắt Đầu</th>
                    <th className="px-4 py-2 text-center">Ngày Kết Thúc</th>
                    <th className="px-4 py-2 text-center">Mã Giới Thiệu</th>
                  </tr>
                  </thead>
                  <tbody>
                  {paginatedOrders.map((order, index) => (
                      <tr
                          key={`${order.id}-${index}`}
                          className={`hover:bg-gray-50 transition ease-in-out duration-200 cursor-pointer ${
                              selectedOrder === order.id ? "bg-indigo-100" : "hover:bg-gray-50"
                          }`}
                          onClick={() => handleRowSelect(order.id)}
                      >
                        <td className="border px-4 py-2 text-center">
                          {(currentPageLocal - 1) * pageSize + index + 1}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {order.user?.username || order.anonymousUser?.username || "Ẩn danh"}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {order.user?.email || order.anonymousUser?.email || "N/A"}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {formatPhoneNumber(order.user?.phoneNumber || order.anonymousUser?.phoneNumber) || "N/A"}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {order.collaborator?.user?.username || "N/A"}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {order.collaborator?.user?.email || "N/A"}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {formatPhoneNumber(order.collaborator?.user?.phoneNumber) || "N/A"}
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
                    <th className="px-4 py-2 text-center">Tổng số đơn CTV đã xử lý</th>
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

        {/* Phần hiển thị thông tin phân trang */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Đang hiển thị từ{" "}
            {filteredOrders.length > 0
                ? (currentPageLocal - 1) * pageSize + 1
                : 0}{" "}
            đến{" "}
            {Math.min(currentPageLocal * pageSize, filteredOrders.length)}{" "}
            trong tổng số {filteredOrders.length} mục
          </p>
          <Pagination
              currentPage={currentPageLocal}
              totalPages={totalFilteredPages}
              onPageChange={handlePageChange}
          />
        </div>

        {/* Phần hiển thị các mục đơn hàng khi chọn */}
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
                          {formatCurrencyVND(orderItem.price)}
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </>
        )}

        {/* Phần hiển thị ngày dịch vụ khi chọn đơn hàng */}
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

        {/* Phần thống kê tổng quan */}
        <div className="col-span-full bg-white p-6 rounded-lg shadow-lg mb-6 mt-6">
          <h3 className="text-lg font-semibold text-center mb-4">
            Thống kê tổng quan
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 text-center gap-4">
            <div>
              <p className="text-xl font-bold">{filteredOrders.length}</p>
              <p>Tổng đơn hàng</p>
            </div>
            <div>
              <p className="text-xl font-bold">
                {formatCurrencyVND(
                    filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0)
                )}
              </p>
              <p>Tổng số tiền (VND)</p>
            </div>
            <div>
              <p className="text-xl font-bold">
                {filteredOrders.reduce(
                    (sum, order) =>
                        sum +
                        order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0),
                    0
                )}
              </p>
              <p>Tổng sản phẩm đã bán</p>
            </div>
            <div>
              <p className="text-xl font-bold">
                {new Set(
                    filteredOrders
                        .map((order) => order.collaborator?.user?.username)
                        .filter(Boolean)
                ).size}
              </p>
              <p>Tổng số cộng tác viên</p>
            </div>
          </div>
        </div>

        {/* Phần hiển thị biểu đồ */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8 mx-auto max-w-8xl px-4">
          {/* Biểu đồ phân phối trạng thái đơn hàng */}
          <Chart
              type="pie"
              data={{
                labels: Object.keys(
                    filteredOrders.reduce((acc, order) => {
                      acc[order.statusName] = (acc[order.statusName] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                ),
                datasets: [
                  {
                    data: Object.values(
                        filteredOrders.reduce((acc, order) => {
                          acc[order.statusName] = (acc[order.statusName] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                    ),
                    backgroundColor: ["#4caf50", "#ff9800", "#f44336", "#2196f3"],
                    hoverBackgroundColor: ["#66bb6a", "#ffb74d", "#e57373", "#64b5f6"],
                  },
                ],
              }}
              options={{ maintainAspectRatio: false }}
              title="Phân phối trạng thái đơn hàng"
          />

          {/* Biểu đồ Top 5 sản phẩm theo số lượng */}
          <Chart
              type="bar"
              data={{
                labels: Object.entries(
                    filteredOrders
                        .flatMap((order) => order.orderItems)
                        .reduce((acc, item) => {
                          acc[item.product.productName] =
                              (acc[item.product.productName] || 0) + item.quantity;
                          return acc;
                        }, {} as Record<string, number>)
                )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([name]) => name),
                datasets: [
                  {
                    label: "Số lượng bán ra",
                    data: Object.entries(
                        filteredOrders
                            .flatMap((order) => order.orderItems)
                            .reduce((acc, item) => {
                              acc[item.product.productName] =
                                  (acc[item.product.productName] || 0) + item.quantity;
                              return acc;
                            }, {} as Record<string, number>)
                    )
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([, quantity]) => quantity),
                    backgroundColor: "#2196f3",
                    hoverBackgroundColor: "#64b5f6",
                  },
                ],
              }}
              options={{
                ...barChartOptions,
                indexAxis: "y",
              }}
              title="Top 5 sản phẩm theo số lượng"
          />

          {/* Biểu đồ Top 5 cộng tác viên theo doanh thu */}
          <Chart
              type="bar"
              data={{
                labels: Object.entries(
                    filteredOrders.reduce((acc, order) => {
                      const collaboratorName = order.collaborator?.user?.username || "Ẩn danh";
                      acc[collaboratorName] = (acc[collaboratorName] || 0) + order.totalAmount;
                      return acc;
                    }, {} as Record<string, number>)
                )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([name]) => name),
                datasets: [
                  {
                    label: "Doanh thu (VND)",
                    data: Object.entries(
                        filteredOrders.reduce((acc, order) => {
                          const collaboratorName = order.collaborator?.user?.username || "Ẩn danh";
                          acc[collaboratorName] = (acc[collaboratorName] || 0) + order.totalAmount;
                          return acc;
                        }, {} as Record<string, number>)
                    )
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([, revenue]) => revenue),
                    backgroundColor: "#4caf50",
                    hoverBackgroundColor: "#66bb6a",
                  },
                ],
              }}
              options={barChartOptions}
              title="Top 5 cộng tác viên theo doanh thu"
          />
        </div>
      </div>
  );
};

export default FormOrderAdmin;
