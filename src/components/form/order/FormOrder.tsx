"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useState } from "react";
import { getOrdersHistory } from "@/store/order/orderSlice";
import { OrderItemsResponse } from "@/types/order/order";

const FormOrder = ({ collaboratorId }: { collaboratorId: string }) => {
  const dispatch = useAppDispatch();
  const { orders, loading } = useAppSelector((state) => state.orders);

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<
    OrderItemsResponse[]
  >([]);

  // Lọc các đơn hàng theo collaboratorId
  const filteredOrders = orders.filter(
    (order) => order.collaborator?.id === collaboratorId
  );

  // Xử lý khi chọn một hàng trong bảng
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
    dispatch(getOrdersHistory());
  }, [dispatch]);

  if (loading) return <p>Loading Orders...</p>;

  return (
    <div className="p-4">
      {/* Bảng danh sách đơn hàng */}
      {filteredOrders.length > 0 ? (
        <>
          <h3 className="text-xl font-semibold mb-4">
            Orders for Collaborator
          </h3>
          <div className="overflow-x-auto border rounded-lg shadow-sm mb-6">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-center">#</th>
                  <th className="px-4 py-2 text-center">Username</th>
                  <th className="px-4 py-2 text-center">Email</th>
                  <th className="px-4 py-2 text-center">Phone Number</th>
                  <th className="px-4 py-2 text-center">Order Status</th>
                  <th className="px-4 py-2 text-center">Total Amount</th>
                  <th className="px-4 py-2 text-center">Order Date</th>
                  <th className="px-4 py-2 text-center">Start Date</th>
                  <th className="px-4 py-2 text-center">End Date</th>
                  <th className="px-4 py-2 text-center">Referral Code</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedOrder === order.id ? "bg-indigo-100" : ""
                    }`}
                    onClick={() => handleRowSelect(order.id)}
                  >
                    <td className="border px-4 py-2 text-center">
                      {index + 1}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {order.user?.username || "Anonymous"}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {order.user?.email || "N/A"}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {order.user?.phoneNumber || "N/A"}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-white ${
                          order.statusName === "Open"
                            ? "bg-green-500"
                            : order.statusName === "Complete"
                            ? "bg-blue-500"
                            : "bg-gray-500"
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
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p>No orders found for this collaborator.</p>
      )}

      {/* Chi tiết sản phẩm trong đơn hàng */}
      {selectedOrder && selectedOrderItems.length > 0 && (
        <>
          <h3 className="text-xl font-semibold mt-6">Order Items</h3>
          <div className="overflow-x-auto border rounded-lg shadow-sm mt-4">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-center">#</th>
                  <th className="px-4 py-2 text-center">Product Name</th>
                  <th className="px-4 py-2 text-center">Quantity</th>
                  <th className="px-4 py-2 text-center">Price</th>
                  <th className="px-4 py-2 text-center">Expiry Date</th>
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
                      {item.quantity}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {item.price}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default FormOrder;
