import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/ui/AdminNavbar";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Button } from "../../components/ui/Button";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    totalAttendees: 0,
    totalModerators: 0,
    totalPoints: 0,
    totalStations: 0,
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [activities, setActivities] = useState([]);
  const [chartMode, setChartMode] = useState("month");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const toDate = (value) => {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    if (value instanceof Date) return value;
    if (value.seconds && typeof value.seconds === "number")
      return new Date(value.seconds * 1000);
    return new Date(value);
  };

  const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const startOfWeek = () => {
    const d = startOfToday();
    d.setDate(d.getDate() - d.getDay());
    return d;
  };
  const startOfMonth = () => {
    const d = startOfToday();
    d.setDate(1);
    return d;
  };

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [usersSnap, stationsSnap, scansSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "stations")),
          getDocs(collection(db, "scans")),
        ]);

        const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const stations = stationsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const scans = scansSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const usersById = Object.fromEntries(users.map((u) => [u.id, u]));
        const stationsById = Object.fromEntries(stations.map((s) => [s.id, s]));

        const attendees = users.filter((u) => u.role === "attendee");
        const moderators = users.filter((u) => u.role === "moderator");
        const totalPoints = attendees.reduce((sum, u) => sum + (u.totalPoints || 0), 0);

        if (!mounted) return;

        setStats({
          totalRegistrations: users.length,
          totalAttendees: attendees.length,
          totalModerators: moderators.length,
          totalPoints,
          totalStations: stations.length,
        });

        const topAttendees = attendees
          .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
          .slice(0, 8);
        setLeaderboard(topAttendees);

        const scanActivities = scans.map((s) => {
          const ts = toDate(s.scannedAt || s.scanned_at || s.createdAt);
          const user = usersById[s.userId] || {};
          const station = stationsById[s.stationId] || {};
          return {
            ts,
            sortTs: ts ? ts.getTime() : 0,
            text: `🔵 ${user.name || user.email || s.userId} earned ${s.pointsEarned || s.points || 0} pts at ${station.name || s.stationId}`,
          };
        });

        const stationActivities = stations.map((st) => {
          const ts = toDate(st.createdAt || st.created_at);
          return {
            ts,
            sortTs: ts ? ts.getTime() : 0,
            text: `New event added: ${st.name}`,
          };
        });

        const userActivities = users.map((u) => {
          const ts = toDate(u.createdAt || u.created_at);
          const icon = u.role === "moderator" ? "👩‍💼" : "🧑‍💻";
          return {
            ts,
            sortTs: ts ? ts.getTime() : 0,
            text: `${icon} New ${u.role}: ${u.name || u.email}`,
          };
        });

        const mergedActivities = [...scanActivities, ...stationActivities, ...userActivities]
          .filter((a) => a.sortTs)
          .sort((a, b) => b.sortTs - a.sortTs)
          .slice(0, 3)
          .map((a) => ({ ...a, prettyTime: a.ts ? a.ts.toLocaleString() : "" }));

        setActivities(mergedActivities);

        const computeChart = (mode) => {
          const nowDate = new Date();
          let start = null;
          if (mode === "today") start = startOfToday();
          else if (mode === "week") start = startOfWeek();
          else if (mode === "month") start = startOfMonth();

          const filtered = scans.filter((sc) => {
            const scDate = toDate(sc.scannedAt || sc.scanned_at || sc.createdAt);
            if (!scDate) return false;
            if (!start) return true;
            return scDate >= start && scDate <= nowDate;
          });

          const map = {};
          filtered.forEach((sc) => {
            const sid = sc.stationId || sc.station_id || sc.station;
            const pts = sc.pointsEarned ?? sc.points ?? 0;
            map[sid] = (map[sid] || 0) + pts;
          });

          return Object.keys(map)
            .map((sid) => ({
              stationId: sid,
              name: stationsById[sid]?.name || sid,
              points: map[sid],
            }))
            .sort((a, b) => b.points - a.points);
        };

        setChartData(computeChart(chartMode));
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();

    return () => (mounted = false);
  }, [chartMode]);

  if (loading) return <div className="text-center p-10 text-lg">Loading dashboard...</div>;

  const maxPoints = leaderboard[0]?.totalPoints || 1;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10 pt-24" style={{
  background: "linear-gradient(292deg, rgba(34,78,97,0.24) 0%, rgba(27,55,82,0.85) 50%, #0D1B3A 100%)"
}}>
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    
    {/* Left Column: Chart */}
    <div className="lg:col-span-2 bg-[#1E1E28] border border-[#224E61] rounded-xl p-4 sm:p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[24px] font-medium text-white">Event Overview</h3>
        {/* Dropdown here */}
      </div>
      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
            <YAxis stroke="rgba(255,255,255,0.7)" />
            <Tooltip contentStyle={{ backgroundColor: "#1E1E28", border: "1px solid #224E61", borderRadius: "8px", color: "#fff" }} />
            <Line type="monotone" dataKey="points" stroke="#00E0FF" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Right Column: Key Metrics + Top Attendees */}
    <div className="flex flex-col gap-6">
      
      {/* Key Metrics */}
      <div className="bg-[#1E1E28] border border-[#224E61] rounded-xl p-6 sm:p-8 flex flex-col">
        <h3 className="text-[28px] font-[Poppins] font-medium text-white mb-8">Key Metrics</h3>
        <div className="flex flex-col gap-6">
          {[
            { title: "Registrations", value: stats.totalRegistrations },
            { title: "Points Redeemed", value: stats.totalPoints },
            { title: "Total Attendees", value: stats.totalAttendees },
          ].map((metric, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-[18px] text-white/70 font-[Poppins]">{metric.title}</span>
              <span className="text-[18px] text-white font-semibold font-[Poppins]">{metric.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Attendees */}
      <div className="bg-[#1E1E28] border border-[#224E61] rounded-xl p-6 sm:p-8 flex flex-col">
        <h3 className="text-[28px] font-[Poppins] font-medium text-white mb-6">Top Attendees</h3>
        {leaderboard.length === 0 ? (
          <p className="text-white/60 italic text-center">No attendees with points yet.</p>
        ) : (
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[400px]">
            {leaderboard.map((u, idx) => {
              const barWidth = Math.max((u.totalPoints / maxPoints) * 136, 20);
              const opacity = 1 - idx * 0.1;
              return (
                <div key={u.id || idx} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[18px] text-white/70 font-[Poppins]">{u.name}</span>
                    <span className="text-[18px] text-white font-[Poppins] font-semibold">{u.totalPoints} pts</span>
                  </div>
                  <div
                    className="h-[20px] rounded-xl transition-all duration-500"
                    style={{ width: `${barWidth}px`, backgroundColor: `rgba(0,224,255,${opacity})` }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    {/* Bottom Row: Recent Activity + Quick Actions */}
    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Recent Activity */}
      <div className="bg-[#1E1E28] border border-[#224E61] rounded-xl p-6 sm:p-8 flex flex-col">
        <h3 className="text-[28px] font-[Poppins] font-medium text-white mb-4">Recent Activity</h3>
        <ul className="flex flex-col gap-3 overflow-y-auto max-h-[236px]">
          {activities.map((a, i) => {
            const colorMap = ["#00E0FF", "#0000FF", "#800080", "#FF0080", "#FFA500"];
            return (
              <li key={i} className="flex items-start gap-4">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: colorMap[i % colorMap.length] }} />
                <div className="flex flex-col">
                  <span className="text-[18px] text-white/70 font-[Poppins]">{a.text}</span>
                  {a.prettyTime && <span className="text-[14px] text-white/40 font-[Poppins] mt-1">{a.prettyTime}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#1E1E28] border border-[#224E61] rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center">
        <h3 className="text-[28px] font-[Poppins] font-medium text-white mb-16">Quick Actions</h3>
        <button
          onClick={() => navigate("/admin/reports")}
          className="w-[155px] h-[40px] border border-[#00E0FF] rounded-lg flex justify-center items-center text-white text-[18px] font-[Poppins] font-semibold transition-all hover:bg-[#00E0FF]/10"
        >
          Reports
        </button>
      </div>

    </div>
  </div>
</div>

  );
}
