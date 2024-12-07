// Role State for roleSlice
export interface RoleState {
  roles: Role[];
  loading: boolean;
  error: string | null;
}

// Role Interface
export interface Role {
  id: string;
  roleName: string;
}

// Role Request
export interface RoleRequest {
  roleName: string;
}
