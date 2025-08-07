import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Attendance from "@/pages/attendance";
import LeaveManagement from "@/pages/leave-management";
import Expenses from "@/pages/expenses";
import EmployeeDirectory from "@/pages/employee-directory";
import Onboarding from "@/pages/onboarding";
import Payroll from "@/pages/payroll";
import Reports from "@/pages/reports";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/attendance" component={Attendance} />
          <Route path="/leave-management" component={LeaveManagement} />
          <Route path="/expenses" component={Expenses} />
          <Route path="/employees" component={EmployeeDirectory} />
          <Route path="/onboarding" component={Onboarding} />
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
