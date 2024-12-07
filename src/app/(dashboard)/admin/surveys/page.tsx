import PrivateRoute from "@/components/private/PrivateRoute";
import FormSurveyAdmin from "@/components/form/survey/FormSurveyAdmin";

const SurveyManagementPageAdmin = () => (
  <PrivateRoute requireRole="ROLE_Admin">
    <h1 className="flex items-center justify-center text-3xl font-bold text-gray-800 mb-4">
      QUẢN LÝ CÂU HỎI
    </h1>
    <FormSurveyAdmin />
  </PrivateRoute>
);

export default SurveyManagementPageAdmin;
