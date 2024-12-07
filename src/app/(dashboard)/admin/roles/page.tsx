import PrivateRoute from "@/components/private/PrivateRoute";
import FormRoleAdmin from "@/components/form/role/FormRoleAdmin";

const RoleManagementPage = () => (
  <PrivateRoute requireRole="ROLE_Admin">
    <h1 className="flex items-center justify-center text-3xl font-bold text-gray-800 mb-4">
      ROLE MANAGEMENT
    </h1>
    <FormRoleAdmin />
  </PrivateRoute>
);

export default RoleManagementPage;
