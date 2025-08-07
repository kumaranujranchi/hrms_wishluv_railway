import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Clock, Calendar, Receipt, BarChart3, LogIn, UserPlus } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  const features = [
    {
      icon: Clock,
      title: "Attendance Tracking",
      description: "Smart geo-fenced attendance with real-time tracking and automated reports."
    },
    {
      icon: Calendar,
      title: "Leave Management",
      description: "Streamlined leave requests with approval workflows and balance tracking."
    },
    {
      icon: Receipt,
      title: "Expense Management",
      description: "Easy expense claims with receipt uploads and approval processes."
    },
    {
      icon: Users,
      title: "Employee Directory",
      description: "Complete employee database with role-based access and org charts."
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Comprehensive reporting with insights into attendance, payroll, and performance."
    },
    {
      icon: Building2,
      title: "Multi-location Support",
      description: "Manage multiple office locations with customizable geo-fencing."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center">
              <Building2 className="text-white h-10 w-10" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-neutral-900 mb-4">
            Synergy HRMS Pro
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            Complete Human Resource Management System with attendance tracking, 
            leave management, expense claims, and comprehensive reporting.
          </p>
          <div className="flex justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-lg font-semibold transition-colors text-lg">
                <LogIn className="mr-3 h-6 w-6" />
                Sign In to HRMS
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-neutral-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="text-primary-600 h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl shadow-lg p-12">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            Ready to Transform Your HR Management?
          </h2>
          <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
            Secure access to your HR management dashboard. Sign in with your credentials to manage attendance, 
            leave requests, expenses, and more.
          </p>
          <div className="flex justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <LogIn className="mr-2 h-5 w-5" />
                Access HRMS Pro
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
