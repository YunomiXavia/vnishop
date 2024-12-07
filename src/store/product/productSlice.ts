import {
  Product,
  ProductCreationRequestProps,
  ProductState,
  ProductUpdateRequestProps,
} from "@/types/product/product";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/api/axiosConfig";
import {extractError} from "@/utils/utils/helper";
import {ErrorResponseProps} from "@/types/error/error";

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
};

// Get All Products
export const getProducts = createAsyncThunk<Product[], void, { rejectValue: ErrorResponseProps }>(
    "admin/products/getProducts",
    async (_, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.get("/admin/products");
        if (response.data.code === 2000) {
          return response.data.result;
        } else {
          return rejectWithValue({
            code: response.data.code,
            message: response.data.message,
          });
        }
      } catch (error) {
        const extractedError = extractError(error);
        return rejectWithValue(extractedError);
      }
    }
);

// Create A Product
export const createProduct = createAsyncThunk<Product, ProductCreationRequestProps, { rejectValue: ErrorResponseProps }>(
    "admin/product/createProduct",
    async (productData, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.post("/admin/product", productData);
        if (response.data.code === 2000) {
          return response.data.result;
        } else {
          return rejectWithValue({
            code: response.data.code,
            message: response.data.message,
          });
        }
      } catch (error) {
        const extractedError = extractError(error);
        return rejectWithValue(extractedError);
      }
    }
);

// Update an Existing Product
export const updateProduct = createAsyncThunk<Product, { id: string; productData: Partial<ProductUpdateRequestProps> }, { rejectValue: ErrorResponseProps }>(
    "admin/product/updateProduct",
    async ({ id, productData }, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.put(`/admin/product/${id}`, productData);
        if (response.data.code === 2000) {
          return response.data.result;
        } else {
          return rejectWithValue({
            code: response.data.code,
            message: response.data.message,
          });
        }
      } catch (error) {
        const extractedError = extractError(error);
        return rejectWithValue(extractedError);
      }
    }
);

// Delete A Product
export const deleteProduct = createAsyncThunk<string, string, { rejectValue: ErrorResponseProps }>(
    "admin/product/deleteProduct",
    async (id, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.delete(`/admin/product/${id}`);
        if (response.data.code === 2000) {
          return id;
        } else {
          return rejectWithValue({
            code: response.data.code,
            message: response.data.message,
          });
        }
      } catch (error) {
        const extractedError = extractError(error);
        return rejectWithValue(extractedError);
      }
    }
);

// Delete Products
export const deleteProducts = createAsyncThunk<string[], string[], { rejectValue: ErrorResponseProps }>(
    "admin/products/deleteProducts",
    async (productIds, { rejectWithValue }) => {
      try {
        const response = await axiosInstance.delete("/admin/products", {
          data: { productIds },
        });
        if (response.data.code === 2000) {
          return productIds;
        } else {
          return rejectWithValue({
            code: response.data.code,
            message: response.data.message,
          });
        }
      } catch (error) {
        const extractedError = extractError(error);
        return rejectWithValue(extractedError);
      }
    }
);

// Product Slice
const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
        // Get Products
        .addCase(getProducts.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(getProducts.fulfilled, (state, action) => {
          state.loading = false;
          state.products = action.payload;
        })
        .addCase(getProducts.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || null;
        })
        // Create Product
        .addCase(createProduct.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(createProduct.fulfilled, (state, action) => {
          state.loading = false;
          state.products.push(action.payload);
        })
        .addCase(createProduct.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || null;
        })
        // Update Product
        .addCase(updateProduct.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(updateProduct.fulfilled, (state, action) => {
          state.loading = false;
          const updatedProduct = action.payload;
          state.products = state.products.map((product) =>
              product.id === updatedProduct.id ? updatedProduct : product
          );
        })
        .addCase(updateProduct.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || null;
        })
        // Delete Product
        .addCase(deleteProduct.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(deleteProduct.fulfilled, (state, action) => {
          state.loading = false;
          state.products = state.products.filter(
              (product) => product.id !== action.payload
          );
        })
        .addCase(deleteProduct.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || null;
        })
        // Delete Products
        .addCase(deleteProducts.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(deleteProducts.fulfilled, (state, action) => {
          state.loading = false;
          state.products = state.products.filter((product) =>
              action.payload ? !action.payload.includes(product.id) : true
          );
        })
        .addCase(deleteProducts.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || null;
        });
  },
});

export default productSlice.reducer;
