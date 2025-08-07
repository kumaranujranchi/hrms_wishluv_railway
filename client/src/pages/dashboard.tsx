import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import AttendanceCard from "@/components/AttendanceCard";
import AIInsights from "@/components/AIInsights";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Today's attendance quick action */}
        <div className="lg:hidden">
          <AttendanceCard />
        </div>
        
        {/* Main dashboard content */}
        <Dashboard />

        {/* AI Insights for managers and admins */}
        {user?.role && ['admin', 'manager'].includes(user.role) && (
          <AIInsights userId={user.id} userRole={user.role} />
        )}
      </div>
    </Layout>
  );
}
