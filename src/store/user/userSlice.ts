// store/user/userSlice.ts

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/api/axiosConfig";
import {
  User,
  UserState,
  UpdateUserProps,
  UpdateUserWithoutPasswordProps,
} from "@/types/user/user";
import Cookies from "js-cookie";
import {ErrorResponseProps} from "@/types/error/error";
import {extractError} from "@/utils/utils/helper";

const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
};

// Get All Users
export const getUsers = createAsyncThunk<
    User[],
    void,
    { rejectValue: ErrorResponseProps }
>(
    "admin/users/getUsers",
    async (_, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.get("/admin/users");
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

// Create A User
export const createUser = createAsyncThunk<
    User,
    Omit<User, "id" | "role" | "dateJoined" | "totalSpent">,
    { rejectValue: ErrorResponseProps }
>(
    "admin/user/createUser",
    async (userData, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.post("/admin/user", userData);
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

// Update an Existing User
export const updateUser = createAsyncThunk<
    User,
    { id: string; userData: Partial<UpdateUserProps> },
    { rejectValue: ErrorResponseProps }
>(
    "admin/user/updateUser",
    async ({ id, userData }, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.put(`/admin/user/${id}`, userData);
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

// Update User Without Password
export const updateUserWithoutPassword = createAsyncThunk<
    User,
    { id: string; userData: Partial<UpdateUserWithoutPasswordProps> },
    { rejectValue: ErrorResponseProps }
>(
    "admin/user/updateUser/without-password",
    async ({ id, userData }, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.put(
            `/admin/user/${id}/without-password`,
            userData
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

// Delete an User
export const deleteUser = createAsyncThunk<
    string,
    string,
    { rejectValue: ErrorResponseProps }
>(
    "admin/user/deleteUser",
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

// Delete Users
export const deleteUsers = createAsyncThunk<
    string[],
    string[],
    { rejectValue: ErrorResponseProps }
>(
    "admin/users/deleteUsers",
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

// Get My Info
export const getMyInfo = createAsyncThunk<
    User,
    void,
    { rejectValue: ErrorResponseProps }
>(
    "my-info",
    async (_, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.get("/my-info");
        if (response.data.code === 2000) {
          const userId = response.data.result.id;
          Cookies.set("id", userId, { expires: 1 });
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

// Update My Info
export const updateMyInfo = createAsyncThunk<
    User,
    Partial<UpdateUserProps>,
    { rejectValue: ErrorResponseProps }
>(
    "update-info",
    async (userData, { rejectWithValue }) => {
      try {
        const userId = Cookies.get("id");
        if (!userId) {
          return rejectWithValue({
            code: 4000,
            message: "Không tìm thấy ID người dùng.",
          });
        }
        const response = await axiosInstance.put(`/update-info/${userId}`, userData);
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

// Slice
const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
        // Get Users
        .addCase(getUsers.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(getUsers.fulfilled, (state, action) => {
          state.loading = false;
          state.users = action.payload;
        })
        .addCase(getUsers.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Lấy danh sách Người dùng thất bại." };
        })
        // Create User
        .addCase(createUser.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(createUser.fulfilled, (state, action) => {
          state.loading = false;
          state.users.push(action.payload);
        })
        .addCase(createUser.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Tạo Người dùng thất bại." };
        })
        // Update User
        .addCase(updateUser.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(updateUser.fulfilled, (state, action) => {
          state.loading = false;
          const updatedUser = action.payload;
          state.users = state.users.map((user) =>
              user.id === updatedUser.id ? updatedUser : user
          );
        })
        .addCase(updateUser.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Cập nhật Người dùng thất bại." };
        })
        // Update User Without Password
        .addCase(updateUserWithoutPassword.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(updateUserWithoutPassword.fulfilled, (state, action) => {
          state.loading = false;
          const updatedUser = action.payload;
          state.users = state.users.map((user) =>
              user.id === updatedUser.id ? updatedUser : user
          );
        })
        .addCase(updateUserWithoutPassword.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Cập nhật Người dùng thất bại." };
        })
        // Delete User
        .addCase(deleteUser.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(deleteUser.fulfilled, (state, action) => {
          state.loading = false;
          state.users = state.users.filter((user) => user.id !== action.payload);
        })
        .addCase(deleteUser.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Xóa Người dùng thất bại." };
        })
        // Delete Users
        .addCase(deleteUsers.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(deleteUsers.fulfilled, (state, action) => {
          state.loading = false;
          state.users = state.users.filter((user) =>
              action.payload ? !action.payload.includes(user.id) : true
          );
        })
        .addCase(deleteUsers.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Xóa các Người dùng thất bại." };
        })
        // Get My Info
        .addCase(getMyInfo.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(getMyInfo.fulfilled, (state, action) => {
          state.loading = false;
          const user = action.payload;
          state.users = [user];
        })
        .addCase(getMyInfo.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Xem thông tin bản thân thất bại." };
        })
        // Update My Info
        .addCase(updateMyInfo.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(updateMyInfo.fulfilled, (state, action) => {
          state.loading = false;
          const updatedUser = action.payload;
          state.users = state.users.map((user) =>
              user.id === updatedUser.id ? updatedUser : user
          );
        })
        .addCase(updateMyInfo.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Cập nhật thông tin bản thân thất bại." };
        });
  },
});

export default userSlice.reducer;
