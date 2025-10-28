import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { useEffect, useState } from "react";
import useAutoLogout from "../scripts/hooks/useAutoLogout";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Welcome from "./pages/auth/welcome";

// Attendee
import ScanQR from "./pages/attendee/ScanQR";
import { Dashboard as AttendeeDashboard } from "./pages/attendee/Dashboard";
import Profile from "./pages/attendee/Profile";
import Leaderboard from "./pages/attendee/Leaderboard";
import YourJourney from "./pages/attendee/YourJourney";

// Moderator
import GenerateQR from "./pages/moderator/GenerateQR";
import ManageStations from "./pages/moderator/ManageStations";
import AttendeeManager from "./pages/moderator/AttendeeManager";
import ModeratorDashboard from "./pages/moderator/Dashboard";

// Admin
import AdminDashboard from "./pages/admin/Dashboard";
import ManageUsers from "./pages/admin/ManageModerators";
import ManageAttendees from "./pages/admin/ManageAttendees";
import ManageStationsAdmin from "./pages/admin/ManageStations";
import AdminReports from "./pages/admin/AdminReports";
import Stations from "./pages/admin/PointsRewards";
import Notification from "./pages/admin/AdminNotifications";

// ----------------------------------------------------------------------
// HOME COMPONENT (Smart Redirector + Public Welcome Fallback)
// ----------------------------------------------------------------------
const Home = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (loading) return; // wait until auth state is resolved

    // 👇 If no user logged in — show Welcome page (unless already on it)
    if (!user) {
      if (location.pathname !== "/welcome") {
        navigate("/welcome", { replace: true });
      }
      return;
    }

    // ✅ Role-based redirection
    const userRole = user.role?.toLowerCase();
    console.log("🎯 Redirecting user with role:", userRole);

    // Only redirect if we're not already on the correct page
    const currentPath = location.pathname;
    
    const targetPath = 
      userRole === "admin" ? "/admin/dashboard" :
      userRole === "moderator" ? "/moderator/dashboard" :
      userRole === "attendee" ? "/attendee/journey" : null;

    if (targetPath && currentPath !== targetPath) {
      setRedirecting(true);
      navigate(targetPath, { replace: true });
    }
  }, [loading, user, navigate, location.pathname]);

  // ⏳ Loading state
  if (loading || redirecting) {
    return (
      <div className="text-center mt-10 p-10 text-xl font-semibold">
        {loading ? "Loading user profile..." : "Redirecting..."}
      </div>
    );
  }

  // 🧩 If user exists but role is invalid
  if (user && !["admin", "moderator", "attendee"].includes(user.role?.toLowerCase())) {
    return (
      <div className="text-center mt-10">
        <h1 className="text-2xl font-semibold">
          Welcome {user?.email || "User"}
        </h1>
        <p className="mt-2 text-gray-600">
          Role: <span className="font-semibold">{user?.role || "N/A"}</span>
        </p>
        <p className="mt-2 text-red-500">
          Please check your Firestore document. Role not recognized.
        </p>
        <button
          onClick={logout}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    );
  }

  // 🧭 Fallback (if still no user or while processing)
  return <Welcome />;
};

// ----------------------------------------------------------------------
// APP ROUTES
// ----------------------------------------------------------------------
export default function App() {
  useAutoLogout(360 * 1000);
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/welcome" element={<Welcome />} />

      {/* Attendee routes */}
      <Route
        path="/attendee/dashboard"
        element={
          <ProtectedRoute allowedRoles={["attendee"]}>
            <AttendeeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendee/scan"
        element={
          <ProtectedRoute allowedRoles={["attendee"]}>
            <ScanQR />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendee/profile"
        element={
          <ProtectedRoute allowedRoles={["attendee"]}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendee/leaderboard"
        element={
          <ProtectedRoute allowedRoles={["attendee", "moderator", "admin"]}>
            <Leaderboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendee/journey"
        element={
          <ProtectedRoute allowedRoles={["attendee"]}>
            <YourJourney />
          </ProtectedRoute>
        }
      />

      {/* Moderator routes */}
      <Route
        path="/moderator/dashboard"
        element={
          <ProtectedRoute allowedRoles={["moderator"]}>
            <ModeratorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/moderator/generate-qr"
        element={
          <ProtectedRoute allowedRoles={["moderator", "admin"]}>
            <GenerateQR />
          </ProtectedRoute>
        }
      />
      <Route
        path="/moderator/stations"
        element={
          <ProtectedRoute allowedRoles={["moderator", "admin"]}>
            <ManageStations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/moderator/attendee-management"
        element={
          <ProtectedRoute allowedRoles={["moderator", "admin"]}>
            <AttendeeManager />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ManageUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-attendees"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ManageAttendees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/manage-stations"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ManageStationsAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/points"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Stations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notification"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Notification />
          </ProtectedRoute>
        }
      />

      {/* Root route — handles redirection or shows Welcome */}
      <Route path="/" element={<Home />} />
    </Routes>
  );
}