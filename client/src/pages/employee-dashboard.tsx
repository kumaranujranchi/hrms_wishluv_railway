import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import AttendanceCard from "@/components/AttendanceCard";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function EmployeeDashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredRole="employee">
      <Layout>
        <div className="space-y-6">
          {/* Employee-specific welcome message */}
          <div className="bg-white p-6 rounded-lg border border-neutral-200">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Employee Portal
            </h1>
            <p className="text-neutral-600">
              Welcome back, {user?.firstName}! Manage your work activities from here.
            </p>
          </div>

          {/* Today's attendance quick action for mobile */}
          <div className="lg:hidden">
            <AttendanceCard />
          </div>
          
          {/* Main dashboard content */}
          <Dashboard />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}