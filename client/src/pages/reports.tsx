import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Users, 
  Clock, 
  DollarSign,
  TrendingUp,
  FileText,
  Filter,
  RefreshCw
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface AttendanceReport {
  totalEmployees: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendanceRate: number;
}

interface LeaveReport {
  totalRequests: number;
  approvedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  averageLeaveDays: number;
}

interface ExpenseReport {
  totalClaims: number;
  totalAmount: number;
  approvedAmount: number;
  pendingAmount: number;
  averageClaimAmount: number;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  // Mock data queries - in real app these would fetch from backend
  const { data: attendanceReport, isLoading: attendanceLoading } = useQuery<AttendanceReport>({
    queryKey: ["/api/reports/attendance", startDate, endDate],
    queryFn: () => Promise.resolve({
      totalEmployees: 284,
      presentCount: 268,
      lateCount: 12,
      absentCount: 4,
      attendanceRate: 94.4
    }),
  });

  const { data: leaveReport, isLoading: leaveLoading } = useQuery<LeaveReport>({
    queryKey: ["/api/reports/leaves", startDate, endDate],
    queryFn: () => Promise.resolve({
      totalRequests: 42,
      approvedRequests: 35,
      pendingRequests: 5,
      rejectedRequests: 2,
      averageLeaveDays: 3.2
    }),
  });

  const { data: expenseReport, isLoading: expenseLoading } = useQuery<ExpenseReport>({
    queryKey: ["/api/reports/expenses", startDate, endDate],
    queryFn: () => Promise.resolve({
      totalClaims: 156,
      totalAmount: 45280,
      approvedAmount: 38750,
      pendingAmount: 4830,
      averageClaimAmount: 290.26
    }),
  });

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const now = new Date();
    
    switch (period) {
      case "current_month":
        setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case "last_month":
        const lastMonth = subMonths(now, 1);
        setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
        break;
      case "last_3_months":
        setStartDate(format(subMonths(now, 3), 'yyyy-MM-dd'));
        setEndDate(format(now, 'yyyy-MM-dd'));
        break;
      case "custom":
        // Keep current dates for custom selection
        break;
    }
  };

  const handleExportReport = (reportType: string) => {
    // In a real app, this would generate and download a CSV/PDF report
    console.log(`Exporting ${reportType} report for ${startDate} to ${endDate}`);
  };

  // Only allow access for admin and manager roles
  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">Access Restricted</h2>
                <p className="text-sm text-neutral-600">
                  Only administrators and managers can access reports.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Report Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Reports & Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="period">Time Period</Label>
                <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_month">Current Month</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedPeriod === "custom" && (
                <>
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <div className="flex items-end">
                <Button className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Tabs */}
        <Tabs defaultValue="attendance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="leaves">Leave Management</TabsTrigger>
            <TabsTrigger value="expenses">Expense Claims</TabsTrigger>
          </TabsList>

          {/* Attendance Reports */}
          <TabsContent value="attendance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Total Employees</p>
                      <p className="text-2xl font-bold text-neutral-900">
                        {attendanceReport?.totalEmployees || 0}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-primary-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Present</p>
                      <p className="text-2xl font-bold text-success-600">
                        {attendanceReport?.presentCount || 0}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-success-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Late Arrivals</p>
                      <p className="text-2xl font-bold text-warning-600">
                        {attendanceReport?.lateCount || 0}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-warning-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Attendance Rate</p>
                      <p className="text-2xl font-bold text-primary-600">
                        {attendanceReport?.attendanceRate || 0}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Attendance Analytics</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportReport('attendance')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
                    <p className="text-neutral-600">Attendance Chart</p>
                    <p className="text-sm text-neutral-500">
                      Integration with Chart.js for attendance trends
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave Reports */}
          <TabsContent value="leaves" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Total Requests</p>
                      <p className="text-2xl font-bold text-neutral-900">
                        {leaveReport?.totalRequests || 0}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-primary-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Approved</p>
                      <p className="text-2xl font-bold text-success-600">
                        {leaveReport?.approvedRequests || 0}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-success-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Pending</p>
                      <p className="text-2xl font-bold text-warning-600">
                        {leaveReport?.pendingRequests || 0}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-warning-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Avg. Leave Days</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {leaveReport?.averageLeaveDays || 0}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Leave Management Analytics</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportReport('leaves')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-neutral-900">Leave Types Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-neutral-50 rounded">
                        <span className="text-sm text-neutral-600">Sick Leave</span>
                        <span className="font-medium">35%</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-neutral-50 rounded">
                        <span className="text-sm text-neutral-600">Vacation</span>
                        <span className="font-medium">45%</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-neutral-50 rounded">
                        <span className="text-sm text-neutral-600">Personal</span>
                        <span className="font-medium">20%</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-neutral-900">Monthly Trends</h4>
                    <div className="h-32 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-center">
                      <p className="text-sm text-neutral-500">Leave trends chart</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expense Reports */}
          <TabsContent value="expenses" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Total Claims</p>
                      <p className="text-2xl font-bold text-neutral-900">
                        {expenseReport?.totalClaims || 0}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-primary-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Total Amount</p>
                      <p className="text-2xl font-bold text-neutral-900">
                        ${expenseReport?.totalAmount.toLocaleString() || 0}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-neutral-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Approved Amount</p>
                      <p className="text-2xl font-bold text-success-600">
                        ${expenseReport?.approvedAmount.toLocaleString() || 0}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-success-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Avg. Claim</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${expenseReport?.averageClaimAmount.toFixed(2) || 0}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Expense Analytics</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportReport('expenses')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-neutral-900">Expense Categories</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-neutral-50 rounded">
                        <span className="text-sm text-neutral-600">Travel</span>
                        <span className="font-medium">$12,450</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-neutral-50 rounded">
                        <span className="text-sm text-neutral-600">Meals</span>
                        <span className="font-medium">$8,920</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-neutral-50 rounded">
                        <span className="text-sm text-neutral-600">Office Supplies</span>
                        <span className="font-medium">$5,630</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-neutral-50 rounded">
                        <span className="text-sm text-neutral-600">Training</span>
                        <span className="font-medium">$3,280</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-neutral-900">Approval Rate</h4>
                    <div className="h-32 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-success-600">85.6%</p>
                        <p className="text-sm text-neutral-500">Average approval rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
