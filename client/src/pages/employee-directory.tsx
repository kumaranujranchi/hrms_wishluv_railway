import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Department, Designation } from "@shared/schema";
import { 
  Search, 
  Users, 
  Filter, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Briefcase,
  UserPlus,
  Edit,
  Save,
  User,
  Building,
  CreditCard,
  FileText,
  Heart,
  Trash2,
  AlertTriangle
} from "lucide-react";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  profileImageUrl: string | null;
  role: string;
  isOnboardingComplete: boolean;
  joinDate: string | null;
  isActive: boolean;
}

const editEmployeeSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  // Personal details
  fatherName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  marriageAnniversary: z.string().optional(),
  personalMobile: z.string().optional(),
  // Emergency contact
  emergencyContactName: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  // Government IDs
  panNumber: z.string().optional(),
  aadharNumber: z.string().optional(),
  // Address
  currentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  // Banking details
  bankAccountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  bankName: z.string().optional(),
  // Salary structure
  basicSalary: z.string().optional(),
  hra: z.string().optional(),
  pfEmployeeContribution: z.string().optional(),
  pfEmployerContribution: z.string().optional(),
  esicEmployeeContribution: z.string().optional(),
  esicEmployerContribution: z.string().optional(),
  specialAllowance: z.string().optional(),
  performanceBonus: z.string().optional(),
  gratuity: z.string().optional(),
  professionalTax: z.string().optional(),
  medicalAllowance: z.string().optional(),
  conveyanceAllowance: z.string().optional(),
  foodCoupons: z.string().optional(),
  lta: z.string().optional(),
  shiftAllowance: z.string().optional(),
  overtimePay: z.string().optional(),
  attendanceBonus: z.string().optional(),
  joiningBonus: z.string().optional(),
  retentionBonus: z.string().optional(),
});

type EditEmployeeFormData = z.infer<typeof editEmployeeSchema>;

