import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Wait until auth state and Firestore profile are both ready
  if (loading || !user || user.role === undefined) {
    return <div className="min-h-screen flex items-center justify-center" style={{
          background: `
      linear-gradient(248.32deg, rgba(34, 78, 97, 0.24) 1.53%, rgba(27, 55, 82, 0.85) 48.49%, #0D1B3A 95.44%),
      linear-gradient(115.02deg, rgba(34, 78, 97, 0.64) 20.88%, #0D1B3A 100%)
    `,
        }}>Loading user profile...</div>;
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
