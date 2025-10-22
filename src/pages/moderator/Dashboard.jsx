import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";

export default function ModeratorDashboard() {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [scans, setScans] = useState([]);
  const [attendeesCount, setAttendeesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🔹 Load moderator's stations
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch stations created by this moderator
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

        // Fetch all scans for these stations
        const scanSnap = await getDocs(collection(db, "scans"));
        const allScans = scanSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const myScans = allScans.filter((s) =>
          stationData.some((st) => st.id === s.stationId)
        );

        setScans(myScans);

        // Count unique attendees scanned at their stations
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
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-indigo-800 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-center">
          🧭 Moderator Dashboard
        </h1>
        <p className="text-center text-gray-300 mb-8">
          Overview of your stations, scans, and attendee participation
        </p>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/10 rounded-xl p-6 text-center border border-white/20">
            <h2 className="text-4xl font-bold text-yellow-300">
              {stations.length}
            </h2>
            <p className="text-gray-300 mt-2">Your Active Stations</p>
          </div>

          <div className="bg-white/10 rounded-xl p-6 text-center border border-white/20">
            <h2 className="text-4xl font-bold text-green-300">{scans.length}</h2>
            <p className="text-gray-300 mt-2">Total Scans Logged</p>
          </div>

          <div className="bg-white/10 rounded-xl p-6 text-center border border-white/20">
            <h2 className="text-4xl font-bold text-indigo-300">
              {attendeesCount}
            </h2>
            <p className="text-gray-300 mt-2">Unique Attendees</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Link
            to="/moderator/generate-qr"
            className="bg-indigo-600 hover:bg-indigo-700 rounded-xl text-center py-6 transition border border-white/20"
          >
            <h3 className="text-lg font-semibold mb-1">Generate QR Codes</h3>
            <p className="text-gray-300 text-sm">Create new event station codes</p>
          </Link>

          <Link
            to="/moderator/stations"
            className="bg-blue-600 hover:bg-blue-700 rounded-xl text-center py-6 transition border border-white/20"
          >
            <h3 className="text-lg font-semibold mb-1">Manage Stations</h3>
            <p className="text-gray-300 text-sm">Edit, activate or deactivate</p>
          </Link>

          <Link
            to="/moderator/attendee-management"
            className="bg-green-600 hover:bg-green-700 rounded-xl text-center py-6 transition border border-white/20"
          >
            <h3 className="text-lg font-semibold mb-1">Attendee Manager</h3>
            <p className="text-gray-300 text-sm">Mark participation & view progress</p>
          </Link>
        </div>

        {/* Station Summary Table */}
        <div className="bg-white/10 rounded-xl border border-white/20 p-6">
          <h2 className="text-xl font-semibold mb-4">📍 Your Stations Overview</h2>

          {stations.length === 0 ? (
            <p className="text-gray-400">No stations created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white/10 text-gray-300 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-2 text-left">Station Name</th>
                    <th className="px-4 py-2 text-center">Points</th>
                    <th className="px-4 py-2 text-center">Active</th>
                    <th className="px-4 py-2 text-center">Scans</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((st) => {
                    const scanCount = scans.filter(
                      (s) => s.stationId === st.id
                    ).length;
                    return (
                      <tr
                        key={st.id}
                        className="border-b border-white/10 hover:bg-white/5"
                      >
                        <td className="px-4 py-2">{st.name}</td>
                        <td className="px-4 py-2 text-center">
                          {st.points ?? 0}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {st.active ? "✅" : "❌"}
                        </td>
                        <td className="px-4 py-2 text-center">{scanCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
