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
import * as XLSX from "xlsx";

const FormServiceDateAdmin = () => {
  const dispatch = useAppDispatch();
  const {
    orders = [],
    serviceDates = [],
    loading,
    error,
    pageSize,
    serviceDatesCurrentPage,
    serviceDatesTotalPages,
    serviceDatesTotalElements,
    serviceDatesPageSize,
  } = useAppSelector((state) => state.orders);

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  // Phần lọc trên cùng
  const [topFilters, setTopFilters] = useState({
    username: "",
    collaboratorUsername: "",
    orderStatus: "",
    totalAmount: "",
  });

  // Phần lọc bên dưới (theo ngày, mã GT)
  const [bottomFilters, setBottomFilters] = useState({
    orderDateStart: "",
    orderDateEnd: "",
    startDateRangeStart: "",
    startDateRangeEnd: "",
    endDateRangeStart: "",
    endDateRangeEnd: "",
    referralCodeUsed: "",
  });

  const handleTopFiltersChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTopFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBottomFiltersChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setBottomFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRowSelect = (orderId: string) => {
    if (selectedOrder === orderId) {
      setSelectedOrder(null);
    } else {
      setSelectedOrder(orderId);
      // Gọi API lấy service dates trang 0
      dispatch(
        getServiceDates({ orderId, page: 0, size: serviceDatesPageSize })
      );
      setServiceDatesPage(1);
    }
  };

  const [serviceDatesPage, setServiceDatesPage] = useState(1);

  const handleServiceDatesPageChange = (newPage: number) => {
    if (selectedOrder && newPage > 0 && newPage <= serviceDatesTotalPages) {
      dispatch(
        getServiceDates({
          orderId: selectedOrder,
          page: newPage - 1,
          size: serviceDatesPageSize,
        })
      );
      setServiceDatesPage(newPage);
    }
  };

  // Xuất dữ liệu Excel cho đơn hàng
  const handleExportToExcel = () => {
    try {
      const excelData = filteredOrders.map((order, index) => ({
        STT: index + 1,
        User: String(
          order.user?.username || order.anonymousUser?.username || "Ẩn danh"
        ),
        Email: String(order.user?.email || order.anonymousUser?.email || "N/A"),
        ["SĐT"]: String(
          order.user?.phoneNumber || order.anonymousUser?.phoneNumber || "N/A"
        ),
        CTV: order.collaborator?.user?.username || "N/A",
        ["Email CTV"]: order.collaborator?.user?.email || "N/A",
        ["SĐT CTV"]: order.collaborator?.user?.phoneNumber || "N/A",
        ["ĐH X.Lý"]: order.collaborator?.totalOrdersHandled || "0",
        ["Trạng thái"]: order.statusName,
        ["Tổng (VND)"]: order.totalAmount || 0,
        ["Đặt"]: order.orderDate
          ? new Date(order.orderDate).toLocaleDateString()
          : "N/A",
        ["B.đầu"]: order.startDate
          ? new Date(order.startDate).toLocaleDateString()
          : "N/A",
        ["K.thúc"]: order.endDate
          ? new Date(order.endDate).toLocaleDateString()
          : "N/A",
        ["M.GT"]: order.referralCodeUsed || "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
      XLSX.writeFile(workbook, "Orders.xlsx");

      setNotification({
        message: "Xuất dữ liệu đơn hàng ra Excel thành công!",
        type: "success",
      });
    } catch (error: unknown) {
      setNotification({
        message: "Xuất dữ liệu thống kê thất bại: " + error,
        type: "error",
      });
    }
  };

  // Xuất dữ liệu thống kê Excel
  const handleExportStatisticsToExcel = () => {
    try {
      // Thống kê dựa trên biểu đồ
      // barChartData: sản phẩm -> số ngày dịch vụ
      const productStats = Object.keys(serviceDatesByProduct).map(
        (productName) => ({
          ["Sản phẩm"]: productName,
          ["Số ngày DV"]: serviceDatesByProduct[productName],
        })
      );

      const validCount = totalServiceDates - totalExpiredDates;
      const pieStats = [
        { ["Trạng thái"]: "Còn hiệu lực", ["Số lượng"]: validCount },
        { ["Trạng thái"]: "Hết hạn", ["Số lượng"]: totalExpiredDates },
      ];

      const wb = XLSX.utils.book_new();

      // Sheet thống kê sản phẩm
      const wsProduct = XLSX.utils.json_to_sheet(productStats);
      XLSX.utils.book_append_sheet(wb, wsProduct, "DV_Theo_SanPham");

      // Sheet thống kê trạng thái
      const wsPie = XLSX.utils.json_to_sheet(pieStats);
      XLSX.utils.book_append_sheet(wb, wsPie, "DV_TrangThai");

      XLSX.writeFile(wb, "ThongKe.xlsx");

      setNotification({
        message: "Xuất dữ liệu thống kê ra Excel thành công!",
        type: "success",
      });
    } catch (error: unknown) {
      setNotification({
        message: "Xuất dữ liệu thống kê thất bại: " + error,
        type: "error",
      });
    }
  };

  useEffect(() => {
    dispatch(getOrdersHistory({ page: 0, size: pageSize }));
  }, [dispatch, pageSize]);

  const [currentOrdersPage, setCurrentOrdersPage] = useState(1);
  const rowsPerPage = 5;

  // Hàm tiện ích so sánh ngày trong khoảng
  const isDateInRange = (
    dateString: Date | undefined,
    start: string,
    end: string
  ) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      return date >= startDate && date <= endDate;
    } else if (start && !end) {
      const startDate = new Date(start);
      return date >= startDate;
    } else if (!start && end) {
      const endDate = new Date(end);
      return date <= endDate;
    } else {
      // không có lọc
      return true;
    }
  };

  // Áp dụng lọc
  const filteredOrders = orders.filter((order) => {
    // Lọc phần top
    const matchUsername =
      topFilters.username === "" ||
      order.user?.username
        ?.toLowerCase()
        .includes(topFilters.username.toLowerCase()) ||
      order.anonymousUser?.username
        ?.toLowerCase()
        .includes(topFilters.username.toLowerCase());
    const matchCollaborator =
      topFilters.collaboratorUsername === "" ||
      (order.collaborator?.user?.username
        ?.toLowerCase()
        .includes(topFilters.collaboratorUsername.toLowerCase()) ??
        false);
    const matchStatus =
      topFilters.orderStatus === "" ||
      order.statusName === topFilters.orderStatus;
    const matchTotalAmount =
      topFilters.totalAmount === "" ||
      (order.totalAmount && order.totalAmount > Number(topFilters.totalAmount));

    // Lọc phần bottom
    // orderDate trong khoảng
    const matchOrderDate =
      bottomFilters.orderDateStart === "" && bottomFilters.orderDateEnd === ""
        ? true
        : isDateInRange(
            order.orderDate,
            bottomFilters.orderDateStart,
            bottomFilters.orderDateEnd
          );

    // startDate trong khoảng
    const matchStartDateRange =
      bottomFilters.startDateRangeStart === "" &&
      bottomFilters.startDateRangeEnd === ""
        ? true
        : isDateInRange(
            order.startDate,
            bottomFilters.startDateRangeStart,
            bottomFilters.startDateRangeEnd
          );

    // endDate trong khoảng
    const matchEndDateRange =
      bottomFilters.endDateRangeStart === "" &&
      bottomFilters.endDateRangeEnd === ""
        ? true
        : isDateInRange(
            order.endDate,
            bottomFilters.endDateRangeStart,
            bottomFilters.endDateRangeEnd
          );

    // referralCode partial
    const matchReferralCode =
      bottomFilters.referralCodeUsed === "" ||
      (order.referralCodeUsed
        ?.toLowerCase()
        .includes(bottomFilters.referralCodeUsed.toLowerCase()) ??
        false);

    return (
      matchUsername &&
      matchCollaborator &&
      matchStatus &&
      matchTotalAmount &&
      matchOrderDate &&
      matchStartDateRange &&
      matchEndDateRange &&
      matchReferralCode
    );
  });

  const ordersTotalPages = Math.ceil(filteredOrders.length / rowsPerPage);

  const handleOrdersPageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= ordersTotalPages) {
      setCurrentOrdersPage(newPage);
      setSelectedOrder(null);
    }
  };

  const paginatedOrders = filteredOrders.slice(
    (currentOrdersPage - 1) * rowsPerPage,
    currentOrdersPage * rowsPerPage
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
    labels: ["Còn hiệu lực", "Hết hạn"],
    datasets: [
      {
        data: [totalServiceDates - totalExpiredDates, totalExpiredDates],
        backgroundColor: ["#4caf50", "#f44336"],
      },
    ],
  };

  if (loading) return <p>Đang tải...</p>;
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
            Quản lý Ngày Dịch Vụ
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
              className="flex items-center px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 ease-in-out transform hover:scale-105"
              onClick={handleExportToExcel}
            >
              <FaFileExcel className="mr-2" />
              Xuất Excel
            </button>
          </div>
        </div>

        {/* Phần lọc trên cùng */}
        <div className="flex flex-wrap space-x-4 mb-4 justify-end items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              User (chứa):
            </label>
            <input
              type="text"
              name="username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleTopFiltersChange}
              value={topFilters.username}
              placeholder="User"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              CTV (chứa):
            </label>
            <input
              type="text"
              name="collaboratorUsername"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleTopFiltersChange}
              value={topFilters.collaboratorUsername}
              placeholder="CTV"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Trạng thái:
            </label>
            <select
              name="orderStatus"
              className="border p-2 rounded w-full"
              onChange={handleTopFiltersChange}
              value={topFilters.orderStatus}
            >
              <option value="">All</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Complete">Complete</option>
              <option value="Cancel">Cancel</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tổng &gt; (VND):
            </label>
            <input
              type="number"
              name="totalAmount"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleTopFiltersChange}
              value={topFilters.totalAmount}
              placeholder="VD: 100000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              M.GT (chứa):
            </label>
            <input
              type="text"
              name="referralCodeUsed"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleBottomFiltersChange}
              value={bottomFilters.referralCodeUsed}
              placeholder="M.GT"
            />
          </div>
        </div>

        {/* Phần lọc bên dưới */}
        <div className="flex flex-wrap space-x-4 mb-4 justify-end items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Đặt từ:
            </label>
            <input
              type="date"
              name="orderDateStart"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleBottomFiltersChange}
              value={bottomFilters.orderDateStart}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Đặt đến:
            </label>
            <input
              type="date"
              name="orderDateEnd"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleBottomFiltersChange}
              value={bottomFilters.orderDateEnd}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              B.đầu từ:
            </label>
            <input
              type="date"
              name="startDateRangeStart"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleBottomFiltersChange}
              value={bottomFilters.startDateRangeStart}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              B.đầu đến:
            </label>
            <input
              type="date"
              name="startDateRangeEnd"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleBottomFiltersChange}
              value={bottomFilters.startDateRangeEnd}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              K.thúc từ:
            </label>
            <input
              type="date"
              name="endDateRangeStart"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleBottomFiltersChange}
              value={bottomFilters.endDateRangeStart}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              K.thúc đến:
            </label>
            <input
              type="date"
              name="endDateRangeEnd"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              onChange={handleBottomFiltersChange}
              value={bottomFilters.endDateRangeEnd}
            />
          </div>
        </div>

        {/* Bảng Đơn hàng */}
        {filteredOrders.length > 0 ? (
          <>
            <h3 className="text-xl font-semibold mb-2">Đơn hàng</h3>
            <div className="overflow-x-auto border rounded-lg shadow-sm mb-6">
              <table className="min-w-full bg-white border rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="px-4 py-2 text-center">STT</th>
                    <th className="px-4 py-2 text-center">User</th>
                    <th className="px-4 py-2 text-center">Email</th>
                    <th className="px-4 py-2 text-center">SĐT</th>
                    <th className="px-4 py-2 text-center">CTV</th>
                    <th className="px-4 py-2 text-center">E.CTV</th>
                    <th className="px-4 py-2 text-center">SĐT CTV</th>
                    <th className="px-4 py-2 text-center">ĐH X.Lý</th>
                    <th className="px-4 py-2 text-center">Trạng thái</th>
                    <th className="px-4 py-2 text-center">Tổng</th>
                    <th className="px-4 py-2 text-center">Đặt</th>
                    <th className="px-4 py-2 text-center">B.đầu</th>
                    <th className="px-4 py-2 text-center">K.thúc</th>
                    <th className="px-4 py-2 text-center">M.GT</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedOrders.map((order, index) => (
                    <tr
                      key={`${order.id}-${index}`}
                      className={`hover:bg-gray-50 transition ease-in-out duration-200 cursor-pointer ${
                        selectedOrder === order.id ? "bg-indigo-100" : ""
                      }`}
                      onClick={() => handleRowSelect(order.id)}
                    >
                      <td className="border px-4 py-2 text-center">
                        {(currentOrdersPage - 1) * rowsPerPage + index + 1}
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
                          className={`px-3 py-1 rounded-full text-white text-sm whitespace-nowrap ${
                            order.statusName === "Open"
                              ? "bg-green-500"
                              : order.statusName === "Complete"
                              ? "bg-slate-400"
                              : order.statusName === "In Progress"
                              ? "bg-yellow-500"
                              : "bg-red-500"
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
                  ))}
                  {paginatedOrders.length === 0 && (
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
            <div className="overflow-x-auto border rounded-lg shadow-sm mb-6">
              <table className="min-w-full bg-white border rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="px-4 py-2 text-center">STT</th>
                    <th className="px-4 py-2 text-center">User</th>
                    <th className="px-4 py-2 text-center">Email</th>
                    <th className="px-4 py-2 text-center">SĐT</th>
                    <th className="px-4 py-2 text-center">CTV</th>
                    <th className="px-4 py-2 text-center">E.CTV</th>
                    <th className="px-4 py-2 text-center">SĐT CTV</th>
                    <th className="px-4 py-2 text-center">ĐH X.Lý</th>
                    <th className="px-4 py-2 text-center">Trạng thái</th>
                    <th className="px-4 py-2 text-center">Tổng</th>
                    <th className="px-4 py-2 text-center">Đặt</th>
                    <th className="px-4 py-2 text-center">B.đầu</th>
                    <th className="px-4 py-2 text-center">K.thúc</th>
                    <th className="px-4 py-2 text-center">M.GT</th>
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

        {/* Phân trang cho Orders */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Đang hiển thị trang{" "}
            {Math.min(
              (currentOrdersPage - 1) * rowsPerPage + 1,
              filteredOrders.length
            )}{" "}
            trên{" "}
            {Math.min(currentOrdersPage * rowsPerPage, filteredOrders.length)},
            tổng số {filteredOrders.length} mục
          </p>

          <Pagination
            currentPage={currentOrdersPage}
            totalPages={ordersTotalPages}
            onPageChange={handleOrdersPageChange}
          />
        </div>

        {selectedOrder && serviceDates.length > 0 && (
          <>
            <h3 className="text-xl font-semibold mt-4 mb-2">Ngày DV</h3>
            <div className="overflow-x-auto border rounded-lg shadow-sm mb-2">
              <table className="min-w-full bg-white border rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="px-4 py-2 text-center">SP</th>
                    <th className="px-4 py-2 text-center">Hết hạn</th>
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

            {/* Phân trang cho Service Dates */}
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-600">
                Đang hiển thị từ{" "}
                {Math.min(
                  serviceDatesCurrentPage * serviceDatesPageSize + 1,
                  serviceDatesTotalElements
                )}{" "}
                đến{" "}
                {Math.min(
                  (serviceDatesCurrentPage + 1) * serviceDatesPageSize,
                  serviceDatesTotalElements
                )}{" "}
                trên tổng số {serviceDatesTotalElements} mục
              </p>

              <Pagination
                currentPage={serviceDatesCurrentPage + 1}
                totalPages={serviceDatesTotalPages}
                onPageChange={handleServiceDatesPageChange}
              />
            </div>
          </>
        )}

        {/* Biểu đồ thống kê tổng quan ngày dịch vụ */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold">Tổng quan DV</h3>
          <div className="grid grid-cols-2 gap-4">
            <Chart
              type="bar"
              data={barChartData}
              options={barChartOptions}
              title="DV/SP"
            />
            <Chart
              type="pie"
              data={pieChartData}
              title="Trạng thái DV"
              options={barChartOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormServiceDateAdmin;
