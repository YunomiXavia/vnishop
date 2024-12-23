import PrivateRoute from "@/components/private/PrivateRoute";
import FormAdminAdmin from "@/components/form/admin/FormAdminAdmin";

const UserManagementPage = () => (
    <PrivateRoute requireRole="ROLE_Admin">
        <h1 className="flex items-center justify-center text-3xl font-bold text-gray-800 mb-4">
            QUẢN LÝ ADMIN
        </h1>
        <FormAdminAdmin />
    </PrivateRoute>
);

export default UserManagementPage;
