import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Clock, 
  Calendar, 
  Receipt, 
  DollarSign, 
  TrendingUp,
  Bell,
  CheckCircle,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

interface DashboardStats {
  attendanceRate: number;
  pendingApprovals: number;
  totalEmployees: number;
  monthlyPayroll: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
  };
}

interface RecentActivity {
  id: string;
  type: 'leave' | 'expense' | 'attendance' | 'general';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: announcements, isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const { data: recentActivities, isLoading: activitiesLoading } = useQuery<RecentActivity[]>({
    queryKey: ["/api/recent-activities"],
  });

  const quickActions = user?.role === 'admin' ? [
    {
      title: "Attendance Management",
      href: "/admin/attendance",
      icon: Clock,
      color: "text-primary-600 bg-primary-50",
    },
    {
      title: "Create Employee",
      href: "/admin/create-employee",
      icon: Users,
      color: "text-success-600 bg-success-50",
    },
    {
      title: "Payroll Management",
      href: "/admin/payroll",
      icon: Receipt,
      color: "text-warning-600 bg-warning-50",
    },
    {
      title: "Leave Management",
      href: "/admin/leave-management",
      icon: Calendar,
      color: "text-info-600 bg-info-50",
    },
    {
      title: "Employee Directory",
      href: "/employee-directory",
      icon: Users,
      color: "text-neutral-600 bg-neutral-50",
    },
  ] : [
    {
      title: "Mark Attendance",
      href: "/attendance",
      icon: Clock,
      color: "text-primary-600 bg-primary-50",
    },
    {
      title: "Request Leave",
      href: "/leave-management",
      icon: Calendar,
      color: "text-success-600 bg-success-50",
    },
    {
      title: "Submit Expense",
      href: "/expenses",
      icon: Receipt,
      color: "text-warning-600 bg-warning-50",
    },
    {
      title: "Employee Directory",
      href: "/employee-directory",
      icon: Users,
      color: "text-neutral-600 bg-neutral-50",
    },
  ];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="stat-card animate-pulse">
              <div className="h-24 bg-neutral-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Today's Attendance</p>
                <p className="text-2xl font-bold text-neutral-900 mt-2">
                  {stats?.attendanceRate || 0}%
                </p>
                <p className="text-sm text-neutral-600 mt-2 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {(stats?.attendanceRate ?? 0) > 0 ? 'Today\'s rate' : 'No attendance data'}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-50 rounded-lg flex items-center justify-center">
                <Users className="text-success-500 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-neutral-900 mt-2">
                  {stats?.pendingApprovals || 0}
                </p>
                <p className="text-sm text-warning-600 mt-2 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Needs attention
                </p>
              </div>
              <div className="w-12 h-12 bg-warning-50 rounded-lg flex items-center justify-center">
                <Bell className="text-warning-500 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Monthly Payroll</p>
                <p className="text-2xl font-bold text-neutral-900 mt-2">
                  ${(stats?.monthlyPayroll ?? 0) > 0 ? ((stats?.monthlyPayroll ?? 0) / 1000).toFixed(0) + 'K' : '0'}
                </p>
                <p className="text-sm text-neutral-600 mt-2 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {(stats?.monthlyPayroll ?? 0) > 0 ? 'Ready for processing' : 'No payroll data'}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                <DollarSign className="text-primary-500 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Active Employees</p>
                <p className="text-2xl font-bold text-neutral-900 mt-2">
                  {stats?.totalEmployees || 0}
                </p>
                <p className="text-sm text-neutral-600 mt-2 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {stats?.totalEmployees ? 'Active staff' : 'No employees yet'}
                </p>
              </div>
              <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                <Users className="text-neutral-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Attendance Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Attendance Overview</CardTitle>
                <select className="border border-neutral-300 rounded-lg px-3 py-1 text-sm">
                  <option>This Week</option>
                  <option>This Month</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
                  <p className="text-neutral-600">Attendance Chart</p>
                  <p className="text-sm text-neutral-500">Integration with Chart.js</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activities</CardTitle>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activitiesLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center space-x-3 p-3">
                        <div className="w-8 h-8 bg-neutral-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                          <div className="h-3 bg-neutral-200 rounded w-1/2 mt-2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivities && recentActivities.length > 0 ? (
                  recentActivities.slice(0, 5).map((activity) => {
                    const getActivityIcon = (type: string) => {
                      switch (type) {
                        case 'leave':
                          return <Calendar className="text-primary-600 h-4 w-4" />;
                        case 'expense':
                          return <Receipt className="text-warning-600 h-4 w-4" />;
                        case 'attendance':
                          return <Clock className="text-success-600 h-4 w-4" />;
                        default:
                          return <Users className="text-neutral-600 h-4 w-4" />;
                      }
                    };

                    const getStatusBadge = (status: string) => {
                      switch (status) {
                        case 'approved':
                          return <Badge className="badge-success">Approved</Badge>;
                        case 'rejected':
                          return <Badge className="badge-error">Rejected</Badge>;
                        case 'pending':
                          return <Badge className="badge-warning">Pending</Badge>;
                        default:
                          return <Badge className="badge-info">Completed</Badge>;
                      }
                    };

                    return (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                        <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-neutral-900">
                            {activity.user && (
                              <span className="font-medium">{activity.user.firstName} {activity.user.lastName}</span>
                            )} {activity.description}
                          </p>
                          <p className="text-xs text-neutral-600 mt-1">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(activity.status)}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                    <p>No recent activities</p>
                    <p className="text-sm">Employee activities will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.title} href={action.href}>
                      <Button 
                        variant="ghost" 
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-primary-50 rounded-lg transition-colors border border-neutral-200"
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`h-5 w-5 ${action.color.split(' ')[0]}`} />
                          <span className="text-sm font-medium text-neutral-900">{action.title}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-400" />
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Announcements</CardTitle>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcementsLoading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                    <div className="h-3 bg-neutral-200 rounded w-1/2 mt-2"></div>
                  </div>
                ) : (
                  announcements?.map((announcement) => (
                    <div key={announcement.id} className="border-l-4 border-primary-500 pl-4 py-2">
                      <h4 className="text-sm font-medium text-neutral-900">{announcement.title}</h4>
                      <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{announcement.content}</p>
                      <p className="text-xs text-neutral-500 mt-2">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Status */}
          <Card>
            <CardHeader>
              <CardTitle>Team Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-neutral-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                  <p className="font-medium">No team members yet</p>
                  <p className="text-sm">Add employees to see their status here</p>
                  {user?.role === 'admin' && (
                    <Link href="/admin/create-employee">
                      <Button className="mt-4" size="sm">
                        Add Employee
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
