import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/api/axiosConfig";
import { CategoryRequestProps, CategoryState } from "@/types/category/category";

const initialState: CategoryState = {
  categories: [],
  loading: false,
  error: null,
};

// Fetch All Categories
export const getCategories = createAsyncThunk(
  "admin/categories/getCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/admin/categories");
      if (response.data.code === 2000) {
        return response.data.result;
      }
    } catch (error) {
      return rejectWithValue("Failed to fetch categories: " + error);
    }
  }
);

// Create a Category
export const createCategory = createAsyncThunk(
  "admin/category/createCategory",
  async (categoryData: CategoryRequestProps, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/admin/category",
        categoryData
      );
      return response.data.result;
    } catch (error) {
      return rejectWithValue("Failed to create category: " + error);
    }
  }
);

// Update a Category
export const updateCategory = createAsyncThunk(
  "admin/category/updateCategory",
  async (
    {
      id,
      categoryData,
    }: { id: string; categoryData: Partial<CategoryRequestProps> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put(
        `/admin/category/${id}`,
        categoryData
      );
      return response.data.result;
    } catch (error) {
      return rejectWithValue("Failed to update category: " + error);
    }
  }
);

// Delete a Category
export const deleteCategory = createAsyncThunk(
  "admin/category/deleteCategory",
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/admin/category/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue("Failed to delete category: " + error);
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
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
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
        state.error = action.payload as string;
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
        state.error = action.payload as string;
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
        state.error = action.payload as string;
      });
  },
});

export default categorySlice.reducer;
