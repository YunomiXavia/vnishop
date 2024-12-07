import PrivateRoute from "@/components/private/PrivateRoute";
import FormSurveyCollaborator from "@/components/form/survey/FormSurveyCollaborator";

const SurveyManagementPageCollaborator = () => (
  <PrivateRoute requireRole="ROLE_Collaborator">
    <h1 className="flex items-center justify-center text-3xl font-bold text-gray-800 mb-4">
      QUẢN LÝ CÂU HỎI
    </h1>
    <FormSurveyCollaborator />
  </PrivateRoute>
);

export default SurveyManagementPageCollaborator;
