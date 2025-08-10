import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import AttendanceCard from "@/components/AttendanceCard";
import { useAuth } from "@/hooks/useAuth";

export default function EmployeeDashboardPage() {
  const { user } = useAuth();

  // Show loading while user data is being fetched
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect admin users to admin dashboard
  if (user.role === 'admin') {
    window.location.href = '/admin';
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Employee-specific welcome message */}
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Employee Portal
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300">
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
  );
}