import PrivateRoute from "@/components/private/PrivateRoute";

const UserDashboardPage = () => (
  <PrivateRoute requireRole="ROLE_User">
    <div>TRANG CHỦ NGƯỜI DÙNG</div>
  </PrivateRoute>
);

export default UserDashboardPage;
