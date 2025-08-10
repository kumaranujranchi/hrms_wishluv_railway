import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout>
        <div className="space-y-6">
          {/* Admin-specific welcome message */}
          <div className="bg-white p-6 rounded-lg border border-neutral-200">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-neutral-600">
              Welcome to the admin portal. Manage your organization from here.
            </p>
          </div>
          
          {/* Main dashboard content */}
          <Dashboard />


        </div>
      </Layout>
    </ProtectedRoute>
  );
}