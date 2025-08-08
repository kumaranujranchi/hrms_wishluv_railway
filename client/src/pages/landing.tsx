import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, LogIn, Users, Calendar, DollarSign, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  const handleLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-primary-600 mr-3" />
            <h1 className="text-2xl font-bold text-neutral-900">Synergy HRMS Pro</h1>
          </div>
          <Button onClick={handleLogin} className="bg-primary-600 hover:bg-primary-700">
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold text-neutral-900 mb-6">
          Comprehensive HR Management
        </h2>
        <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
          Streamline your human resources operations with our powerful HRMS platform. 
          From attendance tracking to payroll management, we've got you covered.
        </p>
        
        {/* Login Instructions */}
        <div className="bg-white border border-primary-200 rounded-lg p-6 mb-8 max-w-lg mx-auto">
          <h3 className="text-lg font-semibold text-neutral-900 mb-3">Admin Login</h3>
          <div className="text-sm text-neutral-600 space-y-2">
            <p><strong>Email:</strong> anuj.kumar@wishluvbuildcon.com</p>
            <p><strong>Password:</strong> admin123</p>
            <p>Use the above credentials to access the admin panel</p>
          </div>
        </div>
        
        <Button 
          onClick={handleLogin} 
          size="lg" 
          className="bg-primary-600 hover:bg-primary-700 text-lg px-8 py-3"
        >
          Admin Login
        </Button>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center text-neutral-900 mb-12">
          Key Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <CardTitle>Employee Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">
                Complete employee directory with profiles, onboarding, and organizational structure.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Calendar className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Attendance Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">
                Real-time attendance monitoring with geo-fencing and comprehensive reporting.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <DollarSign className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Payroll Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">
                Automated payroll processing with detailed salary breakdowns and tax calculations.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Analytics & Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">
                Comprehensive reporting and analytics for data-driven HR decisions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-primary-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6">Ready to Get Started?</h3>
          <p className="text-xl mb-8 opacity-90">
            Transform your HR operations with Synergy HRMS Pro
          </p>
          <Button 
            onClick={handleLogin}
            size="lg" 
            variant="secondary"
            className="bg-white text-primary-600 hover:bg-neutral-100 text-lg px-8 py-3"
          >
            Sign In Now
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-neutral-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-primary-400 mr-2" />
            <span className="text-lg font-semibold">Synergy HRMS Pro</span>
          </div>
          <p className="text-neutral-400 text-sm">
            © 2024 Synergy HRMS Pro. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}