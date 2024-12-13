import PrivateRoute from "@/components/private/PrivateRoute";
import FormCategoryAdmin from "@/components/form/category/FormCategoryAdmin";

const CategoryManagementPage = () => (
    <PrivateRoute requireRole="ROLE_Admin">
        <h1 className="flex items-center justify-center text-3xl font-bold text-gray-800 mb-4">
            QUẢN LÝ DANH MỤC
        </h1>
        <FormCategoryAdmin />
    </PrivateRoute>
);

export default CategoryManagementPage;
