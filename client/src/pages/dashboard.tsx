import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import AttendanceCard from "@/components/AttendanceCard";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Today's attendance quick action - only for employees */}
        {user?.role !== 'admin' && (
          <div className="lg:hidden">
            <AttendanceCard />
          </div>
        )}
        
        {/* Main dashboard content */}
        <Dashboard />


      </div>
    </Layout>
  );
}
