import PrivateRoute from "@/components/private/PrivateRoute";

const CollaboratorDashboardPage = () => (
  <PrivateRoute requireRole="ROLE_Collaborator">
    <h1 className="flex items-center justify-center text-3xl font-bold text-gray-800 mb-4">
      COLLABORATOR DASHBOARD
    </h1>
  </PrivateRoute>
);

export default CollaboratorDashboardPage;
