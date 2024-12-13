import PrivateRoute from "@/components/private/PrivateRoute";
import FormServiceDateAdmin from "@/components/form/service_date/FormServiceDateAdmin";

const ServiceDatesPageAdmin = () => (
  <PrivateRoute requireRole="ROLE_Admin">
    <h1 className="flex items-center justify-center text-3xl font-bold text-gray-800 mb-4">
      SERVICE DATES MANAGEMENT
    </h1>
    <FormServiceDateAdmin />
  </PrivateRoute>
);

export default ServiceDatesPageAdmin;
