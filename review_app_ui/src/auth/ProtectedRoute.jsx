import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Wrap a route element with this to require login, and optionally one of a
 * set of roles. Usage:
 *   <ProtectedRoute roles={["Admin"]}><MastersPage /></ProtectedRoute>
 * Leave `roles` off to just require any logged-in user.
 */
export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-loading">Loading…</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.must_change_password && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (roles && !roles.includes(user.role.name)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
