import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { saveAs } from "file-saver";
import AdminNavbar from "../../components/ui/AdminNavbar";

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
        const usersSnap = await getDocs(collection(db, "users"));
        const stationsSnap = await getDocs(collection(db, "stations"));
        const scansSnap = await getDocs(collection(db, "scans"));

        const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const stations = stationsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const scans = scansSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const attendees = users.filter((u) => u.role === "attendee").length;
        const moderators = users.filter((u) => u.role === "moderator").length;

        const top = [...users]
          .filter((u) => u.role === "attendee")
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .slice(0, 5);

        const stationCounts = {};
        scans.forEach((s) => {
          stationCounts[s.stationId] = (stationCounts[s.stationId] || 0) + 1;
        });
        const popular = stations
          .map((st) => ({ ...st, count: stationCounts[st.id] || 0 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        const q = query(collection(db, "scans"), orderBy("scannedAt", "desc"), limit(5));
        const recSnap = await getDocs(q);
        const recent = recSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        setSummary({ attendees, moderators, stations: stations.length, scans: scans.length });
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
    <>
      <AdminNavbar />
      <div className="min-h-screen bg-gray-100 p-6 pt-20">
         {/* Export */}
          {/* <div className="text-center mt-6">
            <button
              onClick={exportCSV}
              className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded transition"
            >
              Export Summary (CSV)
            </button>
          </div> */}
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
            📊 Event Reports
          </h1>

          {/* Summary cards */}
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Attendees", value: summary.attendees },
              { label: "Moderators", value: summary.moderators },
              { label: "Stations", value: summary.stations },
              { label: "Scans", value: summary.scans },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow hover:shadow-md p-4 text-center transition"
              >
                <p className="text-gray-700 text-lg">{card.label}</p>
                <h2 className="text-gray-900 text-3xl font-bold mt-2">{card.value}</h2>
              </div>
            ))}
          </div>

          {/* Two-column layout for top attendees/popular stations and recent scans */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Top Attendees */}
              <Section title="🏅 Top Attendees">
                {topAttendees.map((a, i) => (
                  <li key={a.id} className="flex justify-between border-b border-gray-200 py-2">
                    <span>#{i + 1} {a.name}</span>
                    <span className="font-semibold">{a.totalPoints} pts</span>
                  </li>
                ))}
              </Section>

              {/* Popular Stations */}
              <Section title="📍 Most Popular Stations">
                {popularStations.map((st, i) => (
                  <li key={st.id} className="flex justify-between border-b border-gray-200 py-2">
                    <span>#{i + 1} {st.name}</span>
                    <span className="font-semibold">{st.count} visits</span>
                  </li>
                ))}
              </Section>
            </div>
          </div>

         
        </div>
      </div>
    </>
  );
}

// Reusable section wrapper
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="text-xl font-semibold mb-3 text-gray-700">{title}</h2>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}
