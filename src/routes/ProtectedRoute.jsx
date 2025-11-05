import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/welcome", { replace: true });
  };

  // Loading screen WITH logout button
  if (loading || !user || user.role === undefined) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-white relative"
        style={{
          background: `
            linear-gradient(248.32deg, rgba(34, 78, 97, 0.24) 1.53%, rgba(27, 55, 82, 0.85) 48.49%, #0D1B3A 95.44%),
            linear-gradient(115.02deg, rgba(34, 78, 97, 0.64) 20.88%, #0D1B3A 100%)
          `,
        }}
      >
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded transition"
        >
          Logout
        </button>

        <div className="text-lg">Loading user profile...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
