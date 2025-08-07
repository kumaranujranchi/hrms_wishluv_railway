import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import NotificationSystem from "./NotificationSystem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Bell, 
  User, 
  LayoutDashboard, 
  Clock, 
  Calendar, 
  Receipt, 
  DollarSign, 
  Users, 
  UserPlus, 
  BarChart3, 
  Settings,
  Building2,
  Plus,
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
    { name: "Dashboard", href: "/", icon: LayoutDashboard, current: location === "/" },
    ...(user?.role === 'admin' ? [{
      name: "Attendance Management", 
      href: "/admin/attendance", 
      icon: Clock, 
      current: location === "/admin/attendance" 
    }] : [{
      name: "Attendance", 
      href: "/attendance", 
      icon: Clock, 
      badge: "3",
      current: location === "/attendance" 
    }]),
    ...(user?.role === 'admin' ? [{
      name: "Leave Management", 
      href: "/admin/leave-management", 
      icon: Calendar, 
      current: location === "/admin/leave-management" 
    }] : [{
      name: "Leave Management", 
      href: "/leave-management", 
      icon: Calendar, 
      badge: "7",
      current: location === "/leave-management" 
    }]),
    { 
      name: "Expenses", 
      href: "/expenses", 
      icon: Receipt, 
      badge: "2",
      current: location === "/expenses" 
    },
    ...(user?.role === 'admin' ? [{
      name: "Payroll Management", 
      href: "/admin/payroll", 
      icon: DollarSign,
      current: location === "/admin/payroll" 
    }] : [{
      name: "Payroll", 
      href: "/payroll", 
      icon: DollarSign,
      current: location === "/payroll" 
    }]),
    { 
      name: "Employee Directory", 
      href: "/employee-directory", 
      icon: Users,
      current: location === "/employee-directory" 
    },
    { 
      name: "Departments", 
      href: "/admin/departments", 
      icon: Building,
      current: location === "/admin/departments",
      adminOnly: true
    },
    { 
      name: "Designations", 
      href: "/admin/designations", 
      icon: Briefcase,
      current: location === "/admin/designations",
      adminOnly: true
    },
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
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg border-r border-neutral-200 flex flex-col">
        {/* Logo and Company */}
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <Building2 className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">Synergy HRMS Pro</h1>
              <p className="text-sm text-neutral-600">HR Management</p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.profileImageUrl || ""} alt="Profile" />
              <AvatarFallback>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-neutral-600 truncate capitalize">
                {user?.role || "Employee"}
              </p>
            </div>
            <span className="w-3 h-3 bg-success-500 rounded-full"></span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            // Hide admin-only items for non-admins
            if ((item as any).adminOnly && user?.role !== 'admin') {
              return null;
            }
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`sidebar-item ${item.current ? 'active' : ''}`}
              >
                <Icon className="text-xl mr-3" />
                <span className="font-medium">{item.name}</span>
                {item.badge && (
                  <Badge className="ml-auto bg-warning-500 text-white">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
          
          <div className="space-y-1 pt-4">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide px-3 py-2">
              Management
            </p>
            {managementNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`sidebar-item ${item.current ? 'active' : ''}`}
                >
                  <Icon className="text-xl mr-3" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-neutral-200 space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary-100 text-primary-600 text-xs font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-neutral-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-neutral-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = "/";
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
        <header className="bg-white shadow-sm border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">
                {navigation.find(item => item.current)?.name || 
                 managementNavigation.find(item => item.current)?.name || 
                 "Dashboard"}
              </h1>
              <p className="text-sm text-neutral-600 mt-1">
                Welcome back, {user?.firstName}! Here's what's happening today.
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
                  className="pl-10 pr-4 py-2 w-64"
                />
                <Search className="absolute left-3 top-2.5 text-neutral-400 h-4 w-4" />
              </div>
              
              {/* Notifications */}
              {user?.id && <NotificationSystem userId={user.id} />}
              
              {/* Profile Menu with Logout */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 text-sm text-neutral-600">
                  <User className="h-4 w-4" />
                  <span>{user?.firstName} {user?.lastName}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {user?.role === 'admin' ? 'Admin' : 'Employee'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = "/";
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
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
