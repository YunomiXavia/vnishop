import PrivateRoute from "@/components/private/PrivateRoute";
import FormProductAdmin from "@/components/form/product/FormProductAdmin";

const ProductManagementPage = () => (
  <PrivateRoute requireRole="ROLE_Admin">
    <h1 className="flex items-center justify-center text-3xl font-bold text-gray-800 mb-4">
      QUẢN LÝ SẢN PHẨM
    </h1>
    <FormProductAdmin />
  </PrivateRoute>
);

export default ProductManagementPage;
