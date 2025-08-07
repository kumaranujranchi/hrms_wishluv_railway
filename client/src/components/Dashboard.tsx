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

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: announcements, isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
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
      title: "Departments",
      href: "/admin/departments",
      icon: Receipt,
      color: "text-warning-600 bg-warning-50",
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
                <p className="text-sm text-success-600 mt-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +2.3% from yesterday
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
                <p className="text-2xl font-bold text-neutral-900 mt-2">$847K</p>
                <p className="text-sm text-primary-600 mt-2 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Processing in 3 days
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
                <p className="text-sm text-success-600 mt-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  3 new this month
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
                {/* Sample activity items - in real app these would come from API */}
                <div className="flex items-start space-x-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <Users className="text-primary-600 h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900">
                      <span className="font-medium">Sarah Johnson</span> submitted leave request
                    </p>
                    <p className="text-xs text-neutral-600 mt-1">2 hours ago</p>
                  </div>
                  <Badge className="badge-warning">Pending</Badge>
                </div>

                <div className="flex items-start space-x-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-success-600 h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900">
                      <span className="font-medium">Mark Davis</span> expense claim approved
                    </p>
                    <p className="text-xs text-neutral-600 mt-1">4 hours ago</p>
                  </div>
                  <Badge className="badge-success">Approved</Badge>
                </div>
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
              <CardTitle>Team Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Sample team members - in real app these would come from API */}
                <div className="flex items-center justify-between p-2 hover:bg-neutral-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>LW</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Lisa Wilson</p>
                      <p className="text-xs text-neutral-600">Designer</p>
                    </div>
                  </div>
                  <span className="w-3 h-3 bg-success-500 rounded-full"></span>
                </div>
                
                <div className="flex items-center justify-between p-2 hover:bg-neutral-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>MR</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Mike Rodriguez</p>
                      <p className="text-xs text-neutral-600">Developer</p>
                    </div>
                  </div>
                  <span className="w-3 h-3 bg-warning-500 rounded-full"></span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Team Attendance</span>
                  <span className="font-medium text-neutral-900">92%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
