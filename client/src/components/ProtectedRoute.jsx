import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Redirects to /login (remembering where the user was going) when not signed in. */
export default function ProtectedRoute({ adminOnly = false }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
