import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Users, 
  Filter, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Briefcase
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
}

export default function EmployeeDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

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
            <CardTitle>Employee Directory</CardTitle>
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
                          <AvatarImage src={employee.profileImageUrl || ""} alt="Profile" />
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
                        {getRoleBadge(employee.role)}
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
    </Layout>
  );
}
