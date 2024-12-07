import { RoleRequest, RoleState } from "@/types/role/role";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/api/axiosConfig";

const initialState: RoleState = {
  roles: [],
  loading: false,
  error: null,
};

// Get All Roles
export const getRoles = createAsyncThunk(
  "admin/roles/getRoles",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/admin/roles");
      if (response.data.code === 2000) {
        return response.data.result;
      }
    } catch (error) {
      return rejectWithValue("Failed to fetch roles: " + error);
    }
  }
);

// Create A Role
export const createRole = createAsyncThunk(
  "admin/role/createRole",
  async (roleData: RoleRequest, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/admin/role", roleData);
      if (response.data.code === 2000) {
        return response.data.result;
      }
    } catch (error) {
      return rejectWithValue("Failed to create role: " + error);
    }
  }
);

// Update an Existing Role
export const updateRole = createAsyncThunk(
  "admin/role/updateRole",
  async (
    { id, roleData }: { id: string; roleData: Partial<RoleRequest> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put(`/admin/role/${id}`, roleData);
      if (response.data.code === 2000) {
        return response.data.result;
      }
    } catch (error) {
      return rejectWithValue("Failed to update role: " + error);
    }
  }
);

// Delete a Role
export const deleteRole = createAsyncThunk(
  "admin/role/deleteRole",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/admin/role/${id}`);
      if (response.data.code === 2000) {
        return id;
      }
    } catch (error) {
      return rejectWithValue("Failed to delete role: " + error);
    }
  }
);

// Delete Roles
export const deleteRoles = createAsyncThunk(
  "admin/roles/deleteRoles",
  async (roleIds: string[], { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/admin/roles`, {
        data: { roleIds },
      });
      if (response.data.code === 2000) {
        return roleIds;
      }
    } catch (error) {
      return rejectWithValue("Failed to delete roles: " + error);
    }
  }
);

// Create Slice
const roleSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get Roles
      .addCase(getRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(getRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Role
      .addCase(createRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.loading = true;
        state.roles.push(action.payload);
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Role
      .addCase(updateRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.loading = false;
        const updatedRole = action.payload;
        state.roles = state.roles.map((role) =>
          role.id === updatedRole.id ? updatedRole : role
        );
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Role
      .addCase(deleteRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = state.roles.filter((role) => role.id !== action.payload);
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Roles
      .addCase(deleteRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = state.roles.filter((role) =>
          action.payload ? !action.payload.includes(role.id) : true
        );
      })
      .addCase(deleteRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default roleSlice.reducer;
