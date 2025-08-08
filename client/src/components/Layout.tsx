import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Bell, 
  LayoutDashboard, 
  Clock, 
  Calendar, 
  Receipt, 
  DollarSign, 
  Users, 
  UserPlus, 
  BarChart3, 
  Settings,
  LogOut,
  Building,
  Briefcase
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const navigation = [
    { 
      name: "Dashboard", 
      href: user?.role === 'admin' ? "/admin" : "/employee", 
      icon: LayoutDashboard, 
      current: (user?.role === 'admin' && location === "/admin") || (user?.role !== 'admin' && location === "/employee")
    },
    ...(user?.role === 'admin' ? [
      {
        name: "Attendance Management", 
        href: "/admin/attendance", 
        icon: Clock, 
        current: location === "/admin/attendance" 
      },
      {
        name: "Leave Management", 
        href: "/admin/leave-management", 
        icon: Calendar, 
        current: location === "/admin/leave-management" 
      },
      {
        name: "Payroll Management", 
        href: "/admin/payroll", 
        icon: DollarSign,
        current: location === "/admin/payroll" 
      },
      { 
        name: "Departments", 
        href: "/admin/departments", 
        icon: Building,
        current: location === "/admin/departments"
      },
      { 
        name: "Designations", 
        href: "/admin/designations", 
        icon: Briefcase,
        current: location === "/admin/designations"
      },
      {
        name: "Create Employee",
        href: "/admin/create-employee",
        icon: UserPlus,
        current: location === "/admin/create-employee"
      }
    ] : [
      {
        name: "Attendance", 
        href: "/attendance", 
        icon: Clock, 
        current: location === "/attendance" 
      },
      {
        name: "Leave Management", 
        href: "/leave-management", 
        icon: Calendar, 
        current: location === "/leave-management" 
      },
      {
        name: "Payroll", 
        href: "/payroll", 
        icon: DollarSign,
        current: location === "/payroll" 
      }
    ]),
    { 
      name: "Expenses", 
      href: "/expenses", 
      icon: Receipt, 
      current: location === "/expenses" 
    },
    { 
      name: "Employee Directory", 
      href: "/employee-directory", 
      icon: Users,
      current: location === "/employee-directory" 
    }
  ];

  const managementNavigation = [
    { 
      name: "Reports", 
      href: "/reports", 
      icon: BarChart3,
      current: location === "/reports" 
    },
    { 
      name: "Settings", 
      href: "/settings", 
      icon: Settings,
      current: location === "/settings" 
    },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {/* Sidebar */}
      <aside className="w-64 flex flex-col" style={{ backgroundColor: 'hsl(var(--sidebar-bg))' }}>
        {/* Logo and Company */}
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--primary))' }}>
              <img src="https://imagizer.imageshack.com/img924/9256/E2qQnT.png" alt="Company Logo" className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm">Wishluv Buildcon</h1>
              <p className="text-gray-400 text-xs">Welcome back.</p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="px-6 pb-6">
          <div className="bg-card rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user?.profileImageUrl || "https://imagizer.imageshack.com/img924/9256/E2qQnT.png"} alt="Profile" />
                <AvatarFallback className="bg-primary text-white font-medium">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-400 text-xs truncate capitalize">
                  {user?.role === 'admin' ? 'Admin Dashboard' : 'Employee'}
                </p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`sidebar-item ${item.current ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
          
          <div className="pt-6">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-4 pb-3">
              Management
            </div>
            {managementNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`sidebar-item ${item.current ? 'active' : ''}`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-6">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full text-gray-400 border-gray-700 hover:bg-gray-800 hover:text-white bg-transparent"
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.reload();
              } catch (error) {
                console.error('Logout failed:', error);
              }
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="px-6 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
              </h1>
              <p className="text-gray-400 text-sm">
                {user?.role === 'admin' 
                  ? 'Welcome to the admin portal. Manage your organization from here.'
                  : `Welcome back, ${user?.firstName}! Here's what's happening today.`
                }
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 bg-card border-border text-white placeholder-gray-400"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
              </div>
              
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative text-gray-400 hover:text-white">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                  3
                </span>
              </Button>

              {/* Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-white text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-gray-400 text-xs capitalize">{user?.role}</p>
                </div>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.profileImageUrl || "https://imagizer.imageshack.com/img924/9256/E2qQnT.png"} alt="Profile" />
                  <AvatarFallback className="bg-primary text-white text-xs">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}