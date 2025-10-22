import { Routes, Route, useNavigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { useEffect } from "react";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Attendee
import ScanQR from "./pages/attendee/ScanQR";
import { Dashboard } from "./pages/attendee/Dashboard";
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
import ManageUsers from "./pages/admin/ManageModerators"; // <-- UNCOMMENTED/ADDED IMPORT
import ManageAttendees from "./pages/admin/ManageAttendees";
import ManageStationsAdmin from "./pages/admin/ManageStations";
import AdminReports from "./pages/admin/AdminReports";

// ----------------------------------------------------------------------
// HOME COMPONENT (Role Redirector)
// ----------------------------------------------------------------------
const Home = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only run redirection logic once loading is FALSE and user is present
    if (!loading && user) {
      // NOTE: user.role MUST match the string exactly (e.g., "admin", not "Admin")
      const userRole = user.role;
      console.log("🎯 Role for redirection:", userRole);

      // Redirect based on the fetched role
      if (userRole === "admin") {
        console.log("➡️ Redirecting to ADMIN dashboard");
        navigate("/admin/dashboard");
      } else if (userRole === "moderator") {
        console.log("➡️ Redirecting to MODERATOR generate-qr");
        navigate("/moderator/generate-qr");
      } else if (userRole === "attendee") {
        console.log("➡️ Redirecting to ATTENDEE dashboard");
        navigate("/attendee/dashboard");
      } else {
        console.log("❌ NO ROLE MATCH - showing fallback UI");
      }
    }
  }, [loading, user, navigate]);

  // Display loading screen until role is fetched/redirection occurs
  if (loading) {
    return (
      <div className="text-center mt-10 p-10 text-xl font-semibold">
        Loading user profile...
      </div>
    );
  }

  // Fallback UI (If user is logged in but has no recognized role)
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
};
// ----------------------------------------------------------------------

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Attendee routes (unchanged) */}
      <Route
        path="/attendee/scan"
        element={
          <ProtectedRoute allowedRoles={["attendee"]}>
            <ScanQR />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendee/dashboard"
        element={
          <ProtectedRoute allowedRoles={["attendee"]}>
            <Dashboard />
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
          <ProtectedRoute allowedRoles={["attendee", "admin", "moderator"]}>
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

      {/* Moderator routes (unchanged) */}

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


      {/* Admin routes: NOW ACTIVE */}
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
      /><Route
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



      {/* Default home route (now acts as a redirector) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
