import { Navigate } from 'react-router-dom';
import { ReactElement } from 'react';
import { useAuth } from '../context/AuthContext';

// Wrap a page in this to require login (and a finished profile unless allowIncomplete).
export default function ProtectedRoute({
  children,
  allowIncomplete = false,
}: {
  children: ReactElement;
  allowIncomplete?: boolean;
}) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center muted">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.profileComplete && !allowIncomplete) return <Navigate to="/setup-profile" replace />;
  return children;
}
