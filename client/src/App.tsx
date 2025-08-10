import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import AdminDashboard from "@/pages/admin-dashboard";
import EmployeeDashboard from "@/pages/employee-dashboard";
import Attendance from "@/pages/attendance";
import LeaveManagement from "@/pages/leave-management";
import Expenses from "@/pages/expenses";
import EmployeeDirectory from "@/pages/employee-directory";
import AdminCreateEmployee from "@/pages/admin-create-employee";
import AdminDepartments from "@/pages/admin-departments";
import AdminDesignations from "@/pages/admin-designations";
import AdminAttendance from "@/pages/admin-attendance";
import AdminPayroll from "@/pages/admin-payroll";
import AdminLeaveManagement from "@/pages/admin-leave-management";
import Payroll from "@/pages/payroll";
import Reports from "@/pages/reports";
import Onboarding from "@/pages/onboarding";
import Settings from "@/pages/settings";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Not authenticated - show login/register pages
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Authenticated - role-based routing
  return (
    <Switch>
      {/* Root redirect based on user role */}
      <Route path="/">
        {user?.role === 'admin' ? <Redirect to="/admin" /> : <Redirect to="/employee" />}
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/create-employee">
        <ProtectedRoute requiredRole="admin">
          <AdminCreateEmployee />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/departments">
        <ProtectedRoute requiredRole="admin">
          <AdminDepartments />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/designations">
        <ProtectedRoute requiredRole="admin">
          <AdminDesignations />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/attendance">
        <ProtectedRoute requiredRole="admin">
          <AdminAttendance />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/payroll">
        <ProtectedRoute requiredRole="admin">
          <AdminPayroll />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/leave-management">
        <ProtectedRoute requiredRole="admin">
          <AdminLeaveManagement />
        </ProtectedRoute>
      </Route>

      {/* Employee Routes */}
      <Route path="/employee" component={EmployeeDashboard} />
      <Route path="/attendance">
        <ProtectedRoute requiredRole="employee">
          <Attendance />
        </ProtectedRoute>
      </Route>
      <Route path="/leave-management">
        <ProtectedRoute requiredRole="employee">
          <LeaveManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/payroll">
        <ProtectedRoute requiredRole="employee">
          <Payroll />
        </ProtectedRoute>
      </Route>
      <Route path="/onboarding">
        <ProtectedRoute requiredRole="employee">
          <Onboarding />
        </ProtectedRoute>
      </Route>

      {/* Shared Routes (accessible by both admin and employee) */}
      <Route path="/expenses" component={Expenses} />
      <Route path="/employee-directory" component={EmployeeDirectory} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />

      {/* 404 */}
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
