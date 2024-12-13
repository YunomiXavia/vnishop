// User State for userSlice
import { ErrorResponseProps } from "@/types/error/error";

export interface UserState {
  users: User[];
  loading: boolean;
  error: ErrorResponseProps | null;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
}

// User Interface
export interface User {
  id: string;
  username: string;
  password?: string | null;
  email: string;
  role: "Admin" | "Collaborator" | "User";
  dateJoined: string;
  totalSpent?: number | null;
  lastName?: string | null;
  firstName?: string | null;
  birthDate?: Date | null;
  phoneNumber?: string | null;
}

// UpdateUserProps for updateUser
export interface UpdateUserProps {
  password: string;
  email: string;
  lastName: string;
  firstName: string;
  birthDate: Date | null;
  phoneNumber: string;
}

export interface UpdateUserWithoutPasswordProps {
  email: string;
  lastName: string;
  firstName: string;
  birthDate: Date | null;
  phoneNumber: string;
}

export interface UserBasicInfo {
  id?: string;
  username: string;
  email: string;
  phoneNumber?: string | null;
}

export interface AnonymousUser {
  id?: string;
  username: string;
  email: string;
  phoneNumber?: string | null;
  ipAddress: string;
}
