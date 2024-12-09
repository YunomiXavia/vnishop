import {Product, ProductState,} from "@/types/product/product";
import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import axiosInstance from "@/utils/api/axiosConfig";
import {extractError} from "@/utils/utils/helper";
import {ErrorResponseProps} from "@/types/error/error";
import {BASE_URL} from "@/types/api/api";

const initialState: ProductState = {
    products: [],
    loading: false,
    error: null,
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 5,
};

// Get Products with Pagination
export const getProducts = createAsyncThunk<
    { content: Product[]; currentPage: number; totalPages: number; totalElements: number; pageSize: number },
    { page: number; size: number },
    { rejectValue: ErrorResponseProps }
>(
    "admin/products/getProducts",
    async ({ page, size }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/admin/products?page=${page}&size=${size}`);
            if (response.data.code === 2000) {
                const data = response.data.result.data;
                return {
                    content: data.content,
                    currentPage: data.number,
                    totalPages: data.totalPages,
                    totalElements: data.totalElements,
                    pageSize: data.size
                };
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


// Create A Product (with image upload)
export const createProduct = createAsyncThunk<Product, FormData, { rejectValue: ErrorResponseProps }>(
    "admin/product/createProduct",
    async (formData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/admin/product", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
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
export const updateProduct = createAsyncThunk<Product, { id: string; formData: FormData }, { rejectValue: ErrorResponseProps }>(
    "admin/product/updateProduct",
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/admin/product/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
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
            // Thêm logic tạo tinyImageUrl cho mỗi product
            state.products = action.payload.content.map((product) => {
                let tinyImageUrl = "";
                if (product.originalImageName) {
                    const tinyImageName = product.originalImageName.replace("original_", "tiny_");
                    tinyImageUrl = `${BASE_URL}/products/${product.productCode}/tiny/${tinyImageName}`;
                }
                return {...product, tinyImageUrl};
            });
            state.currentPage = action.payload.currentPage;
            state.totalPages = action.payload.totalPages;
            state.totalElements = action.payload.totalElements;
            state.pageSize = action.payload.pageSize;
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
            let tinyImageUrl = "";
            if (action.payload.originalImageName) {
                const tinyImageName = action.payload.originalImageName.replace("original_", "tiny_");
                tinyImageUrl = `${BASE_URL}/products/${action.payload.productCode}/tiny/${tinyImageName}`;
            }
            state.products.push({ ...action.payload, tinyImageUrl });
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
            let tinyImageUrl = "";
            if (updatedProduct.originalImageName) {
                const tinyImageName = updatedProduct.originalImageName.replace("original_", "tiny_");
                tinyImageUrl = `${BASE_URL}/products/${updatedProduct.productCode}/tiny/${tinyImageName}`;
            }

            state.products = state.products.map((product) =>
                product.id === updatedProduct.id ? { ...updatedProduct, tinyImageUrl } : product
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
