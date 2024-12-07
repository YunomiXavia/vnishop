import PrivateRoute from "@/components/private/PrivateRoute";
import FormCollaboratorAdmin from "@/components/form/collaborator/FormCollaboratorAdmin";

const CollaboratorManagementPage = () => (
    <PrivateRoute requireRole="ROLE_Admin">
        <h1 className="flex items-center justify-center text-3xl font-bold text-gray-800 mb-4">
            QUẢN LÝ CỘNG TÁC VIÊN
        </h1>
        <FormCollaboratorAdmin />
    </PrivateRoute>
);

export default CollaboratorManagementPage;
