import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment px-6">
        <div className="rounded-full border border-ink/15 bg-white/70 px-5 py-3 font-display text-sm uppercase tracking-[0.35em] text-ink/70">
          Loading planner
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
