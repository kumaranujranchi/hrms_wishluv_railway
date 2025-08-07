import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Attendance from "@/pages/attendance";
import LeaveManagement from "@/pages/leave-management";
import Expenses from "@/pages/expenses";
import EmployeeDirectory from "@/pages/employee-directory";
import AdminCreateEmployee from "@/pages/admin-create-employee";
import AdminDepartments from "@/pages/admin-departments";
import AdminDesignations from "@/pages/admin-designations";
import AdminAttendance from "@/pages/admin-attendance";
import AdminPayroll from "@/pages/admin-payroll";
import Payroll from "@/pages/payroll";
import Reports from "@/pages/reports";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading ? (
        <Route path="/">
          <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </Route>
      ) : !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/attendance" component={Attendance} />
          <Route path="/leave-management" component={LeaveManagement} />
          <Route path="/expenses" component={Expenses} />
          <Route path="/employee-directory" component={EmployeeDirectory} />
          <Route path="/admin/create-employee" component={AdminCreateEmployee} />
          <Route path="/admin/departments" component={AdminDepartments} />
          <Route path="/admin/designations" component={AdminDesignations} />
          <Route path="/admin/attendance" component={AdminAttendance} />
          <Route path="/admin/payroll" component={AdminPayroll} />
          <Route path="/payroll" component={Payroll} />
          <Route path="/reports" component={Reports} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
