import { User, UserBasicInfo } from "@/types/user/user";
import { ErrorResponseProps } from "@/types/error/error";

// Collaborator State for collaboratorSlice
export interface CollaboratorState {
  collaborators: Collaborator[];
  loading: boolean;
  error: ErrorResponseProps | null;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
}

// Collaborator Interface
export interface Collaborator {
  id: string;
  user: User;
  referralCode: string;
  commissionRate: number;
  totalOrdersHandled?: number;
  totalSurveyHandled?: number;
  totalCommissionEarned?: number;
}

export interface CollaboratorCreationRequest {
  user: {
    username: string;
    password?: string | null;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    birthDate?: Date | null;
  };
  commissionRate: number;
}

export interface CollaboratorBasicInfo {
  id?: string;
  user?: UserBasicInfo;
  totalOrdersHandled: number;
}
