import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/api/axiosConfig";
import {
  Category,
  CategoryRequestProps,
  CategoryState,
} from "@/types/category/category";
import { ErrorResponseProps } from "@/types/error/error";
import { extractError } from "@/utils/utils/helper";

const initialState: CategoryState = {
  categories: [],
  loading: false,
  error: null,
};

// Fetch All Categories
export const getCategories = createAsyncThunk<
  Category[],
  void,
  { rejectValue: ErrorResponseProps }
>("admin/categories/getCategories", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get("/admin/categories");
    if (response.data.code === 2000) {
      return response.data.result as Category[];
    } else {
      return rejectWithValue({
        code: response.data.code,
        message: response.data.message,
      });
    }
  } catch (error) {
    return rejectWithValue(extractError(error));
  }
});

// Create a Category
export const createCategory = createAsyncThunk<
  Category,
  CategoryRequestProps,
  { rejectValue: ErrorResponseProps }
>(
  "admin/categories/createCategory",
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/admin/category",
        categoryData
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

// Update a Category
export const updateCategory = createAsyncThunk<
  Category,
  { id: string; categoryData: Partial<CategoryRequestProps> },
  { rejectValue: ErrorResponseProps }
>(
  "admin/categories/updateCategory",
  async ({ id, categoryData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(
        `/admin/category/${id}`,
        categoryData
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

// Delete a Category
export const deleteCategory = createAsyncThunk<
  string,
  string,
  { rejectValue: ErrorResponseProps }
>(
  "admin/categories/deleteCategory",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/admin/category/${id}`);
      if (response.data.code === 2000) {
        return id;
      } else {
        return rejectWithValue({
          code: response.data.code,
          message: response.data,
        });
      }
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

const categorySlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get Categories
      .addCase(getCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.loading = false;
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || {
          code: -1,
          message: "Lấy danh sách danh mục thất bại.",
        };
      })
      // Create a Category
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories.push(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || {
          code: -1,
          message: "Tạo danh mục thất bại.",
        };
      })
      // Update a Category
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCategory = action.payload;
        state.categories = state.categories.map((category) =>
          category.id === updatedCategory.id ? updatedCategory : category
        );
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || {
          code: -1,
          message: "Cập nhật danh mục thất bại.",
        };
      })
      // Delete a Category
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.filter((category) =>
          action.payload ? !action.payload.includes(category.id) : true
        );
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || {
          code: -1,
          message: "Xóa danh mục thất bại.",
        };
      });
  },
});

export default categorySlice.reducer;
