import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  requireWarning?: boolean;
}

export function ProtectedRoute({ children, requireWarning = false }: ProtectedRouteProps) {
  const { isAuthenticated, warningAcknowledged, canAccessDashboard, isLoading } = useAuth();

  // Read latest warning flag from localStorage to avoid stale state between hook instances
  const warningAckLS = (typeof window !== 'undefined') && localStorage.getItem('warningAcknowledged') === 'true';
  const effectiveWarningAck = warningAcknowledged || warningAckLS;

  // Debug logging
  console.log('ProtectedRoute:', { requireWarning, isAuthenticated, warningAcknowledged, isLoading });

  if (isLoading) {
    return (
      <div className="min-h-screen w-full relative flex items-center justify-center">
        <div className="fixed inset-0 bg-[#0a0f1a] z-[-2]"></div>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ffff] mx-auto mb-4"></div>
          <p className="text-[#00ffff] font-mono" style={{ fontFamily: 'monospace' }}>Initializing...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // For warning page: allow access if authenticated (regardless of warning status)
  if (requireWarning) {
    console.log('Warning page access granted');
    return <>{children}</>;
  }

  // For dashboard pages: require warning acknowledgment
  if (!effectiveWarningAck) {
    console.log('Warning not acknowledged, redirecting to warning');
    return <Navigate to="/warning" replace />;
  }

  console.log('Dashboard access granted');
  return <>{children}</>;
}
