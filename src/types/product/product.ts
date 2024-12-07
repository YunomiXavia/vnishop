import {ErrorResponseProps} from "@/types/error/error";

// Product State for productSlice
export interface ProductState {
  products: Product[];
  loading: boolean;
  error: ErrorResponseProps | null;
}

// Product Props
export interface Product {
  id: string;
  productName: string;
  price: number;
  description: string;
  stock: number;
  subscriptionDuration: number;
  category: string;
  productCode: string;
}

// Product Creation Props
export interface ProductCreationRequestProps {
  productName: string;
  price: number;
  description: string;
  stock: number;
  subscriptionDuration: number;
}

// Product Update Props
export interface ProductUpdateRequestProps {
  productName: string;
  price: number;
  description: string;
  stock: number;
  subscriptionDuration: number;
}

export interface ProductBasicInfo {
  id?: string;
  productName: string;
  productCode: string;
}
