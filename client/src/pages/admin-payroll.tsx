import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, User, Settings, Plus, Save, Edit } from "lucide-react";
import Layout from "@/components/Layout";

interface EmployeeWithSalary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  isOnboardingComplete: boolean;
  salaryStructure: {
    id: string;
    basicSalary: string;
    hra: string;
    conveyanceAllowance: string;
    medicalAllowance: string;
    specialAllowance: string;
    grossSalary: string;
    providentFund: string;
    professionalTax: string;
    incomeTax: string;
    otherDeductions: string;
    totalDeductions: string;
    netSalary: string;
    effectiveDate: string;
  } | null;
}

interface SalaryStructureForm {
  userId: string;
  basicSalary: string;
  hra: string;
  conveyanceAllowance: string;
  medicalAllowance: string;
  specialAllowance: string;
  providentFund: string;
  professionalTax: string;
  incomeTax: string;
  otherDeductions: string;
}

export default function AdminPayroll() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithSalary | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<SalaryStructureForm>({
    userId: "",
    basicSalary: "",
    hra: "",
    conveyanceAllowance: "",
    medicalAllowance: "",
    specialAllowance: "",
    providentFund: "",
    professionalTax: "",
    incomeTax: "",
    otherDeductions: "",
  });

  const { data: employees, isLoading: employeesLoading } = useQuery<EmployeeWithSalary[]>({
    queryKey: ["/api/admin/employees-with-salary"],
  });

  const saveSalaryMutation = useMutation({
    mutationFn: async (data: SalaryStructureForm) => {
      // Calculate totals
      const basicSalary = parseFloat(data.basicSalary) || 0;
      const hra = parseFloat(data.hra) || 0;
      const conveyanceAllowance = parseFloat(data.conveyanceAllowance) || 0;
      const medicalAllowance = parseFloat(data.medicalAllowance) || 0;
      const specialAllowance = parseFloat(data.specialAllowance) || 0;
      
      const providentFund = parseFloat(data.providentFund) || 0;
      const professionalTax = parseFloat(data.professionalTax) || 0;
      const incomeTax = parseFloat(data.incomeTax) || 0;
      const otherDeductions = parseFloat(data.otherDeductions) || 0;

      const grossSalary = basicSalary + hra + conveyanceAllowance + medicalAllowance + specialAllowance;
      const totalDeductions = providentFund + professionalTax + incomeTax + otherDeductions;
      const netSalary = grossSalary - totalDeductions;

      await apiRequest("POST", "/api/admin/salary-structure", {
        ...data,
        basicSalary: basicSalary.toString(),
        hra: hra.toString(),
        conveyanceAllowance: conveyanceAllowance.toString(),
        medicalAllowance: medicalAllowance.toString(),
        specialAllowance: specialAllowance.toString(),
        grossSalary: grossSalary.toString(),
        providentFund: providentFund.toString(),
        professionalTax: professionalTax.toString(),
        incomeTax: incomeTax.toString(),
        otherDeductions: otherDeductions.toString(),
        totalDeductions: totalDeductions.toString(),
        netSalary: netSalary.toString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Salary structure saved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees-with-salary"] });
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

  const resetForm = () => {
    setSelectedEmployee(null);
    setFormData({
      userId: "",
      basicSalary: "",
      hra: "",
      conveyanceAllowance: "",
      medicalAllowance: "",
      specialAllowance: "",
      providentFund: "",
      professionalTax: "",
      incomeTax: "",
      otherDeductions: "",
    });
  };

  const handleEmployeeSelect = (employee: EmployeeWithSalary) => {
    setSelectedEmployee(employee);
    if (employee.salaryStructure) {
      setFormData({
        userId: employee.id,
        basicSalary: employee.salaryStructure.basicSalary,
        hra: employee.salaryStructure.hra,
        conveyanceAllowance: employee.salaryStructure.conveyanceAllowance,
        medicalAllowance: employee.salaryStructure.medicalAllowance,
        specialAllowance: employee.salaryStructure.specialAllowance,
        providentFund: employee.salaryStructure.providentFund,
        professionalTax: employee.salaryStructure.professionalTax,
        incomeTax: employee.salaryStructure.incomeTax,
        otherDeductions: employee.salaryStructure.otherDeductions,
      });
    } else {
      setFormData({
        ...formData,
        userId: employee.id,
      });
    }
    setIsDialogOpen(true);
  };

  const calculateGross = () => {
    const basic = parseFloat(formData.basicSalary) || 0;
    const hra = parseFloat(formData.hra) || 0;
    const conveyance = parseFloat(formData.conveyanceAllowance) || 0;
    const medical = parseFloat(formData.medicalAllowance) || 0;
    const special = parseFloat(formData.specialAllowance) || 0;
    return basic + hra + conveyance + medical + special;
  };

  const calculateDeductions = () => {
    const pf = parseFloat(formData.providentFund) || 0;
    const pt = parseFloat(formData.professionalTax) || 0;
    const it = parseFloat(formData.incomeTax) || 0;
    const other = parseFloat(formData.otherDeductions) || 0;
    return pf + pt + it + other;
  };

  const calculateNet = () => {
    return calculateGross() - calculateDeductions();
  };

  const handleInputChange = (field: keyof SalaryStructureForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!selectedEmployee) return;
    saveSalaryMutation.mutate(formData);
  };

  if (employeesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">Loading employees...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payroll Management</h1>
            <p className="text-muted-foreground">
              Manage employee salary structures and payroll processing
            </p>
          </div>
        </div>

        <Tabs defaultValue="salary-structures" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="salary-structures">Salary Structures</TabsTrigger>
            <TabsTrigger value="payroll-processing">Payroll Processing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="salary-structures" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Employee Salary Structures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees?.map((employee) => (
                    <Card key={employee.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <User className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {employee.firstName} {employee.lastName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {employee.email} • {employee.department} • {employee.position}
                              </p>
                            </div>
                          </div>
                          
                          {employee.salaryStructure ? (
                            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Basic Salary:</span>
                                <p className="font-medium">₹{parseFloat(employee.salaryStructure.basicSalary).toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Gross Salary:</span>
                                <p className="font-medium">₹{parseFloat(employee.salaryStructure.grossSalary).toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Net Salary:</span>
                                <p className="font-medium text-green-600">₹{parseFloat(employee.salaryStructure.netSalary).toLocaleString()}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3">
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                No Salary Structure
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          onClick={() => handleEmployeeSelect(employee)}
                          variant={employee.salaryStructure ? "outline" : "default"}
                        >
                          {employee.salaryStructure ? (
                            <>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Structure
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Set Structure
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll-processing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Monthly Payroll Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Payroll processing functionality will be implemented next. This will calculate salaries based on attendance and the salary structures defined above.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedEmployee?.salaryStructure ? 'Edit' : 'Set'} Salary Structure - {selectedEmployee?.firstName} {selectedEmployee?.lastName}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Earnings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Basic Salary *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="50000"
                        value={formData.basicSalary}
                        onChange={(e) => handleInputChange('basicSalary', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>House Rent Allowance (HRA)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="20000"
                        value={formData.hra}
                        onChange={(e) => handleInputChange('hra', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Conveyance Allowance</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="2000"
                        value={formData.conveyanceAllowance}
                        onChange={(e) => handleInputChange('conveyanceAllowance', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Medical Allowance</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1500"
                        value={formData.medicalAllowance}
                        onChange={(e) => handleInputChange('medicalAllowance', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Special Allowance</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="5000"
                        value={formData.specialAllowance}
                        onChange={(e) => handleInputChange('specialAllowance', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Deductions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Provident Fund (PF)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="6000"
                        value={formData.providentFund}
                        onChange={(e) => handleInputChange('providentFund', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Professional Tax</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="200"
                        value={formData.professionalTax}
                        onChange={(e) => handleInputChange('professionalTax', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Income Tax (TDS)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="5000"
                        value={formData.incomeTax}
                        onChange={(e) => handleInputChange('incomeTax', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Other Deductions</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={formData.otherDeductions}
                        onChange={(e) => handleInputChange('otherDeductions', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-2 border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg">Salary Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-600 font-medium">Gross Salary</p>
                      <p className="text-lg font-bold text-green-700">
                        ₹{calculateGross().toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-600 font-medium">Total Deductions</p>
                      <p className="text-lg font-bold text-red-700">
                        ₹{calculateDeductions().toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600 font-medium">Net Salary</p>
                      <p className="text-lg font-bold text-blue-700">
                        ₹{calculateNet().toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saveSalaryMutation.isPending || !formData.basicSalary}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveSalaryMutation.isPending ? 'Saving...' : 'Save Structure'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}