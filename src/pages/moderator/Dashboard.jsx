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

        const stationQuery = collection(db, "stations");
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
      <div className="text-center p-10 text-lg text-white/70">
        Loading moderator dashboard...
      </div>
    );

  return (
    <>
      <ModeratorNavbar />
      <main className="min-h-screen w-full bg-gradient-to-b from-gray-900 to-gray-800 p-6 pt-20 flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-white text-3xl font-semibold mb-2">
            Moderator Dashboard
          </h1>
          <p className="text-white/60 text-sm">
            Overview of your stations, scans, and attendee participation
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#1E1E28] border border-[#224E61] rounded-xl p-6 flex flex-col gap-4">
          <h2 className="text-white text-2xl font-medium mb-2">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* <Link
              to="/moderator/generate-qr"
              className="w-full bg-[#00E0FF] text-white rounded-lg py-3 text-center hover:bg-[#00C8E6] transition"
            >
              + Generate QR Codes
            </Link> */}

            <Link
              to="/moderator/stations"
              className="w-full border border-[#00E0FF] text-white rounded-lg py-3 text-center hover:bg-[#00E0FF]/10 transition"
            >
              Manage Stations
            </Link>

            <Link
              to="/moderator/attendee-management"
              className="w-full border border-[#00E0FF] text-white rounded-lg py-3 text-center hover:bg-[#00E0FF]/10 transition"
            >
              Attendee Manager
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Stations", value: stations.length },
            { label: "Total Scans", value: scans.length },
            { label: "Unique Attendees", value: attendeesCount },
          ].map((metric, i) => (
            <div
              key={i}
              className="bg-[#1E1E28] border border-[#224E61] rounded-xl p-6 flex flex-col justify-center items-center"
            >
              <span className="text-white/60 text-sm">{metric.label}</span>
              <span className="text-white font-semibold text-xl mt-1">
                {metric.value}
              </span>
            </div>
          ))}
        </div>

        {/* Stations Table */}
        <div className="bg-[#1E1E28] border border-[#224E61] rounded-xl p-6">
          <h2 className="text-white text-2xl font-medium mb-4">
            📍 Your Stations Overview
          </h2>
          {stations.length === 0 ? (
            <p className="text-white/50">No stations created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm md:text-base border-collapse">
                <thead className="bg-[#0000001a] text-white/70 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Station Name</th>
                    <th className="px-4 py-2 text-center font-medium">Points</th>
                    <th className="px-4 py-2 text-center font-medium">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((st) => (
                    <tr
                      key={st.id}
                      className="border-b border-[#224E61]/30 hover:bg-[#00E0FF]/5 transition"
                    >
                      <td className="px-4 py-2 text-white/80">{st.name}</td>
                      <td className="px-4 py-2 text-center text-white/80">
                        {st.points ?? 0}
                      </td>
                      <td className="px-4 py-2 text-center text-white/80">
                        {st.active ? "✅" : "❌"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
