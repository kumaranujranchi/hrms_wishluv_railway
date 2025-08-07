import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, User, Building, Briefcase, Lock } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const createEmployeeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  department: z.string().optional(),
  position: z.string().optional(),
  tempPassword: z.string().min(8, "Temporary password must be at least 8 characters"),
});

type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;

export default function AdminCreateEmployeePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createdEmployee, setCreatedEmployee] = useState<any>(null);

  const form = useForm<CreateEmployeeFormData>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      department: '',
      position: '',
      tempPassword: '',
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: CreateEmployeeFormData) => {
      const res = await apiRequest('POST', '/api/admin/create-employee', data);
      return res.json();
    },
    onSuccess: (employee) => {
      setCreatedEmployee(employee);
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: 'Employee Created!',
        description: `Account created for ${employee.firstName} ${employee.lastName}`,
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateEmployeeFormData) => {
    createEmployeeMutation.mutate(data);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue('tempPassword', password);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Create New Employee</h1>
        <p className="text-neutral-600">Add a new employee to the system and generate their login credentials.</p>
      </div>

      {createdEmployee && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <UserPlus className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Employee Created Successfully!</strong>
            <br />
            <br />
            <strong>Login Credentials:</strong>
            <br />
            Email: <code className="bg-white px-2 py-1 rounded">{createdEmployee.email}</code>
            <br />
            Temporary Password: <code className="bg-white px-2 py-1 rounded">{createdEmployee.tempPassword}</code>
            <br />
            <br />
            <em>Please share these credentials securely with the employee. They will be required to change their password on first login.</em>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <span>Employee Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
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
                          <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                          <Input placeholder="Doe" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                        <Input 
                          type="email" 
                          placeholder="john.doe@company.com" 
                          className="pl-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                          <Input placeholder="Engineering" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                          <Input placeholder="Software Developer" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tempPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporary Password</FormLabel>
                    <FormControl>
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                          <Input 
                            type="text" 
                            placeholder="Generate or enter temporary password" 
                            className="pl-10" 
                            {...field} 
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={generatePassword}
                        >
                          Generate
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-neutral-500">
                      Employee will be required to change this on first login
                    </p>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={createEmployeeMutation.isPending}
              >
                {createEmployeeMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Employee...</span>
                  </div>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Employee Account
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}