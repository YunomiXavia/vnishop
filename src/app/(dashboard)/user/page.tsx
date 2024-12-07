import PrivateRoute from "@/components/private/PrivateRoute";

const UserDashboardPage = () => (
  <PrivateRoute requireRole="ROLE_User">
    <div>User Dashboard</div>
  </PrivateRoute>
);

export default UserDashboardPage;
