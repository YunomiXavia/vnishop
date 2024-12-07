import PrivateRoute from "@/components/private/PrivateRoute";

const AdminDashboardPage = () => {
return (
        <PrivateRoute requireRole="ROLE_Admin">
            <h1 className="flex items-center justify-center text-3xl font-bold text-gray-800 mb-4">
                ADMIN DASHBOARD
            </h1>
        </PrivateRoute>
    );
}

export default AdminDashboardPage;
