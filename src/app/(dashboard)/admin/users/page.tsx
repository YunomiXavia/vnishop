import PrivateRoute from "@/components/private/PrivateRoute";
import FormUserAdmin from "@/components/form/user/FormUserAdmin";

const UserManagementPage = () => (
  <PrivateRoute requireRole="ROLE_Admin">
    <h1 className="flex items-center justify-center text-3xl font-bold text-gray-800 mb-4">
      QUẢN LÝ NGƯỜI DÙNG
    </h1>
    <FormUserAdmin />
  </PrivateRoute>
);

export default UserManagementPage;
