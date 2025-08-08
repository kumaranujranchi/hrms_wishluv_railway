import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useQuery } from "@tanstack/react-query";
import { 
  Clock, 
  Calendar,
  DollarSign, 
  Receipt,
  CheckCircle,
  XCircle,
  Play,
  Square,
  TrendingUp,
  FileText,
  AlertCircle
} from "lucide-react";

export default function EmployeeDashboardPage() {
  const { user } = useAuth();

  // Fetch employee-specific data
  const { data: attendanceData } = useQuery({
    queryKey: ['/api/attendance/my'],
    queryFn: () => fetch('/api/attendance/my').then(res => res.json())
  });

  const { data: leaveData } = useQuery({
    queryKey: ['/api/leave/my'],
    queryFn: () => fetch('/api/leave/my').then(res => res.json())
  });

  const { data: announcements } = useQuery({
    queryKey: ['/api/announcements'],
    queryFn: () => fetch('/api/announcements').then(res => res.json())
  });

  return (
    <ProtectedRoute requiredRole="employee">
      <Layout>
        <div className="space-y-6">
          {/* Overview Section */}
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Overview</h2>
              <p className="text-gray-400 text-sm">Your work summary and quick actions</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Today's Status */}
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="metric-label">Today's Status</p>
                    <p className="metric-value">Present</p>
                    <p className="text-xs text-green-400 mt-1">● Checked in at 9:15 AM</p>
                  </div>
                  <div className="metric-icon green">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Leave Balance */}
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="metric-label">Leave Balance</p>
                    <p className="metric-value">12</p>
                    <p className="text-xs text-gray-400 mt-1">Days remaining this year</p>
                  </div>
                  <div className="metric-icon blue">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* This Month Salary */}
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="metric-label">This Month Salary</p>
                    <p className="metric-value">$4,500</p>
                    <p className="text-xs text-gray-400 mt-1">Processing on 28th</p>
                  </div>
                  <div className="metric-icon green">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Pending Expenses */}
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="metric-label">Pending Expenses</p>
                    <p className="metric-value">2</p>
                    <p className="text-xs text-yellow-400 mt-1">● Awaiting approval</p>
                  </div>
                  <div className="metric-icon yellow">
                    <Receipt className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Attendance Card - Quick Check In/Out */}
              <section className="dashboard-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Today's Attendance</h3>
                  <span className="badge-success">On Time</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Check In</p>
                    <p className="text-white text-lg font-semibold">9:15 AM</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Check Out</p>
                    <p className="text-gray-400 text-lg">Not yet</p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                    <Play className="w-4 h-4" />
                    <span>Check In</span>
                  </button>
                  <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                    <Square className="w-4 h-4" />
                    <span>Check Out</span>
                  </button>
                </div>
              </section>

              {/* Recent Activities */}
              <section className="dashboard-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Recent Activities</h3>
                  <button className="text-blue-400 text-sm hover:text-blue-300">View All</button>
                </div>
                <div className="space-y-3">
                  <div className="activity-item">
                    <div className="activity-avatar green">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">Leave request approved</p>
                      <p className="text-gray-400 text-xs">Yesterday, 2:30 PM</p>
                    </div>
                    <span className="badge-success">Approved</span>
                  </div>
                  <div className="activity-item">
                    <div className="activity-avatar blue">
                      <Receipt className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">Expense claim submitted</p>
                      <p className="text-gray-400 text-xs">2 days ago, 11:45 AM</p>
                    </div>
                    <span className="badge-warning">Pending</span>
                  </div>
                  <div className="activity-item">
                    <div className="activity-avatar green">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">Checked in on time</p>
                      <p className="text-gray-400 text-xs">3 days ago, 9:00 AM</p>
                    </div>
                    <span className="badge-success">On Time</span>
                  </div>
                </div>
              </section>

              {/* Attendance Overview */}
              <section className="dashboard-card">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Your Attendance This Month</h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Days Present</p>
                      <p className="text-2xl font-bold text-white">22</p>
                      <span className="text-green-400 text-sm">Out of 24 working days</span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">On Time Rate</p>
                      <p className="text-2xl font-bold text-white">95%</p>
                      <span className="text-green-400 text-sm">Excellent performance</span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Late Arrivals</p>
                      <p className="text-2xl font-bold text-white">1</p>
                      <span className="text-yellow-400 text-sm">This month</span>
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
                      <Calendar className="w-5 h-5 text-blue-400 mr-3" />
                      <span className="text-white text-sm">Apply for Leave</span>
                    </div>
                  </button>
                  <button className="quick-action-btn">
                    <div className="flex items-center">
                      <Receipt className="w-5 h-5 text-green-400 mr-3" />
                      <span className="text-white text-sm">Submit Expense</span>
                    </div>
                  </button>
                  <button className="quick-action-btn">
                    <div className="flex items-center">
                      <DollarSign className="w-5 h-5 text-purple-400 mr-3" />
                      <span className="text-white text-sm">View Payroll</span>
                    </div>
                  </button>
                  <button className="quick-action-btn">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-yellow-400 mr-3" />
                      <span className="text-white text-sm">Download Reports</span>
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
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white text-sm font-medium">New policy update available</p>
                        <p className="text-gray-400 text-xs mt-1">Please review the updated leave policy. Effective from next month.</p>
                        <p className="text-gray-500 text-xs mt-1">2 days ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white text-sm font-medium">Team meeting scheduled</p>
                        <p className="text-gray-400 text-xs mt-1">Monthly team sync meeting tomorrow at 2 PM in conference room.</p>
                        <p className="text-gray-500 text-xs mt-1">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Leave Summary */}
              <section className="dashboard-card">
                <h3 className="text-lg font-semibold text-white mb-4">Leave Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Annual Leave</span>
                    <span className="text-white text-sm font-medium">8/20 days</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Sick Leave</span>
                    <span className="text-white text-sm font-medium">2/10 days</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Personal Leave</span>
                    <span className="text-white text-sm font-medium">1/5 days</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '20%' }}></div>
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