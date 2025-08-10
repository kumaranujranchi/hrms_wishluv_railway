import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, 
  Clock, 
  Calendar, 
  DollarSign, 
  Users, 
  BarChart3,
  FileText,
  User
} from "lucide-react";

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Define navigation items based on user role
  const getNavItems = () => {
    if (user?.role === 'admin') {
      return [
        { icon: Home, label: "Dashboard", href: "/" },
        { icon: Users, label: "Directory", href: "/employee-directory" },
        { icon: Clock, label: "Attendance", href: "/admin/attendance" },
        { icon: BarChart3, label: "Reports", href: "/reports" },
        { icon: User, label: "Profile", href: "/settings" }
      ];
    } else {
      return [
        { icon: Home, label: "Dashboard", href: "/" },
        { icon: Clock, label: "Attendance", href: "/attendance" },
        { icon: Calendar, label: "Leave", href: "/leave-management" },
        { icon: FileText, label: "Expenses", href: "/expenses" },
        { icon: User, label: "Profile", href: "/settings" }
      ];
    }
  };

  const navItems = getNavItems();

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/" || location === "/admin" || location === "/employee" || location === "/dashboard";
    }
    return location === href || location.startsWith(href + "/");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden">
      <div className="flex items-center justify-evenly px-1 py-2 max-w-full">
        {navItems.map(({ icon: Icon, label, href }) => (
          <Link key={href} href={href}>
            <div className={`flex flex-col items-center px-2 py-2 rounded-lg transition-colors min-w-0 flex-1 ${
              isActive(href)
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}>
              <Icon size={18} />
              <span className="text-xs mt-1 font-medium truncate max-w-full">{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}