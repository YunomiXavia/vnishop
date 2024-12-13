import { ErrorResponseProps } from "@/types/error/error";

export interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: ErrorResponseProps | null;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface CategoryRequestProps {
  name: string;
  description: string;
}
