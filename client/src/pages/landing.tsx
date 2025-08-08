import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, Users, Calendar, DollarSign, BarChart3, Clock, Receipt, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  const handleLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: 'hsl(var(--primary))' }}>
              <img src="https://imagizer.imageshack.com/img924/9256/E2qQnT.png" alt="Company Logo" className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-white">Wishluv Buildcon Pvt Ltd</h1>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold text-white mb-6">
          Your Complete HR Solution
        </h2>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Everything you need for your workplace needs in one place. Mark attendance, 
          apply for leave, check payroll, submit expenses, and stay updated with company announcements. 
          Manage your professional life effortlessly.
        </p>
        
        <Button 
          onClick={handleLogin} 
          size="lg" 
          className="text-lg px-8 py-3 text-white font-semibold rounded-lg transition-colors"
          style={{ backgroundColor: 'hsl(var(--primary))' }}
        >
          Login
        </Button>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center text-white mb-12">
          Key Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="dashboard-card text-center hover:bg-card/90 transition-all">
            <div className="p-6">
              <div className="metric-icon blue mx-auto mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-3">Employee Management</h4>
              <p className="text-gray-400 text-sm">
                Complete employee directory with profiles, onboarding, and organizational structure.
              </p>
            </div>
          </div>

          <div className="dashboard-card text-center hover:bg-card/90 transition-all">
            <div className="p-6">
              <div className="metric-icon green mx-auto mb-4">
                <Clock className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-3">Attendance Tracking</h4>
              <p className="text-gray-400 text-sm">
                Real-time attendance monitoring with geo-fencing and comprehensive reporting.
              </p>
            </div>
          </div>

          <div className="dashboard-card text-center hover:bg-card/90 transition-all">
            <div className="p-6">
              <div className="metric-icon purple mx-auto mb-4">
                <DollarSign className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-3">Payroll Management</h4>
              <p className="text-gray-400 text-sm">
                Automated payroll processing with detailed salary breakdowns and tax calculations.
              </p>
            </div>
          </div>

          <div className="dashboard-card text-center hover:bg-card/90 transition-all">
            <div className="p-6">
              <div className="metric-icon yellow mx-auto mb-4">
                <BarChart3 className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-3">Analytics & Reports</h4>
              <p className="text-gray-400 text-sm">
                Comprehensive reporting and analytics for data-driven HR decisions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-white mb-4">
            Everything You Need in One Place
          </h3>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Streamline your HR operations with our comprehensive suite of tools designed for modern workplaces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="dashboard-card">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="metric-icon green">
                  <Receipt className="h-6 h-6" />
                </div>
                <h4 className="text-lg font-semibold text-white">Expense Management</h4>
              </div>
              <p className="text-gray-400 text-sm">
                Submit and track expense claims with receipt uploads and approval workflows.
              </p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="metric-icon blue">
                  <Calendar className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-semibold text-white">Leave Management</h4>
              </div>
              <p className="text-gray-400 text-sm">
                Apply for leaves, track balances, and manage approvals all in one place.
              </p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="metric-icon purple">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-semibold text-white">Performance Insights</h4>
              </div>
              <p className="text-gray-400 text-sm">
                Track performance metrics and generate insights for better productivity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16" style={{ backgroundColor: 'hsl(var(--primary))' }}>
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6 text-white">Ready to Simplify Your Work Life?</h3>
          <p className="text-xl mb-8 opacity-90 text-white max-w-2xl mx-auto">
            Join thousands of employees who manage their attendance, leaves, payroll, and more effortlessly. Your digital workplace assistant is just one login away.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg" 
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3 font-semibold"
          >
            Login
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8" style={{ backgroundColor: 'hsl(var(--sidebar-bg))' }}>
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: 'hsl(var(--primary))' }}>
              <img src="https://imagizer.imageshack.com/img924/9256/E2qQnT.png" alt="Company Logo" className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-white">Synergy HRMS Pro</span>
          </div>
          <p className="text-gray-400 text-sm">© 2025 Wishluv Buildcon Pvt Ltd. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}