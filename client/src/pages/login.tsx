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
import { Link, useLocation } from 'wouter';
import { LogIn, Mail, Lock, ArrowLeft } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await apiRequest('POST', '/api/auth/login', data);
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['/api/auth/user'], user);
      toast({
        title: 'Welcome back!',
        description: 'You have been logged in successfully.',
      });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: 'Login Failed',
        description: error.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-gray-400 hover:text-white p-2 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4" style={{ backgroundColor: 'hsl(var(--primary))' }}>
              <img src="https://imagizer.imageshack.com/img924/9256/E2qQnT.png" alt="Company Logo" className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-white">Wishluv Buildcon</h1>
          </div>
          <p className="text-gray-400">Login to access your account</p>
        </div>

        {/* Login Form */}
        <div className="dashboard-card">
          <div className="p-8">
            <div className="mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <LogIn className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-white">Sign In</h2>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="email" 
                            placeholder="Enter your email" 
                            className="pl-10 bg-input border-border text-white placeholder-gray-400" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="password" 
                            placeholder="Enter your password" 
                            className="pl-10 bg-input border-border text-white placeholder-gray-400" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full text-white font-semibold py-3 rounded-lg transition-colors"
                  style={{ backgroundColor: 'hsl(var(--primary))' }}
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Need to create an account?{' '}
                <Link href="/register">
                  <span className="font-medium text-primary hover:text-primary/80 cursor-pointer">
                    Sign up here
                  </span>
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))' }}>
            <p className="text-xs text-gray-400">
              This is the admin panel for Synergy HRMS Pro. If you're an employee,
              please contact your HR department for access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}