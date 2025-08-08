import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  UserCheck,
  FileText,
  BarChart3,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: () => fetch('/api/dashboard/stats').then(res => res.json())
  });

  const { data: announcements } = useQuery({
    queryKey: ['/api/announcements'],
    queryFn: () => fetch('/api/announcements').then(res => res.json())
  });

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout>
        <div className="space-y-6">
          {/* Overview Section */}
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Overview</h2>
              <p className="text-gray-400 text-sm">Key metrics and statistics for your organization</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Today's Attendance */}
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="metric-label">Today's Attendance</p>
                    <p className="metric-value">{stats?.attendanceRate || '0.00%'}</p>
                    <p className="text-xs text-gray-400 mt-1">↑ +1.2% from yesterday</p>
                  </div>
                  <div className="metric-icon blue">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Pending Approvals */}
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="metric-label">Pending Approvals</p>
                    <p className="metric-value">{stats?.pendingApprovals || '0'}</p>
                    <p className="text-xs text-yellow-400 mt-1">● Needs attention</p>
                  </div>
                  <div className="metric-icon yellow">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Monthly Payroll */}
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="metric-label">Monthly Payroll</p>
                    <p className="metric-value">$847K</p>
                    <p className="text-xs text-gray-400 mt-1">● Processing in 3 days</p>
                  </div>
                  <div className="metric-icon green">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Active Employees */}
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="metric-label">Active Employees</p>
                    <p className="metric-value">{stats?.totalEmployees || '1'}</p>
                    <p className="text-xs text-gray-400 mt-1">↑ +1 new this month</p>
                  </div>
                  <div className="metric-icon purple">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Activities */}
              <section className="dashboard-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Recent Activities</h3>
                  <button className="text-blue-400 text-sm hover:text-blue-300">View All</button>
                </div>
                <div className="space-y-3">
                  <div className="activity-item">
                    <div className="activity-avatar green">
                      <UserCheck className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">Sarah Johnson submitted leave request</p>
                      <p className="text-gray-400 text-xs">4 hours ago</p>
                    </div>
                    <span className="badge-success">Pending</span>
                  </div>
                  <div className="activity-item">
                    <div className="activity-avatar blue">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">Mark Davis checked claim approved</p>
                      <p className="text-gray-400 text-xs">6 hours ago</p>
                    </div>
                    <span className="badge-primary">Approved</span>
                  </div>
                </div>
              </section>

              {/* Attendance Overview */}
              <section className="dashboard-card">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Attendance Overview</h3>
                    <div className="flex items-center space-x-4 text-sm">
                      <button className="text-blue-400 hover:text-blue-300">Live</button>
                      <button className="text-gray-400 hover:text-white">1hr</button>
                      <button className="text-gray-400 hover:text-white">This Week</button>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Average Attendance</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-2xl font-bold text-white">87.2%</p>
                        <span className="text-green-400 text-sm">↗ +3.2% from last week</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">On Time Arrivals</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-2xl font-bold text-white">94.1%</p>
                        <span className="text-green-400 text-sm">↗ +1.3% improvement</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Late Arrivals</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-2xl font-bold text-white">12</p>
                        <span className="text-yellow-400 text-sm">This week</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chart placeholder */}
                  <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Attendance chart visualization</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <section className="dashboard-card">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="quick-action-btn">
                    <div className="flex items-center">
                      <UserCheck className="w-5 h-5 text-blue-400 mr-3" />
                      <span className="text-white text-sm">Attendance Management</span>
                    </div>
                  </button>
                  <button className="quick-action-btn">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-green-400 mr-3" />
                      <span className="text-white text-sm">Create Employee</span>
                    </div>
                  </button>
                  <button className="quick-action-btn">
                    <div className="flex items-center">
                      <DollarSign className="w-5 h-5 text-purple-400 mr-3" />
                      <span className="text-white text-sm">Payroll Management</span>
                    </div>
                  </button>
                  <button className="quick-action-btn">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-yellow-400 mr-3" />
                      <span className="text-white text-sm">Leave Management</span>
                    </div>
                  </button>
                  <button className="quick-action-btn">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-blue-400 mr-3" />
                      <span className="text-white text-sm">Employee Directory</span>
                    </div>
                  </button>
                </div>
              </section>

              {/* Announcements */}
              <section className="dashboard-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Announcements</h3>
                  <button className="text-blue-400 text-sm hover:text-blue-300">View All</button>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-white text-sm font-medium">New policy update available</p>
                    <p className="text-gray-400 text-xs mt-1">2 days ago</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-white text-sm font-medium">Team meeting scheduled</p>
                    <p className="text-gray-400 text-xs mt-1">1 day ago</p>
                  </div>
                </div>
              </section>

              {/* Team Status */}
              <section className="dashboard-card">
                <h3 className="text-lg font-semibold text-white mb-4">Team Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">LW</span>
                      </div>
                      <span className="text-white text-sm">Lisa Wilson</span>
                    </div>
                    <span className="text-green-400 text-sm">98%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">MR</span>
                      </div>
                      <span className="text-white text-sm">Mike Rodriguez</span>
                    </div>
                    <span className="text-green-400 text-sm">96%</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}