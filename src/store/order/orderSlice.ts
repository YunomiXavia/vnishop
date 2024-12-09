import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/api/axiosConfig";
import {OrderPaginatedResponse, OrderResponse, OrderState} from "@/types/order/order";
import {ErrorResponseProps} from "@/types/error/error";
import {extractError} from "@/utils/utils/helper";

const initialState: OrderState = {
    orders: [],
    serviceDates: [],
    loading: false,
    error: null,
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 5,
};

// (Admin) Get all orders with pagination
export const getOrdersHistory = createAsyncThunk<
    OrderPaginatedResponse,
    { page: number; size: number },
    { rejectValue: ErrorResponseProps }
>(
    "orders/getAllOrders",
    async ({ page, size }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/orders/history?page=${page}&size=${size}`);
            if (response.data.code === 2000) {
                const data = response.data.result.data;
                return {
                    orders: data.content,
                    currentPage: response.data.result.currentPage,
                    totalPages: data.totalPages,
                    totalElements: data.totalElements,
                    pageSize: data.size,
                };
            } else {
                return rejectWithValue({
                    code: response.data.code,
                    message: response.data.message,
                });
            }
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

// (Collaborator) Get Orders By Collaborator with pagination
export const getCollaboratorOrderHistory = createAsyncThunk<
    OrderPaginatedResponse,
    { collaboratorId: string; page: number; size: number },
    { rejectValue: ErrorResponseProps }
>(
    "orders/getCollaboratorOrders",
    async ({ collaboratorId, page, size }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(
                `/orders/collaborator/${collaboratorId}/history?page=${page}&size=${size}`
            );
            if (response.data.code === 2000) {
                const data = response.data.result.data;
                return {
                    orders: data.content,
                    currentPage: response.data.result.currentPage,
                    totalPages: data.totalPages,
                    totalElements: data.totalElements,
                    pageSize: data.size,
                };
            } else {
                return rejectWithValue({
                    code: response.data.code,
                    message: response.data.message,
                });
            }
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);



// (Collaborator) Process Orders
export const processOrder = createAsyncThunk<
    OrderResponse,
    { orderId: string; collaboratorId: string },
    { rejectValue: ErrorResponseProps }
>(
    "orders/processOrder",
    async ({ orderId, collaboratorId }, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.put(
            `/order/${orderId}/process`,
            null,
            {
              params: { collaboratorId },
            }
        );
        if (response.data.code === 2000) {
          return response.data.result as OrderResponse;
        } else {
          return rejectWithValue({
            code: response.data.code,
            message: response.data.message,
          });
        }
      } catch (error) {
        return rejectWithValue(extractError(error));
      }
    }
);

// (Collaborator) Complete Orders
export const completeOrder = createAsyncThunk<
    OrderResponse,
    { orderId: string; collaboratorId: string },
    { rejectValue: ErrorResponseProps }
>(
    "orders/completeOrder",
    async ({ orderId, collaboratorId }, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.put(
            `/order/${orderId}/complete`,
            null,
            {
              params: { collaboratorId },
            }
        );
        if (response.data.code === 2000) {
          return response.data.result as OrderResponse;
        } else {
          return rejectWithValue({
            code: response.data.code,
            message: response.data.message,
          });
        }
      } catch (error) {
        return rejectWithValue(extractError(error));
      }
    }
);

// Fetch Service Dates by Order ID
export const getServiceDates = createAsyncThunk<
    any[],
    string,
    { rejectValue: ErrorResponseProps }
>("orders/getServiceDates", async (orderId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(`/revenue/service-dates/${orderId}`);
    if (response.data.code === 2000) {
      return response.data.result;
    } else {
      return rejectWithValue({
        code: response.data.code,
        message: response.data.message,
      });
    }
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // (Admin) Get Orders History
        .addCase(getOrdersHistory.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(getOrdersHistory.fulfilled, (state, action) => {
            state.orders = action.payload.orders;
            state.currentPage = action.payload.currentPage;
            state.totalPages = action.payload.totalPages;
            state.totalElements = action.payload.totalElements;
            state.pageSize = action.payload.pageSize;
            state.loading = false;
        })
        .addCase(getOrdersHistory.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Lấy danh sách đơn hàng thất bại." };
        })
      // (Collaborator) Get Collaborator Order History
        .addCase(getCollaboratorOrderHistory.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(getCollaboratorOrderHistory.fulfilled, (state, action) => {
            state.orders = action.payload.orders;
            state.currentPage = action.payload.currentPage;
            state.totalPages = action.payload.totalPages;
            state.totalElements = action.payload.totalElements;
            state.pageSize = action.payload.pageSize;
            state.loading = false;
        })
        .addCase(getCollaboratorOrderHistory.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Lấy danh sách đơn hàng cộng tác viên thất bại." };
        })
      // (Collaborator) Process Orders
        .addCase(processOrder.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(processOrder.fulfilled, (state, action) => {
          const index = state.orders.findIndex(
              (order) => order.id === action.payload.id
          );
          if (index !== -1) {
            state.orders[index] = action.payload;
          }
          state.loading = false;
        })
        .addCase(processOrder.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Xử lý đơn hàng thất bại." };
        })
      // (Collaborator) Complete Orders
        .addCase(completeOrder.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(completeOrder.fulfilled, (state, action) => {
          const index = state.orders.findIndex(
              (order) => order.id === action.payload.id
          );
          if (index !== -1) {
            state.orders[index] = action.payload;
          }
          state.loading = false;
        })
        .addCase(completeOrder.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Hoàn thành đơn hàng thất bại." };
        })
      // Get Service Dates
        .addCase(getServiceDates.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(getServiceDates.fulfilled, (state, action) => {
          state.serviceDates = action.payload;
          state.loading = false;
        })
        .addCase(getServiceDates.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Lấy ngày dịch vụ thất bại." };
        });
  },
});

export default orderSlice.reducer;
