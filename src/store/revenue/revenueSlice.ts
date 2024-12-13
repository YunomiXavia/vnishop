import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/api/axiosConfig";
import { RevenueState } from "@/types/revenue/revenue";
import { extractError } from "@/utils/utils/helper";
import { ErrorResponseProps } from "@/types/error/error";

// Lấy thông tin doanh thu cộng tác viên
export const getCollaboratorRevenueDetails = createAsyncThunk<
  {
    collaboratorId: string;
    totalRevenue: number | null;
    totalCommission: number | null;
    totalRevenueWithCommission: number | null;
    commissionRate: number | null;
  },
  string,
  { rejectValue: ErrorResponseProps }
>(
  "admin/revenue/getCollaboratorRevenueDetails",
  async (collaboratorId, { rejectWithValue }) => {
    try {
      const totalRevenueResponse = await axiosInstance.get(
        `/revenue/${collaboratorId}`
      );
      if (totalRevenueResponse.data.code !== 2000) {
        return rejectWithValue({
          code: totalRevenueResponse.data.code,
          message: totalRevenueResponse.data.message,
        });
      }
      const totalRevenue = totalRevenueResponse.data.result;

      const totalCommissionResponse = await axiosInstance.get(
        `/revenue/commission/${collaboratorId}`
      );
      if (totalCommissionResponse.data.code !== 2000) {
        return rejectWithValue({
          code: totalCommissionResponse.data.code,
          message: totalCommissionResponse.data.message,
        });
      }
      const totalCommission = totalCommissionResponse.data.result;

      const totalRevenueWithCommissionResponse = await axiosInstance.get(
        `/revenue/with-commission/${collaboratorId}`
      );
      if (totalRevenueWithCommissionResponse.data.code !== 2000) {
        return rejectWithValue({
          code: totalRevenueWithCommissionResponse.data.code,
          message: totalRevenueWithCommissionResponse.data.message,
        });
      }
      const totalRevenueWithCommission =
        totalRevenueWithCommissionResponse.data.result;

      const commissionRateResponse = await axiosInstance.get(
        `/collaborator/commission-rate/${collaboratorId}`
      );
      if (commissionRateResponse.data.code !== 2000) {
        return rejectWithValue({
          code: commissionRateResponse.data.code,
          message: commissionRateResponse.data.message,
        });
      }
      const commissionRate = commissionRateResponse.data.result;

      return {
        collaboratorId,
        totalRevenue,
        totalCommission,
        totalRevenueWithCommission,
        commissionRate,
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

const initialState: RevenueState = {
  revenueDetails: [],
  loading: false,
  error: null,
};

const revenueSlice = createSlice({
  name: "revenue",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getCollaboratorRevenueDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCollaboratorRevenueDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.revenueDetails = [
          ...state.revenueDetails.filter(
            (item) => item.collaboratorId !== action.payload.collaboratorId
          ),
          action.payload,
        ];
      })
      .addCase(getCollaboratorRevenueDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as ErrorResponseProps;
      });
  },
});

export default revenueSlice.reducer;
