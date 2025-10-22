import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  // 1. Show a loading screen while user state is being determined
  if (loading) return <div className="text-center p-8">Loading...</div>;
  
  // 2. Redirect unauthenticated users to the login page
  if (!user) return <Navigate to="/login" replace />;

  // 3. 🛑 IMPLEMENT ROLE CHECK (The main fix)
  // Check if roles are specified AND if the user's role is NOT in the allowed list
  // Note: user.role comes from Firestore/AuthContext
  if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
    // If unauthorized, redirect to the default home page or a 403 page
    console.error(`Access Denied. User Role: ${user.role}. Required: ${allowedRoles.join(', ')}`);
    return <Navigate to="/" replace />;
  }

  // 4. If logged in and authorized, render the children
  return children;
};

export default ProtectedRoute;