import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Wait until auth state and Firestore profile are both ready
  if (loading || !user || user.role === undefined) {
    return <div className="text-center p-8">Loading user profile...</div>;
  }

  // If not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role check (only if allowedRoles is provided)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.error(
      `🚫 Access denied: User role "${user.role}" not in allowed roles [${allowedRoles.join(", ")}]`
    );
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
