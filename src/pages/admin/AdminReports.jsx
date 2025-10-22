import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { saveAs } from "file-saver";

export default function AdminReports() {
  const [summary, setSummary] = useState({
    attendees: 0,
    moderators: 0,
    stations: 0,
    scans: 0,
  });
  const [topAttendees, setTopAttendees] = useState([]);
  const [popularStations, setPopularStations] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        // 🧮 Load all collections
        const usersSnap = await getDocs(collection(db, "users"));
        const stationsSnap = await getDocs(collection(db, "stations"));
        const scansSnap = await getDocs(collection(db, "scans"));

        const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const stations = stationsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const scans = scansSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // 🧾 Summary
        const attendees = users.filter((u) => u.role === "attendee").length;
        const moderators = users.filter((u) => u.role === "moderator").length;

        // 🏆 Top Attendees
        const top = [...users]
          .filter((u) => u.role === "attendee")
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .slice(0, 5);

        // 📍 Popular Stations
        const stationCounts = {};
        scans.forEach((s) => {
          stationCounts[s.stationId] = (stationCounts[s.stationId] || 0) + 1;
        });
        const popular = stations
          .map((st) => ({
            ...st,
            count: stationCounts[st.id] || 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // 🕒 Recent Activity
        const q = query(collection(db, "scans"), orderBy("scannedAt", "desc"), limit(5));
        const recSnap = await getDocs(q);
        const recent = recSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        setSummary({
          attendees,
          moderators,
          stations: stations.length,
          scans: scans.length,
        });
        setTopAttendees(top);
        setPopularStations(popular);
        setRecentScans(recent);
      } catch (e) {
        console.error("Error loading reports:", e);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  // 📤 Export summary data
  const exportCSV = () => {
    const rows = [
      ["Type", "Count"],
      ["Attendees", summary.attendees],
      ["Moderators", summary.moderators],
      ["Stations", summary.stations],
      ["Scans", summary.scans],
    ];

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "event_report.csv");
  };

  if (loading) return <div className="p-10 text-center">Loading reports...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-blue-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">📊 Event Reports</h1>

        {/* Summary cards */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Attendees", value: summary.attendees, color: "bg-blue-600" },
            { label: "Moderators", value: summary.moderators, color: "bg-purple-600" },
            { label: "Stations", value: summary.stations, color: "bg-green-600" },
            { label: "Scans", value: summary.scans, color: "bg-yellow-600" },
          ].map((card, i) => (
            <div
              key={i}
              className={`${card.color} rounded-lg p-4 text-center shadow-lg`}
            >
              <p className="text-lg">{card.label}</p>
              <h2 className="text-3xl font-bold mt-2">{card.value}</h2>
            </div>
          ))}
        </div>

        {/* Top attendees */}
        <div className="bg-white/10 border border-white/20 rounded-lg p-4 mb-8">
          <h2 className="text-xl font-semibold mb-3">🏅 Top Attendees</h2>
          <ul className="space-y-2">
            {topAttendees.map((a, i) => (
              <li key={a.id} className="flex justify-between">
                <span>
                  #{i + 1} {a.name}
                </span>
                <span className="font-semibold">{a.totalPoints} pts</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Popular stations */}
        <div className="bg-white/10 border border-white/20 rounded-lg p-4 mb-8">
          <h2 className="text-xl font-semibold mb-3">📍 Most Popular Stations</h2>
          <ul className="space-y-2">
            {popularStations.map((st, i) => (
              <li key={st.id} className="flex justify-between">
                <span>
                  #{i + 1} {st.name}
                </span>
                <span className="font-semibold">{st.count} visits</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent scans */}
        <div className="bg-white/10 border border-white/20 rounded-lg p-4 mb-8">
          <h2 className="text-xl font-semibold mb-3">🕒 Recent Scans</h2>
          <ul className="space-y-2">
            {recentScans.map((r) => (
              <li key={r.id} className="flex justify-between text-sm">
                <span>{r.userId}</span>
                <span>{r.stationId}</span>
                <span className="text-gray-300">
                  {r.scannedAt?.toDate?.().toLocaleString?.() || ""}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Export */}
        <div className="text-center">
          <button
            onClick={exportCSV}
            className="bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700"
          >
            Export Summary (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}
