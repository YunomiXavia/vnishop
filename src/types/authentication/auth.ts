// Response Login
import { ErrorResponseProps } from "@/types/error/error";

export interface LoginResponse {
  code: number;
  message: string;
  result: string;
}

// Response Register
export interface RegisterResponse {
  code: number;
  message: string;
  result: string;
}

// Response Logout
export interface LogoutResponse {
  code: number;
  message: string;
}

// Response Reset Password
export interface ResetPasswordResponse {
  code: number;
  message: string;
}

// Auth State in Auth Slice
export interface AuthState {
  message: string | null;
  messageRequest: string | null;
  messageVerify: string | null;
  token: string | null;
  role: string | null;
  error: ErrorResponseProps | null;
  loading: boolean;
}

// Login Form Data for FormLogin
export interface LoginFormData {
  username: string;
  password: string;
}

// Register Form Data for FormRegister
export interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  lastName: string;
  firstName: string;
  birthDate: string;
  phoneNumber: string;
}
