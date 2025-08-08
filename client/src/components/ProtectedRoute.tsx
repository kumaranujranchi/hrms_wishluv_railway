import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'employee';
  allowedRoles?: string[];
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  allowedRoles 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <ShieldX className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Access Denied</h2>
            <p className="text-neutral-600 mb-4">Please log in to access this page.</p>
            <Button onClick={() => window.location.href = '/api/login'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role-based access
  const hasAccess = () => {
    if (requiredRole && user.role !== requiredRole) {
      return false;
    }
    if (allowedRoles && !allowedRoles.includes(user.role || '')) {
      return false;
    }
    return true;
  };

  if (!hasAccess()) {
    const dashboardUrl = user.role === 'admin' ? '/admin' : '/employee';
    
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <ShieldX className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Access Denied</h2>
            <p className="text-neutral-600 mb-4">
              You don't have permission to access this page.
            </p>
            <Link href={dashboardUrl}>
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}