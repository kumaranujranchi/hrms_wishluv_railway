import Layout from "@/components/Layout";
import Dashboard from "@/components/Dashboard";
import AttendanceCard from "@/components/AttendanceCard";

export default function DashboardPage() {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Today's attendance quick action */}
        <div className="lg:hidden">
          <AttendanceCard />
        </div>
        
        {/* Main dashboard content */}
        <Dashboard />
      </div>
    </Layout>
  );
}
