import PrivateRoute from "@/components/private/PrivateRoute";
import FormCollaboratorInfo from "@/components/form/collaborator/FormCollaboratorInfo";

const InfoPageCollaborator = () => (
  <PrivateRoute requireRole="ROLE_Collaborator">
    <h1 className="flex items-center justify-center text-3xl font-bold text-gray-800 mb-4">
      THÔNG TIN CỘNG TÁC VIÊN
    </h1>
    <FormCollaboratorInfo />
  </PrivateRoute>
);

export default InfoPageCollaborator;
