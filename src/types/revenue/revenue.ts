import { ErrorResponseProps } from "@/types/error/error";

export interface RevenueState {
  revenueDetails: Array<{
    collaboratorId: string;
    totalRevenue: number | null;
    totalCommission: number | null;
    totalRevenueWithCommission: number | null;
    commissionRate: number | null;
  }>;
  loading: boolean;
  error: ErrorResponseProps | null;
}
