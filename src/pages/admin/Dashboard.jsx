import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useNavigate } from "react-router-dom";

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
        // Fetch all users
        const usersSnap = await getDocs(collection(db, "users"));
        const users = usersSnap.docs.map((d) => d.data());

        // Separate counts
        const attendees = users.filter((u) => u.role === "attendee");
        const moderators = users.filter((u) => u.role === "moderator");

        const totalPoints = attendees.reduce(
          (sum, u) => sum + (u.totalPoints || 0),
          0
        );

        // Fetch all stations
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-blue-800 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          🧭 Admin Dashboard
        </h1>

        {/* STATS GRID */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <DashboardCard title="Attendees" value={stats.attendees} color="bg-green-500" />
          <DashboardCard title="Moderators" value={stats.moderators} color="bg-yellow-500" />
          <DashboardCard title="Stations" value={stats.stations} color="bg-blue-500" />
          <DashboardCard title="Total Points" value={stats.totalPoints} color="bg-purple-500" />
        </div>

        {/* QUICK LINKS */}
        <div className="bg-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate("/admin/manage-attendees")}
              className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition"
            >
              Manage Attendees
            </button>
            <button
              onClick={() => navigate("/admin/manage-users")}
              className="bg-yellow-600 hover:bg-yellow-700 text-white p-3 rounded-lg transition"
            >
              Manage Moderators
            </button>
            <button
              onClick={() => navigate("/admin/manage-stations")}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition"
            >
              Manage Stations
            </button>
            <button
              onClick={() => navigate("/admin/reports")}
              className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition"
            >
              Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, value, color }) {
  return (
    <div className={`rounded-xl shadow-lg p-6 text-center ${color}`}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
