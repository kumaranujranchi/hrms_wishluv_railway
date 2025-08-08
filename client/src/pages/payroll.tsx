import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  Download, 
  Calendar, 
  TrendingUp, 
  FileText,
  Calculator,
  CreditCard,
  PiggyBank
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface PayrollRecord {
  id: string;
  month: number;
  year: number;
  basicSalary: string;
  hra: string;
  bonus: string;
  deductions: string;
  netSalary: string;
  payslipUrl: string | null;
  createdAt: string;
}

export default function PayrollPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const { data: payrollRecords, isLoading } = useQuery<PayrollRecord[]>({
    queryKey: ["/api/payroll/my"],
  });

  // Filter records by selected year
  const filteredRecords = payrollRecords?.filter(record => 
    record.year === parseInt(selectedYear)
  );

  // Calculate yearly totals
  const yearlyTotals = filteredRecords?.reduce((acc, record) => ({
    basicSalary: acc.basicSalary + parseFloat(record.basicSalary),
    hra: acc.hra + parseFloat(record.hra),
    bonus: acc.bonus + parseFloat(record.bonus),
    deductions: acc.deductions + parseFloat(record.deductions),
    netSalary: acc.netSalary + parseFloat(record.netSalary),
  }), {
    basicSalary: 0,
    hra: 0,
    bonus: 0,
    deductions: 0,
    netSalary: 0,
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const availableYears = [...new Set(payrollRecords?.map(record => record.year))].sort((a, b) => b - a);

  const handleDownloadPayslip = (payslipUrl: string) => {
    if (payslipUrl) {
      window.open(payslipUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-neutral-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-neutral-200 rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Yearly Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Gross Salary</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    ${yearlyTotals?.basicSalary.toLocaleString() || '0'}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Bonus</p>
                  <p className="text-2xl font-bold text-success-600">
                    ${yearlyTotals?.bonus.toLocaleString() || '0'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-success-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Deductions</p>
                  <p className="text-2xl font-bold text-warning-600">
                    ${yearlyTotals?.deductions.toLocaleString() || '0'}
                  </p>
                </div>
                <Calculator className="h-8 w-8 text-warning-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Net Salary</p>
                  <p className="text-2xl font-bold text-primary-600">
                    ${yearlyTotals?.netSalary.toLocaleString() || '0'}
                  </p>
                </div>
                <PiggyBank className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payroll Records */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Salary History</CardTitle>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRecords?.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">No payroll records found</p>
                <p className="text-sm text-neutral-500">
                  {selectedYear ? `No records for ${selectedYear}` : "No payroll data available"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecords?.map((record) => (
                  <div key={record.id} className="border border-neutral-200 rounded-lg p-6 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-900">
                            {monthNames[record.month - 1]} {record.year}
                          </h3>
                          <p className="text-sm text-neutral-600">
                            Processed on {format(new Date(record.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-neutral-900">
                          ${parseFloat(record.netSalary).toLocaleString()}
                        </p>
                        <p className="text-sm text-neutral-600">Net Salary</p>
                      </div>
                    </div>

                    {/* Salary Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-neutral-50 rounded-lg">
                        <p className="text-sm text-neutral-600">Basic Salary</p>
                        <p className="text-lg font-semibold text-neutral-900">
                          ${parseFloat(record.basicSalary).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-success-50 rounded-lg">
                        <p className="text-sm text-success-600">HRA</p>
                        <p className="text-lg font-semibold text-success-700">
                          +${parseFloat(record.hra).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-primary-50 rounded-lg">
                        <p className="text-sm text-primary-600">Bonus</p>
                        <p className="text-lg font-semibold text-primary-700">
                          +${parseFloat(record.bonus).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-warning-50 rounded-lg">
                        <p className="text-sm text-warning-600">Deductions</p>
                        <p className="text-lg font-semibold text-warning-700">
                          -${parseFloat(record.deductions).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          <CreditCard className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                        {record.payslipUrl && (
                          <Badge className="badge-success">
                            <FileText className="h-3 w-3 mr-1" />
                            Payslip Available
                          </Badge>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {record.payslipUrl ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadPayslip(record.payslipUrl!)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Payslip
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            <FileText className="h-4 w-4 mr-2" />
                            Payslip Not Available
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Salary Components Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Salary Components ({selectedYear})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earnings */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-4 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-success-600" />
                  Earnings
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-600">Basic Salary</span>
                    <span className="font-medium text-neutral-900">
                      ${yearlyTotals?.basicSalary.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-success-50 rounded-lg">
                    <span className="text-sm text-success-600">House Rent Allowance</span>
                    <span className="font-medium text-success-700">
                      +${yearlyTotals?.hra.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary-50 rounded-lg">
                    <span className="text-sm text-primary-600">Performance Bonus</span>
                    <span className="font-medium text-primary-700">
                      +${yearlyTotals?.bonus.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-4 flex items-center">
                  <Calculator className="h-4 w-4 mr-2 text-warning-600" />
                  Deductions
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-warning-50 rounded-lg">
                    <span className="text-sm text-warning-600">Tax Deductions</span>
                    <span className="font-medium text-warning-700">
                      -${Math.round((yearlyTotals?.deductions || 0) * 0.7).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-warning-50 rounded-lg">
                    <span className="text-sm text-warning-600">Insurance</span>
                    <span className="font-medium text-warning-700">
                      -${Math.round((yearlyTotals?.deductions || 0) * 0.2).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-warning-50 rounded-lg">
                    <span className="text-sm text-warning-600">Other</span>
                    <span className="font-medium text-warning-700">
                      -${Math.round((yearlyTotals?.deductions || 0) * 0.1).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Summary */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <div className="flex justify-between items-center p-4 bg-primary-50 rounded-lg">
                <span className="text-lg font-semibold text-primary-900">Total Net Salary ({selectedYear})</span>
                <span className="text-2xl font-bold text-primary-900">
                  ${yearlyTotals?.netSalary.toLocaleString() || '0'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
