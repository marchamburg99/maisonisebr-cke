import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: ('admin' | 'manager' | 'staff')[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { user, isLoading, isAuthenticated } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user) {
        // Admin has access to everything
        if (user.role !== 'admin' && !requiredRole.includes(user.role)) {
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
}
