"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getOrdersHistoryWithoutPagination } from "@/store/order/orderSlice";
import { OrderItemsResponse } from "@/types/order/order";
import Pagination from "@/components/pagination/Pagination";
import { formatCurrencyVND, formatPhoneNumber } from "@/utils/utils/utils";
import Notification from "@/components/notification/Notification";

const FormOrder = ({ collaboratorId }: { collaboratorId: string }) => {
  const dispatch = useAppDispatch();
  const { orders, loading, error } = useAppSelector((state) => state.orders);

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<
    OrderItemsResponse[]
  >([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const filteredOrders = orders.filter(
    (order) => order.collaborator?.id === collaboratorId
  );

  const totalPages = Math.ceil(filteredOrders.length / pageSize);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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

  useEffect(() => {
    dispatch(getOrdersHistoryWithoutPagination());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setNotification({
        message: `Lỗi: ${error.message}`,
        type: "error",
      });
    }
  }, [error]);

  if (loading) return <p>Đang tải đơn hàng...</p>;

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

      {/* Bảng danh sách đơn hàng */}
      {filteredOrders.length > 0 ? (
        <>
          <h3 className="text-xl font-semibold mb-4">Đơn hàng của CTV</h3>
          <div className="overflow-x-auto border rounded-lg shadow-sm mb-6">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-center">#</th>
                  <th className="px-4 py-2 text-center">Người mua</th>
                  <th className="px-4 py-2 text-center">
                    Email / SĐT người mua
                  </th>
                  <th className="px-4 py-2 text-center">Trạng thái</th>
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
                    key={order.id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedOrder === order.id ? "bg-indigo-100" : ""
                    }`}
                    onClick={() => handleRowSelect(order.id)}
                  >
                    <td className="border px-4 py-2 text-center">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {order.user?.username || "Ẩn danh"}
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
                      <span
                        className={`px-3 py-1 rounded-full text-white text-sm ${
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

          {/* Chi tiết sản phẩm trong đơn hàng */}
          {selectedOrder && selectedOrderItems.length > 0 && (
            <>
              <h3 className="text-xl font-semibold mt-6">Chi tiết đơn hàng</h3>
              <div className="overflow-x-auto border rounded-lg shadow-sm mt-4">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="px-4 py-2 text-center">#</th>
                      <th className="px-4 py-2 text-center">Tên SP</th>
                      <th className="px-4 py-2 text-center">Mã SP</th>
                      <th className="px-4 py-2 text-center">SL</th>
                      <th className="px-4 py-2 text-center">Giá</th>
                      <th className="px-4 py-2 text-center">Hạn dùng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrderItems.map((item, index) => (
                      <tr key={index}>
                        <td className="border px-4 py-2 text-center">
                          {index + 1}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {item.product.productName}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {item.product.productCode}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {item.quantity}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {formatCurrencyVND(item.price)}
                        </td>
                        <td className="border px-4 py-2 text-center">
                          {item.expiryDate
                            ? new Date(item.expiryDate).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Phân Trang */}
          <div className="flex justify-between items-center mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                if (newPage > 0 && newPage <= totalPages) {
                  setCurrentPage(newPage);
                  setSelectedOrder(null);
                  setSelectedOrderItems([]);
                }
              }}
            />
          </div>
        </>
      ) : (
        <p>Không có đơn hàng cho cộng tác viên này.</p>
      )}
    </div>
  );
};

export default FormOrder;
