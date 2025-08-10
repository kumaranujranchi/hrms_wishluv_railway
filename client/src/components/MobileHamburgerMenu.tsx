import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu,
  Building2,
  Briefcase,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Users2,
  FileSpreadsheet,
  UserPlus,
  Calendar,
  DollarSign
} from "lucide-react";

export default function MobileHamburgerMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const getMenuItems = () => {
    if (user?.role === 'admin') {
      return [
        { icon: UserPlus, label: "Create Employee", href: "/admin/create-employee" },
        { icon: Calendar, label: "Leave Requests", href: "/admin/leave-requests" },
        { icon: CreditCard, label: "Expense Claims", href: "/admin/expense-claims" },
        { icon: DollarSign, label: "Payroll", href: "/admin/payroll" },
        { icon: Users2, label: "Leave Assignments", href: "/admin/leave-assignments" },
        { icon: Building2, label: "Departments", href: "/admin/departments" },
        { icon: Briefcase, label: "Designations", href: "/admin/designations" },
        { icon: Bell, label: "Announcements", href: "/admin/announcements" },
        { icon: Settings, label: "Company Settings", href: "/admin/settings" }
      ];
    } else {
      return [
        { icon: FileSpreadsheet, label: "Payroll", href: "/payroll" },
        { icon: Bell, label: "Announcements", href: "/announcements" }
      ];
    }
  };

  const menuItems = getMenuItems();

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <Menu size={24} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="p-6 pb-4 bg-primary-50 dark:bg-primary-900/20">
            <SheetTitle className="text-left">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
            </SheetTitle>
          </SheetHeader>
          
          <div className="px-6 py-4 space-y-1">
            {menuItems.map(({ icon: Icon, label, href }) => (
              <Link key={href} href={href}>
                <div
                  onClick={handleLinkClick}
                  className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <Icon size={20} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-gray-100 font-medium">{label}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center space-x-2"
              onClick={async () => {
                try {
                  await logout();
                  setIsOpen(false);
                } catch (error) {
                  console.error('Logout failed:', error);
                  setIsOpen(false);
                }
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}