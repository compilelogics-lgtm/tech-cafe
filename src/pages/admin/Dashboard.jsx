import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/ui/AdminNavbar";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    attendees: 0,
    moderators: 0,
    stations: 0,
    totalPoints: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const users = usersSnap.docs.map((d) => d.data());

        const attendees = users.filter((u) => u.role === "attendee");
        const moderators = users.filter((u) => u.role === "moderator");

        const totalPoints = attendees.reduce(
          (sum, u) => sum + (u.totalPoints || 0),
          0
        );

        const stationsSnap = await getDocs(collection(db, "stations"));
        const stations = stationsSnap.docs.length;

        setStats({
          attendees: attendees.length,
          moderators: moderators.length,
          stations,
          totalPoints,
        });
      } catch (err) {
        console.error("Error loading admin stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading)
    return <div className="text-center p-10 text-lg">Loading dashboard...</div>;

  return (
    <>
      <AdminNavbar />
      <div className="min-h-screen bg-gray-100 p-6 pt-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
            🧭 Admin Dashboard
          </h1>

          {/* STATS GRID */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <DashboardCard title="Attendees" value={stats.attendees} />
            <DashboardCard title="Moderators" value={stats.moderators} />
            <DashboardCard title="Stations" value={stats.stations} />
            <DashboardCard title="Total Points" value={stats.totalPoints} />
          </div>

          {/* QUICK ACTIONS */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 text-center">
              Quick Actions
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickAction
                text="Manage Attendees"
                onClick={() => navigate("/admin/manage-attendees")}
              />
              <QuickAction
                text="Manage Moderators"
                onClick={() => navigate("/admin/manage-users")}
              />
              <QuickAction
                text="Manage Stations"
                onClick={() => navigate("/admin/manage-stations")}
              />
              <QuickAction
                text="Reports"
                onClick={() => navigate("/admin/reports")}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Minimal card component
function DashboardCard({ title, value }) {
  return (
    <div className="rounded-xl bg-white shadow hover:shadow-md p-6 text-center transition">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// Minimal quick action button
function QuickAction({ text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-gray-800 hover:bg-gray-900 text-white p-3 rounded-lg transition"
    >
      {text}
    </button>
  );
}
