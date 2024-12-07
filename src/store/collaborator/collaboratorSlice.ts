import {
  Collaborator,
  CollaboratorCreationRequest,
  CollaboratorState,
} from "@/types/collaborator/collaborator";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/api/axiosConfig";
import Cookies from "js-cookie";
import {extractError} from "@/utils/utils/helper";
import {ErrorResponseProps} from "@/types/error/error";

const initialState: CollaboratorState = {
  collaborators: [],
  loading: false,
  error: null,
};

// Get All Collaborators
export const getCollaborators = createAsyncThunk<
    Collaborator[],
    void,
    { rejectValue: ErrorResponseProps }
>(
    "admin/collaborators/getCollaborators",
    async (_, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.get("/admin/collaborators");
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
    }
);

// Create A Collaborator
export const createCollaborator = createAsyncThunk<
    Collaborator,
    CollaboratorCreationRequest,
    { rejectValue: ErrorResponseProps }
>(
    "admin/collaborator/createCollaborator",
    async (collaboratorData, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.post(
            "/admin/collaborator",
            collaboratorData
        );
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
    }
);

// Update Collaborator Commission Rate
export const updateCollaboratorCommissionRate = createAsyncThunk<
    Collaborator,
    { id: string; commissionRate: number },
    { rejectValue: ErrorResponseProps }
>(
    "admin/collaborator/commission-rate",
    async ({ id, commissionRate }, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.put(
            `/admin/collaborator/commission-rate/${id}`,
            { commissionRate }
        );
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
    }
);

// Delete a Collaborator
export const deleteCollaborator = createAsyncThunk<
    string,
    string,
    { rejectValue: ErrorResponseProps }
>(
    "admin/collaborator/deleteCollaborator",
    async (id, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.delete(`/admin/user/${id}`);
        if (response.data.code === 2000) {
          return id;
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

// Delete Collaborators
export const deleteCollaborators = createAsyncThunk<
    string[],
    string[],
    { rejectValue: ErrorResponseProps }
>(
    "admin/collaborators/deleteCollaborators",
    async (userIds, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.delete("/admin/users", {
          data: { userIds },
        });
        if (response.data.code === 2000) {
          return userIds;
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

// Get Collaborator By User Id
export const getCollaboratorByUserId = createAsyncThunk<
    string,
    void,
    { rejectValue: ErrorResponseProps }
>(
    "collaborator/getCollaboratorByUserId",
    async (_, { rejectWithValue }) => {
      try {
        const userId = Cookies.get("id");
        if (!userId) {
          return rejectWithValue({
            code: 4000,
            message: "Không tìm thấy ID người dùng trong cookies.",
          });
        }
        const response = await axiosInstance.get(
            `/collaborator/by-user/${userId}`
        );
        if (response.data.code === 2000) {
          return response.data.result.id;
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

// Slice Collaborator
const collaboratorSlice = createSlice({
  name: "collaborators",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get Collaborators
        .addCase(getCollaborators.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(getCollaborators.fulfilled, (state, action) => {
          state.loading = false;
          state.collaborators = action.payload;
        })
        .addCase(getCollaborators.rejected, (state, action) => {
          state.loading = false;
          state.error =
              action.payload || { code: -1, message: "Lấy danh sách cộng tác viên thất bại." };
        })
      // Create Collaborator
        .addCase(createCollaborator.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(createCollaborator.fulfilled, (state, action) => {
          state.loading = false;
          state.collaborators.push(action.payload);
        })
        .addCase(createCollaborator.rejected, (state, action) => {
          state.loading = false;
          state.error =
              action.payload || { code: -1, message: "Tạo cộng tác viên thất bại." };
        })
      // Update Collaborator's Commission Rate
        .addCase(updateCollaboratorCommissionRate.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(updateCollaboratorCommissionRate.fulfilled, (state, action) => {
          state.loading = false;
          const updatedCollaborator = action.payload;
          state.collaborators = state.collaborators.map((collaborator) =>
              collaborator.id === updatedCollaborator.id
                  ? updatedCollaborator
                  : collaborator
          );
        })
        .addCase(updateCollaboratorCommissionRate.rejected, (state, action) => {
          state.loading = false;
          state.error =
              action.payload || { code: -1, message: "Cập nhật tỷ lệ hoa hồng thất bại." };
        })
      // Delete Collaborator
        .addCase(deleteCollaborator.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(deleteCollaborator.fulfilled, (state, action) => {
          state.loading = false;
          state.collaborators = state.collaborators.filter(
              (collaborator) => collaborator.user.id !== action.payload
          );
        })
        .addCase(deleteCollaborator.rejected, (state, action) => {
          state.loading = false;
          state.error =
              action.payload || { code: -1, message: "Xóa cộng tác viên thất bại." };
        })
      // Delete Collaborators
        .addCase(deleteCollaborators.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(deleteCollaborators.fulfilled, (state, action) => {
          state.loading = false;
          state.collaborators = state.collaborators.filter((collaborator) =>
              action.payload
                  ? !action.payload.includes(collaborator.user.id)
                  : true
          );
        })
        .addCase(deleteCollaborators.rejected, (state, action) => {
          state.loading = false;
          state.error =
              action.payload || { code: -1, message: "Xóa các cộng tác viên thất bại." };
        })
      // Get Collaborator By User Id
        .addCase(getCollaboratorByUserId.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(getCollaboratorByUserId.fulfilled, (state, action) => {
          state.loading = false;
          const collaboratorId = action.payload;
          state.collaborators = state.collaborators.map((collaborator) =>
              collaborator.user.id === collaboratorId ? { ...collaborator, id: collaboratorId } : collaborator
          );
        })
        .addCase(getCollaboratorByUserId.rejected, (state, action) => {
          state.loading = false;
          state.error =
              action.payload || { code: -1, message: "Lấy thông tin cộng tác viên thất bại." };
        });
  },
});

export default collaboratorSlice.reducer;
