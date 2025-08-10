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
  ChevronRight,
  Activity,
  Target,
  Award,
  Zap,
  XCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { motion } from "framer-motion";

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

// Animation variants for staggered animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    rotateX: -15
  },
  visible: { 
    opacity: 1, 
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

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
      color: "gradient-card-primary",
      description: "Monitor employee attendance"
    },
    {
      title: "Create Employee",
      href: "/admin/create-employee",
      icon: Users,
      color: "gradient-card-success",
      description: "Add new team members"
    },
    {
      title: "Payroll Management",
      href: "/admin/payroll",
      icon: Receipt,
      color: "gradient-card-warning",
      description: "Process monthly payroll"
    },
    {
      title: "Leave Management",
      href: "/admin/leave-management",
      icon: Calendar,
      color: "gradient-card-accent",
      description: "Approve leave requests"
    },
  ] : [
    {
      title: "Mark Attendance",
      href: "/attendance",
      icon: Clock,
      color: "gradient-card-primary",
      description: "Check in/out for the day"
    },
    {
      title: "Request Leave",
      href: "/leave-management",
      icon: Calendar,
      color: "gradient-card-success",
      description: "Submit leave application"
    },
    {
      title: "Submit Expense",
      href: "/expenses",
      icon: Receipt,
      color: "gradient-card-warning",
      description: "Claim your expenses"
    },
    {
      title: "View Payroll",
      href: "/payroll",
      icon: DollarSign,
      color: "gradient-card-accent",
      description: "Check your salary details"
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'leave':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'expense':
        return <Receipt className="h-4 w-4 text-orange-500" />;
      case 'attendance':
        return <Clock className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Section with Gradient Background */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-6 text-white shadow-xl"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Welcome back, {user?.firstName}! 👋
              </h1>
              <p className="text-green-100">
                {user?.role === 'admin' 
                  ? "Manage your team and organization efficiently"
                  : "Track your work and stay productive"
                }
              </p>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="hidden lg:block"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Floating elements */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-4 right-4 w-3 h-3 bg-white/30 rounded-full"
        />
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-4 left-4 w-2 h-2 bg-white/20 rounded-full"
        />
      </motion.div>

      {/* Stats Cards */}
      {user?.role === 'admin' && (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            {
              title: "Total Employees",
              value: stats?.totalEmployees || 0,
              icon: Users,
              color: "from-blue-500 to-blue-600",
              bgColor: "bg-blue-500/10"
            },
            {
              title: "Attendance Rate",
              value: `${stats?.attendanceRate || 0}%`,
              icon: Target,
              color: "from-green-500 to-green-600",
              bgColor: "bg-green-500/10"
            },
            {
              title: "Pending Approvals",
              value: stats?.pendingApprovals || 0,
              icon: Bell,
              color: "from-orange-500 to-orange-600",
              bgColor: "bg-orange-500/10"
            },
            {
              title: "Monthly Payroll",
              value: `$${(stats?.monthlyPayroll || 0).toLocaleString()}`,
              icon: DollarSign,
              color: "from-purple-500 to-purple-600",
              bgColor: "bg-purple-500/10"
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              variants={cardVariants}
              whileHover="hover"
              className="group"
            >
              <Card className="stat-card overflow-hidden h-full">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between flex-grow">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold gradient-text-primary">
                        {stat.value}
                      </p>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} ${stat.bgColor} flex-shrink-0`}
                    >
                      <stat.icon className="h-6 w-6 text-white" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-semibold mb-4 gradient-text-primary">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              variants={cardVariants}
              whileHover="hover"
              className="group"
            >
              <Link href={action.href}>
                <Card className={`${action.color} text-white cursor-pointer transition-all duration-300 hover:shadow-xl h-full`}>
                  <CardContent className="p-6 text-center flex flex-col h-full">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="mb-4 flex justify-center"
                    >
                      <div className="p-3 bg-white/20 rounded-xl">
                        <action.icon className="h-8 w-8" />
                      </div>
                    </motion.div>
                    <h3 className="font-semibold mb-2 flex-shrink-0">{action.title}</h3>
                    <p className="text-sm opacity-90 flex-grow">{action.description}</p>
                    <motion.div
                      initial={{ x: 0 }}
                      whileHover={{ x: 5 }}
                      className="mt-3 flex justify-center flex-shrink-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activities and Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <motion.div variants={itemVariants}>
          <Card className="stat-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 shimmer rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 shimmer rounded w-3/4"></div>
                        <div className="h-3 shimmer rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivities?.length ? (
                <div className="space-y-4">
                  {recentActivities.slice(0, 5).map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(activity.status)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No recent activities
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Announcements */}
        <motion.div variants={itemVariants}>
          <Card className="stat-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {announcementsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 shimmer rounded w-2/3"></div>
                      <div className="h-3 shimmer rounded w-full"></div>
                      <div className="h-3 shimmer rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : announcements?.length ? (
                <div className="space-y-4">
                  {announcements.slice(0, 3).map((announcement, index) => (
                    <motion.div
                      key={announcement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg border border-border hover:border-primary/20 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{announcement.title}</h4>
                        <Badge 
                          variant={announcement.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {announcement.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          By {announcement.author.firstName} {announcement.author.lastName}
                        </span>
                        <span>
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No announcements
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Insights for Employees */}
      {user?.role !== 'admin' && (
        <motion.div variants={itemVariants}>
          <Card className="stat-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Your Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">Attendance</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {stats?.attendanceRate || 95}%
                  </p>
                  <p className="text-sm text-muted-foreground">This month</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">Leave Balance</h3>
                  <p className="text-2xl font-bold text-blue-600">12</p>
                  <p className="text-sm text-muted-foreground">Days remaining</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">This Month</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    ${(stats?.monthlyPayroll || 5000).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Net salary</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
