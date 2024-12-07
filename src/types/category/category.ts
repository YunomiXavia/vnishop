export interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
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
