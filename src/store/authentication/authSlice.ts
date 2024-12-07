// store/authentication/authSlice.ts

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/api/axiosConfig";
import {
  AuthState,
  LoginResponse,
  LogoutResponse,
  RegisterResponse,
  ResetPasswordResponse,
} from "@/types/authentication/auth";
import Cookies from "js-cookie";
import {jwtDecode} from "jwt-decode";
import {ErrorResponseProps} from "@/types/error/error";
import {extractError} from "@/utils/utils/helper";

// Login
export const login = createAsyncThunk<
    { token: string; role: string },
    {
      username: string;
      password: string;
    },
    { rejectValue: ErrorResponseProps }
>(
    "auth/login",
    async (credentials, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.post<LoginResponse>(
            "/auth/login",
            credentials
        );
        if (response.data.code === 2000) {
          const token = response.data.result;
          const decodedToken = jwtDecode<{
            sub: string;
            role: string;
            userId: string;
            email: string;
          }>(token);

          // Store token and role in Cookies
          Cookies.set("token", token, { expires: 1 });
          Cookies.set("username", decodedToken.sub, { expires: 1 });
          Cookies.set("role", decodedToken.role, { expires: 1 });
          Cookies.set("userId", decodedToken.userId, { expires: 1 });
          Cookies.set("email", decodedToken.email, { expires: 1 });

          return { token, role: decodedToken.role };
        } else {
          return rejectWithValue({
            code: response.data.code,
            message: response.data.message,
          });
        }
      } catch (error) {
        const ErrorResponseProps = extractError(error);
        return rejectWithValue(ErrorResponseProps);
      }
    }
);

// Register
export const register = createAsyncThunk<
    { token: string; role: string },
    {
      username: string;
      password: string;
      email: string;
      lastName: string;
      firstName: string;
      birthDate: string; // Đổi từ Date sang string để phù hợp với input type="date"
      phoneNumber: string;
    },
    { rejectValue: ErrorResponseProps }
>(
    "auth/register",
    async (credentials, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.post<RegisterResponse>(
            "/auth/register",
            credentials
        );
        if (response.data.code === 2000) {
          const token = response.data.result;

          const decodedToken = jwtDecode<{
            role: string;
            userId: string;
            email: string;
            sub: string;
          }>(token);

          Cookies.set("token", token, { expires: 1 });
          Cookies.set("username", decodedToken.sub, { expires: 1 });
          Cookies.set("role", decodedToken.role, { expires: 1 });
          Cookies.set("userId", decodedToken.userId, { expires: 1 });
          Cookies.set("email", decodedToken.email, { expires: 1 });

          return { token, role: decodedToken.role };
        } else {
          return rejectWithValue({
            code: response.data.code,
            message: response.data.message,
          });
        }
      } catch (error) {
        const ErrorResponseProps = extractError(error);
        return rejectWithValue(ErrorResponseProps);
      }
    }
);

// Logout
export const logout = createAsyncThunk<
    { message: string },
    void,
    { rejectValue: ErrorResponseProps }
>(
    "auth/logout",
    async (_, { rejectWithValue }) => {
      try {
        const token = Cookies.get("token");
        const response = await axiosInstance.post<LogoutResponse>(
            "/auth/logout",
            {
              token: token,
            }
        );
        if (response.data.code === 2000) {
          Cookies.remove("token");
          Cookies.remove("username");
          Cookies.remove("role");
          Cookies.remove("userId");
          Cookies.remove("email");
          if (Cookies.get("id")) Cookies.remove("id");
          return { message: response.data.message };
        } else {
          return rejectWithValue({
            code: response.data.code,
            message: response.data.message,
          });
        }
      } catch (error) {
        const ErrorResponseProps = extractError(error);
        return rejectWithValue(ErrorResponseProps);
      }
    }
);

// Request Password Reset
export const requestPasswordReset = createAsyncThunk<
    { messageRequest: string },
    string,
    { rejectValue: ErrorResponseProps }
>(
    "auth/requestPasswordReset",
    async (email, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.post<ResetPasswordResponse>(
            "/auth/forgot-password",
            {
              email,
            }
        );
        if (response.data.code === 2000) {
          return { messageRequest: response.data.message };
        } else {
          return rejectWithValue({
            code: response.data.code,
            message: response.data.message,
          });
        }
      } catch (error) {
        const ErrorResponseProps = extractError(error);
        return rejectWithValue(ErrorResponseProps);
      }
    }
);

// Verify Password Reset Token
export const verifyPasswordResetToken = createAsyncThunk<
    { messageVerify: string },
    { email: string; token: string },
    { rejectValue: ErrorResponseProps }
>(
    "auth/verifyPasswordResetToken",
    async ({ email, token }, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.post<ResetPasswordResponse>(
            `/auth/forgot-password/verify-token?email=${email}&token=${token}`,
            {
              email,
              token,
            }
        );
        if (response.data.code === 2000) {
          return { messageVerify: response.data.message };
        } else {
          return rejectWithValue({
            code: response.data.code,
            message: response.data.message,
          });
        }
      } catch (error) {
        const ErrorResponseProps = extractError(error);
        return rejectWithValue(ErrorResponseProps);
      }
    }
);

const initialState: AuthState = {
  message: null,
  messageRequest: null,
  messageVerify: null,
  token: null,
  role: null,
  error: null,
  loading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Bạn có thể thêm các reducers bổ sung nếu cần
  },
  extraReducers: (builder) => {
    builder
        // Login
        .addCase(login.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(login.fulfilled, (state, action) => {
          state.loading = false;
          state.token = action.payload.token;
          state.role = action.payload.role;
        })
        .addCase(login.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Đăng nhập thất bại." };
        })
        // Register
        .addCase(register.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(register.fulfilled, (state, action) => {
          state.loading = false;
          state.token = action.payload.token;
          state.role = action.payload.role;
        })
        .addCase(register.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Đăng ký thất bại." };
        })
        // Logout
        .addCase(logout.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(logout.fulfilled, (state) => {
          state.loading = false;
          state.token = null;
          state.role = null;
        })
        .addCase(logout.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || { code: -1, message: "Đăng xuất thất bại." };
        })
        // Request Password Reset
        .addCase(requestPasswordReset.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(requestPasswordReset.fulfilled, (state, action) => {
          state.loading = false;
          state.messageRequest = action.payload.messageRequest;
        })
        .addCase(requestPasswordReset.rejected, (state, action) => {
          state.loading = false;
          state.error =
              action.payload || { code: -1, message: "Yêu cầu đặt lại mật khẩu thất bại." };
        })
        // Verify Password Reset Token
        .addCase(verifyPasswordResetToken.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(verifyPasswordResetToken.fulfilled, (state, action) => {
          state.loading = false;
          state.messageVerify = action.payload.messageVerify;
        })
        .addCase(verifyPasswordResetToken.rejected, (state, action) => {
          state.loading = false;
          state.error =
              action.payload || { code: -1, message: "Xác minh mã token thất bại." };
        });
  },
});

export default authSlice.reducer;
