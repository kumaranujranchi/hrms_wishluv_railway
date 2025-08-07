import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, Calendar, User, FileText, Download, Plus } from "lucide-react";
import Layout from "@/components/Layout";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  isOnboarded: boolean;
  isActive: boolean;
}

interface PayrollRecord {
  id: string;
  userId: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  grossSalary: number;
  netSalary: number;
  status: 'draft' | 'processed' | 'paid';
  processedAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    department: string;
  };
}

interface SalaryBreakup {
  basicSalary: number;
  houseRentAllowance: number;
  medicalAllowance: number;
  transportAllowance: number;
  specialAllowance: number;
  providentFund: number;
  professionalTax: number;
  incomeTax: number;
}

export default function AdminPayroll() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [salaryBreakup, setSalaryBreakup] = useState<SalaryBreakup>({
    basicSalary: 0,
    houseRentAllowance: 0,
    medicalAllowance: 0,
    transportAllowance: 0,
    specialAllowance: 0,
    providentFund: 0,
    professionalTax: 0,
    incomeTax: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees", { onboarded: true }],
  });

  const { data: payrollRecords, isLoading: payrollLoading } = useQuery<PayrollRecord[]>({
    queryKey: ["/api/admin/payroll", selectedMonth, selectedYear],
  });

  const createPayrollMutation = useMutation({
    mutationFn: async (payrollData: any) => {
      await apiRequest("POST", "/api/admin/payroll", payrollData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payroll record created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payroll"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const processPayrollMutation = useMutation({
    mutationFn: async (recordId: string) => {
      await apiRequest("PUT", `/api/admin/payroll/${recordId}/process`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payroll processed successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payroll"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generatePayslipMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const response = await fetch(`/api/admin/payroll/${recordId}/payslip`);
      if (!response.ok) throw new Error("Failed to generate payslip");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${recordId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payslip downloaded successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedEmployee(null);
    setSalaryBreakup({
      basicSalary: 0,
      houseRentAllowance: 0,
      medicalAllowance: 0,
      transportAllowance: 0,
      specialAllowance: 0,
      providentFund: 0,
      professionalTax: 0,
      incomeTax: 0,
    });
  };

  const calculateGrossSalary = () => {
    return salaryBreakup.basicSalary + 
           salaryBreakup.houseRentAllowance + 
           salaryBreakup.medicalAllowance + 
           salaryBreakup.transportAllowance + 
           salaryBreakup.specialAllowance;
  };

  const calculateNetSalary = () => {
    const gross = calculateGrossSalary();
    const totalDeductions = salaryBreakup.providentFund + 
                           salaryBreakup.professionalTax + 
                           salaryBreakup.incomeTax;
    return gross - totalDeductions;
  };

  const handleCreatePayroll = () => {
    if (!selectedEmployee) return;

    const grossSalary = calculateGrossSalary();
    const totalDeductions = salaryBreakup.providentFund + 
                           salaryBreakup.professionalTax + 
                           salaryBreakup.incomeTax;
    const netSalary = calculateNetSalary();

    createPayrollMutation.mutate({
      userId: selectedEmployee.id,
      month: selectedMonth,
      year: selectedYear,
      basicSalary: salaryBreakup.basicSalary,
      allowances: salaryBreakup.houseRentAllowance + 
                  salaryBreakup.medicalAllowance + 
                  salaryBreakup.transportAllowance + 
                  salaryBreakup.specialAllowance,
      deductions: totalDeductions,
      grossSalary,
      netSalary,
      salaryBreakup,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'processed':
        return <Badge variant="default">Processed</Badge>;
      case 'paid':
        return <Badge variant="outline" className="text-green-600 border-green-600">Paid</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payroll Management</h1>
            <p className="text-muted-foreground">
              Manage employee salaries and generate payroll reports
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Payroll Record</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Employee</Label>
                    <Select 
                      value={selectedEmployee?.id || ""} 
                      onValueChange={(value) => {
                        const employee = employees?.find(e => e.id === value);
                        setSelectedEmployee(employee || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees?.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.firstName} {employee.lastName} - {employee.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Month</Label>
                    <Select 
                      value={selectedMonth.toString()} 
                      onValueChange={(value) => setSelectedMonth(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      min="2020"
                      max="2030"
                    />
                  </div>
                </div>

                <Tabs defaultValue="earnings" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="earnings">Earnings</TabsTrigger>
                    <TabsTrigger value="deductions">Deductions</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="earnings" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="basicSalary">Basic Salary</Label>
                        <Input
                          id="basicSalary"
                          type="number"
                          value={salaryBreakup.basicSalary}
                          onChange={(e) => setSalaryBreakup(prev => ({ 
                            ...prev, 
                            basicSalary: parseFloat(e.target.value) || 0 
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hra">House Rent Allowance</Label>
                        <Input
                          id="hra"
                          type="number"
                          value={salaryBreakup.houseRentAllowance}
                          onChange={(e) => setSalaryBreakup(prev => ({ 
                            ...prev, 
                            houseRentAllowance: parseFloat(e.target.value) || 0 
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="medical">Medical Allowance</Label>
                        <Input
                          id="medical"
                          type="number"
                          value={salaryBreakup.medicalAllowance}
                          onChange={(e) => setSalaryBreakup(prev => ({ 
                            ...prev, 
                            medicalAllowance: parseFloat(e.target.value) || 0 
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="transport">Transport Allowance</Label>
                        <Input
                          id="transport"
                          type="number"
                          value={salaryBreakup.transportAllowance}
                          onChange={(e) => setSalaryBreakup(prev => ({ 
                            ...prev, 
                            transportAllowance: parseFloat(e.target.value) || 0 
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="special">Special Allowance</Label>
                        <Input
                          id="special"
                          type="number"
                          value={salaryBreakup.specialAllowance}
                          onChange={(e) => setSalaryBreakup(prev => ({ 
                            ...prev, 
                            specialAllowance: parseFloat(e.target.value) || 0 
                          }))}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="deductions" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pf">Provident Fund</Label>
                        <Input
                          id="pf"
                          type="number"
                          value={salaryBreakup.providentFund}
                          onChange={(e) => setSalaryBreakup(prev => ({ 
                            ...prev, 
                            providentFund: parseFloat(e.target.value) || 0 
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="pt">Professional Tax</Label>
                        <Input
                          id="pt"
                          type="number"
                          value={salaryBreakup.professionalTax}
                          onChange={(e) => setSalaryBreakup(prev => ({ 
                            ...prev, 
                            professionalTax: parseFloat(e.target.value) || 0 
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="it">Income Tax</Label>
                        <Input
                          id="it"
                          type="number"
                          value={salaryBreakup.incomeTax}
                          onChange={(e) => setSalaryBreakup(prev => ({ 
                            ...prev, 
                            incomeTax: parseFloat(e.target.value) || 0 
                          }))}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="summary" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                        <span className="font-medium">Gross Salary:</span>
                        <span className="font-bold text-lg">₹{calculateGrossSalary().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                        <span className="font-medium">Total Deductions:</span>
                        <span className="font-bold text-lg text-red-600">
                          ₹{(salaryBreakup.providentFund + salaryBreakup.professionalTax + salaryBreakup.incomeTax).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                        <span className="font-bold text-lg">Net Salary:</span>
                        <span className="font-bold text-xl text-primary">₹{calculateNetSalary().toFixed(2)}</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePayroll}
                    disabled={!selectedEmployee || createPayrollMutation.isPending}
                  >
                    {createPayrollMutation.isPending ? "Creating..." : "Create Payroll"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex space-x-4 items-center">
          <div>
            <Label>Month</Label>
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Year</Label>
            <Input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-24"
              min="2020"
              max="2030"
            />
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Payroll Records - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payrollLoading ? (
                <div className="text-center py-8">Loading payroll records...</div>
              ) : payrollRecords?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payroll records found for the selected period
                </div>
              ) : (
                <div className="space-y-4">
                  {payrollRecords?.map((record) => (
                    <div key={record.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">
                            {record.user.firstName} {record.user.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {record.user.email} • {record.user.department}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Basic Salary:</span>
                          <p className="font-medium">₹{record.basicSalary.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Allowances:</span>
                          <p className="font-medium">₹{record.allowances.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Deductions:</span>
                          <p className="font-medium text-red-600">₹{record.deductions.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Net Salary:</span>
                          <p className="font-bold text-primary">₹{record.netSalary.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-2">
                        {record.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => processPayrollMutation.mutate(record.id)}
                            disabled={processPayrollMutation.isPending}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Process
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generatePayslipMutation.mutate(record.id)}
                          disabled={generatePayslipMutation.isPending}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download Payslip
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}