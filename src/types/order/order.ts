import { ProductBasicInfo } from "@/types/product/product";
import { AnonymousUser, UserBasicInfo } from "@/types/user/user";
import { CollaboratorBasicInfo } from "@/types/collaborator/collaborator";
import { Property } from "csstype";
import Order = Property.Order;
import {ErrorResponseProps} from "@/types/error/error";

export interface OrderItemsResponse {
  id?: string;
  product: ProductBasicInfo;
  quantity: number;
  price: number;
  expiryDate: Date;
}

export interface OrderResponse {
  id: string;
  user?: UserBasicInfo;
  anonymousUser?: Record<string, AnonymousUser>;
  collaborator?: CollaboratorBasicInfo;
  statusName: string;
  orderItems: OrderItemsResponse[];
  totalAmount: number;
  orderDate: Date;
  startDate?: Date;
  endDate?: Date;
  referralCodeUsed?: string;
}

export interface OrderState {
  orders: OrderResponse[];
  serviceDates: ServiceDate[];
  loading: boolean;
  error: ErrorResponseProps | null;
}

export interface ServiceDate {
  id: string;
  product: {
    id: string;
    productName: string;
    productCode: string;
  };
  quantity: number;
  price: number;
  expiryDate: string;
}

export interface OrderDistribution {
  [key: string]: number;
}