export default function EmployeeDirectoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Options for Department and Designation dropdowns
  const { data: departmentsData } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });
  const { data: designationsData } = useQuery<(Designation & { department?: Department })[]>({
    queryKey: ["/api/designations"],
  });

  const form = useForm<EditEmployeeFormData>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      department: '',
      position: '',
      fatherName: '',
      dateOfBirth: '',
      marriageAnniversary: '',
      personalMobile: '',
      emergencyContactName: '',
      emergencyContactNumber: '',
      emergencyContactRelation: '',
      panNumber: '',
      aadharNumber: '',
      currentAddress: '',
      permanentAddress: '',
      bankAccountNumber: '',
      ifscCode: '',
      bankName: '',
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: EditEmployeeFormData) => {
      if (!selectedEmployee) return;
      await apiRequest("PUT", `/api/admin/employees/${selectedEmployee.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee details updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setEditDialogOpen(false);
      setSelectedEmployee(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      await apiRequest("DELETE", `/api/admin/employees/${employeeId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete employee",
        variant: "destructive",
      });
    },
  });

  const handleEditEmployee = async (employee: Employee) => {
    setSelectedEmployee(employee);
    
    // Fetch employee profile details
    try {
      const profileResponse = await fetch(`/api/employees/${employee.id}/profile`);
      const profileData = profileResponse.ok ? await profileResponse.json() : {};
      
      form.reset({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        department: employee.department || '',
        position: employee.position || '',
        fatherName: profileData.fatherName || '',
        dateOfBirth: profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '',
        marriageAnniversary: profileData.marriageAnniversary ? profileData.marriageAnniversary.split('T')[0] : '',
        personalMobile: profileData.personalMobile || '',
        emergencyContactName: profileData.emergencyContactName || '',
        emergencyContactNumber: profileData.emergencyContactNumber || '',
        emergencyContactRelation: profileData.emergencyContactRelation || '',
        panNumber: profileData.panNumber || '',
        aadharNumber: profileData.aadharNumber || '',
        currentAddress: profileData.currentAddress || '',
        permanentAddress: profileData.permanentAddress || '',
        bankAccountNumber: profileData.bankAccountNumber || '',
        ifscCode: profileData.ifscCode || '',
        bankName: profileData.bankName || '',
      });
    } catch (error) {
      form.reset({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        department: employee.department || '',
        position: employee.position || '',
        fatherName: '',
        dateOfBirth: '',
        marriageAnniversary: '',
        personalMobile: '',
        emergencyContactName: '',
        emergencyContactNumber: '',
        emergencyContactRelation: '',
        panNumber: '',
        aadharNumber: '',
        currentAddress: '',
        permanentAddress: '',
        bankAccountNumber: '',
        ifscCode: '',
        bankName: '',
      });
    }
    
    setEditDialogOpen(true);
  };

  const onSubmit = (data: EditEmployeeFormData) => {
    updateEmployeeMutation.mutate(data);
  };

  // Filter employees based on search and filters
  const filteredEmployees = employees?.filter(employee => {
    const matchesSearch = 
      employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter;
    const matchesRole = roleFilter === "all" || employee.role === roleFilter;
    
    return matchesSearch && matchesDepartment && matchesRole;
  });

  // Get unique departments and roles for filters
  const departments = [...new Set(employees?.map(emp => emp.department).filter(Boolean))];
  const roles = [...new Set(employees?.map(emp => emp.role))];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="badge-primary">Admin</Badge>;
      case 'manager':
        return <Badge className="badge-warning">Manager</Badge>;
      default:
        return <Badge variant="outline">Employee</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-32 bg-neutral-200 rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-neutral-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Employees</p>
                  <p className="text-2xl font-bold text-neutral-900">{employees?.length || 0}</p>
                </div>
                <Users className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Departments</p>
                  <p className="text-2xl font-bold text-neutral-900">{departments.length}</p>
                </div>
                <Briefcase className="h-8 w-8 text-success-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Managers</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {employees?.filter(emp => emp.role === 'manager').length || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-warning-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Active Today</p>
                  <p className="text-2xl font-bold text-neutral-900">{Math.floor((employees?.length || 0) * 0.92)}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Employee Directory</CardTitle>
              {user?.role === 'admin' && (
                <Button asChild>
                  <Link href="/admin/create-employee">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create New Employee
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="md:w-48">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="md:w-40">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee Grid */}
            {filteredEmployees?.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">No employees found</p>
                <p className="text-sm text-neutral-500">
                  {searchQuery || departmentFilter || roleFilter 
                    ? "Try adjusting your search or filters" 
                    : "Employee directory is empty"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees?.map((employee) => (
                  <Card key={employee.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={employee.profileImageUrl || "https://imagizer.imageshack.com/img924/9256/E2qQnT.png"} alt="Profile" />
                          <AvatarFallback className="bg-primary-100 text-primary-600">
                            {getInitials(employee.firstName, employee.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-neutral-900 truncate">
                            {employee.firstName} {employee.lastName}
                          </h3>
                          <p className="text-sm text-neutral-600 truncate">{employee.position}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {user?.role === 'admin' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditEmployee(employee)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEmployeeToDelete(employee);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}
                          {getRoleBadge(employee.role)}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm text-neutral-600">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{employee.email}</span>
                        </div>
                        
                        {employee.department && (
                          <div className="flex items-center space-x-2 text-sm text-neutral-600">
                            <Briefcase className="h-4 w-4" />
                            <span>{employee.department}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 text-sm text-neutral-600">
                          <MapPin className="h-4 w-4" />
                          <span>Main Office</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-neutral-200">
                        <div className="flex items-center justify-between text-xs text-neutral-500">
                          <span>Employee ID: {employee.id.slice(-6).toUpperCase()}</span>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                            <span>Active</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Department Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map(department => {
                const deptEmployees = employees?.filter(emp => emp.department === department) || [];
                const managers = deptEmployees.filter(emp => emp.role === 'manager').length;
                const employees_count = deptEmployees.filter(emp => emp.role === 'employee').length;
                
                return (
                  <div key={department} className="p-4 border border-neutral-200 rounded-lg">
                    <h4 className="font-medium text-neutral-900 mb-2">{department}</h4>
                    <div className="space-y-1 text-sm text-neutral-600">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">{deptEmployees.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Managers:</span>
                        <span>{managers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Employees:</span>
                        <span>{employees_count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee Details</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Update employee information and complete their profile manually
            </p>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="emergency">Emergency</TabsTrigger>
                  <TabsTrigger value="government">Government IDs</TabsTrigger>
                  <TabsTrigger value="banking">Banking</TabsTrigger>
                  <TabsTrigger value="salary">Salary</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="John" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Doe" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="john.doe@company.com" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {departmentsData?.map((dept) => (
                                <SelectItem key={dept.id} value={dept.name}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Designation</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select designation" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {designationsData?.map((des) => (
                                <SelectItem key={des.id} value={des.name}>
                                  {des.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fatherName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Father's Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Father's Full Name" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="personalMobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personal Mobile</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="+1234567890" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="marriageAnniversary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marriage Anniversary</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="currentAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Current residential address" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="permanentAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Permanent Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Permanent address (if different)" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="emergency" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Contact person's name" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="emergencyContactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="+1234567890" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="emergencyContactRelation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Heart className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Spouse, Parent, Sibling" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="government" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="panNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PAN Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="ABCDE1234F" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="aadharNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aadhar Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="1234 5678 9012" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="banking" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="State Bank of India" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bankAccountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="123456789012" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="ifscCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IFSC Code</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="SBIN0001234" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="State Bank of India" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="salary" className="space-y-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Salary Structure</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="basicSalary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Basic Salary</FormLabel>
                              <FormControl>
                                <Input placeholder="25000" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="hra"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>House Rent Allowance (HRA)</FormLabel>
                              <FormControl>
                                <Input placeholder="8000" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="specialAllowance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Special Allowance</FormLabel>
                              <FormControl>
                                <Input placeholder="5000" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="medicalAllowance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Medical Allowance</FormLabel>
                              <FormControl>
                                <Input placeholder="1500" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="conveyanceAllowance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conveyance Allowance</FormLabel>
                              <FormControl>
                                <Input placeholder="1600" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="foodCoupons"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Food Coupons / Meal Card</FormLabel>
                              <FormControl>
                                <Input placeholder="2000" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lta"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Leave Travel Allowance (LTA)</FormLabel>
                              <FormControl>
                                <Input placeholder="15000" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="shiftAllowance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shift Allowance</FormLabel>
                              <FormControl>
                                <Input placeholder="2000" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Provident Fund (PF)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="pfEmployeeContribution"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PF - Employee Contribution</FormLabel>
                              <FormControl>
                                <Input placeholder="1800" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="pfEmployerContribution"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PF - Employer Contribution</FormLabel>
                              <FormControl>
                                <Input placeholder="1800" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Employee State Insurance (ESIC)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="esicEmployeeContribution"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ESIC - Employee Contribution</FormLabel>
                              <FormControl>
                                <Input placeholder="112.5" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="esicEmployerContribution"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ESIC - Employer Contribution</FormLabel>
                              <FormControl>
                                <Input placeholder="315" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Bonuses & Variable Pay</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="performanceBonus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Performance Bonus / Variable Pay</FormLabel>
                              <FormControl>
                                <Input placeholder="10000" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="attendanceBonus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Attendance Bonus</FormLabel>
                              <FormControl>
                                <Input placeholder="1000" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="joiningBonus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Joining Bonus</FormLabel>
                              <FormControl>
                                <Input placeholder="5000" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="retentionBonus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Retention Bonus</FormLabel>
                              <FormControl>
                                <Input placeholder="15000" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Other Components</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="gratuity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gratuity</FormLabel>
                              <FormControl>
                                <Input placeholder="1200" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="professionalTax"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Professional Tax (PT)</FormLabel>
                              <FormControl>
                                <Input placeholder="200" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="overtimePay"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Overtime Pay</FormLabel>
                              <FormControl>
                                <Input placeholder="2000" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateEmployeeMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateEmployeeMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
        </Dialog>

        {/* Delete Employee Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <span>Delete Employee</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete <strong>{employeeToDelete?.firstName} {employeeToDelete?.lastName}</strong>? 
                This action cannot be undone and will permanently remove all employee data.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">This will permanently delete:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>Employee profile and personal information</li>
                      <li>Attendance records and history</li>
                      <li>Leave requests and balances</li>
                      <li>Expense claims and approvals</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setEmployeeToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  disabled={deleteEmployeeMutation.isPending}
                  onClick={() => {
                    if (employeeToDelete) {
                      deleteEmployeeMutation.mutate(employeeToDelete.id);
                    }
                  }}
                >
                  {deleteEmployeeMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Employee
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </Layout>
  );
}
