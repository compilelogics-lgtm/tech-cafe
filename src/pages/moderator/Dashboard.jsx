import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import ModeratorNavbar from "../../components/ui/ModeratorNavbar";

export default function ModeratorDashboard() {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [scans, setScans] = useState([]);
  const [attendeesCount, setAttendeesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const stationQuery = query(
          collection(db, "stations"),
          where("createdBy", "==", user.uid)
        );
        const stationSnap = await getDocs(stationQuery);
        const stationData = stationSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setStations(stationData);

        const scanSnap = await getDocs(collection(db, "scans"));
        const allScans = scanSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const myScans = allScans.filter((s) =>
          stationData.some((st) => st.id === s.stationId)
        );
        setScans(myScans);

        const uniqueUsers = new Set(myScans.map((s) => s.userId));
        setAttendeesCount(uniqueUsers.size);
      } catch (err) {
        console.error("❌ Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) fetchData();
  }, [user]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-white">
        Loading moderator dashboard...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <ModeratorNavbar />

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center mt-6">
          🧭 Moderator Dashboard
        </h1>
        <p className="text-center text-gray-300 mb-8 md:text-lg">
          Overview of your stations, scans, and attendee participation
        </p>

        {/* Quick Stats */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-indigo-500 hover:bg-indigo-600 rounded-xl text-center py-6 transition shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Stations</h3>
            <p className="text-3xl font-bold">{stations.length}</p>
          </div>
          <div className="bg-cyan-500 hover:bg-cyan-600 rounded-xl text-center py-6 transition shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Total Scans</h3>
            <p className="text-3xl font-bold">{scans.length}</p>
          </div>
          <div className="bg-teal-500 hover:bg-teal-600 rounded-xl text-center py-6 transition shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Attendees</h3>
            <p className="text-3xl font-bold">{attendeesCount}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
          <Link
            to="/moderator/generate-qr"
            className="bg-indigo-500 hover:bg-indigo-600 rounded-xl text-center py-6 transition border border-white/20 shadow-lg"
          >
            <h3 className="text-lg font-semibold mb-1">Generate QR Codes</h3>
            <p className="text-gray-200 text-sm">Create new event station codes</p>
          </Link>

          <Link
            to="/moderator/stations"
            className="bg-cyan-500 hover:bg-cyan-600 rounded-xl text-center py-6 transition border border-white/20 shadow-lg"
          >
            <h3 className="text-lg font-semibold mb-1">Manage Stations</h3>
            <p className="text-gray-200 text-sm">Edit, activate or deactivate</p>
          </Link>

          <Link
            to="/moderator/attendee-management"
            className="bg-teal-500 hover:bg-teal-600 rounded-xl text-center py-6 transition border border-white/20 shadow-lg"
          >
            <h3 className="text-lg font-semibold mb-1">Attendee Manager</h3>
            <p className="text-gray-200 text-sm">Mark participation & view progress</p>
          </Link>
        </div>

        {/* Stations Table */}
        <div className="bg-white/10 rounded-xl border border-white/20 p-6 overflow-x-auto">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">📍 Your Stations Overview</h2>
          {stations.length === 0 ? (
            <p className="text-gray-400">No stations created yet.</p>
          ) : (
            <table className="min-w-full text-sm md:text-base border-collapse">
              <thead className="bg-white/10 text-gray-300 uppercase text-xs md:text-sm">
                <tr>
                  <th className="px-4 py-2 text-left">Station Name</th>
                  <th className="px-4 py-2 text-center">Points</th>
                  <th className="px-4 py-2 text-center">Active</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((st) => (
                  <tr key={st.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2">{st.name}</td>
                    <td className="px-4 py-2 text-center">{st.points ?? 0}</td>
                    <td className="px-4 py-2 text-center">{st.active ? "✅" : "❌"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
