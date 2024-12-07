import PrivateRoute from "@/components/private/PrivateRoute";
import FormRevenueAdmin from "@/components/form/revenue/FormRevenueAdmin";

const RevenueManagementPage = () => (
  <PrivateRoute requireRole="ROLE_Admin">
    <h1 className="flex items-center justify-center text-3xl font-bold text-gray-800 mb-4">
      QUẢN LÝ DOANH THU
    </h1>
    <FormRevenueAdmin />
  </PrivateRoute>
);

export default RevenueManagementPage;
