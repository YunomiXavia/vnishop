import PrivateRoute from "@/components/private/PrivateRoute";
import FormOrderCollaborator from "@/components/form/order/FormOrderCollaborator";

const SurveyManagementPageCollaborator = () => (
  <PrivateRoute requireRole="ROLE_Collaborator">
    <h1 className="flex items-center justify-center text-3xl font-bold text-gray-800 mb-4">
      QUẢN LÝ ĐƠN HÀNG
    </h1>
    <FormOrderCollaborator />
  </PrivateRoute>
);

export default SurveyManagementPageCollaborator;
