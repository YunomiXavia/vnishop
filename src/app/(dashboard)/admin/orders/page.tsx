import PrivateRoute from "@/components/private/PrivateRoute";
import FormOrderAdmin from "@/components/form/order/FormOrderAdmin";

const SurveyManagementPageCollaborator = () => (
  <PrivateRoute requireRole="ROLE_Admin">
    <h1 className="flex items-center justify-center text-3xl font-bold text-gray-800 mb-4">
      QUẢN LÝ ĐƠN HÀNG
    </h1>
    <FormOrderAdmin />
  </PrivateRoute>
);

export default SurveyManagementPageCollaborator;
