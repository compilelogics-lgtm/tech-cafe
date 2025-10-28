import { useEffect, useMemo, useState } from "react";
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
  Legend,
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
  const [loading, setLoading] = useState(true);

  // dynamic content
  const [activities, setActivities] = useState([]);
  const [chartMode, setChartMode] = useState("month"); // options: today, week, month, all
  const [chartData, setChartData] = useState([]);

  const navigate = useNavigate();

  // Helper: normalize Firestore timestamp (or date string) into JS Date
  const toDate = (value) => {
    if (!value) return null;
    // Firestore Timestamp object
    if (typeof value.toDate === "function") return value.toDate();
    // If it's already a Date
    if (value instanceof Date) return value;
    // If it's a plain seconds/nanos object
    if (value.seconds && typeof value.seconds === "number") {
      return new Date(value.seconds * 1000);
    }
    // Last fallback: try to construct
    try {
      return new Date(value);
    } catch {
      return null;
    }
  };

  // Build date range filter functions
  const now = () => new Date();
  const startOfToday = () => {
    const d = now();
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const startOfWeek = () => {
    const d = startOfToday();
    const day = d.getDay(); // 0 (Sun) - 6
    // assuming week starts Sunday; adjust if you want Monday
    d.setDate(d.getDate() - day);
    return d;
  };
  const startOfMonth = () => {
    const d = startOfToday();
    d.setDate(1);
    return d;
  };

  // Main data fetch & aggregation
  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      setLoading(true);
      try {
        // Fetch collections
        const [usersSnap, stationsSnap, scansSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "stations")),
          getDocs(collection(db, "scans")),
        ]);

        // Maps and arrays
        const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const stations = stationsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        const scans = scansSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Create lookup maps for users and stations (fast access)
        const usersById = {};
        users.forEach((u) => (usersById[u.id] = u));

        const stationsById = {};
        stations.forEach((s) => (stationsById[s.id] = s));

        // Stats
        const attendees = users.filter((u) => u.role === "attendee");
        const moderators = users.filter((u) => u.role === "moderator");
        const totalPoints = attendees.reduce(
          (sum, u) => sum + (u.totalPoints || 0),
          0
        );

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
          .slice(0, 5);

        setLeaderboard(topAttendees);

        // Build Recent Activity list:
        // - scans -> user earned points at station (use scannedAt)
        // - stations -> new event added (use createdAt)
        // - users -> new user (attendee/moderator) added (use createdAt)
        const scanActivities = scans.map((s) => {
          const ts = toDate(s.scannedAt || s.scanned_at || s.createdAt);
          const user = usersById[s.userId] || {};
          const station = stationsById[s.stationId] || {};
          return {
            ts,
            sortTs: ts ? ts.getTime() : 0,
            text: `🔵 ${user.name || user.email || s.userId} earned ${
              s.pointsEarned || s.points || 0
            } pts at ${station.name || s.stationId}`,
            type: "scan",
            raw: s,
          };
        });

        const stationActivities = stations.map((st) => {
          const ts = toDate(st.createdAt || st.created_at);
          return {
            ts,
            sortTs: ts ? ts.getTime() : 0,
            text: `🆕 New event added: ${st.name}`,
            type: "station",
            raw: st,
          };
        });

        const userActivities = users.map((u) => {
          const ts = toDate(u.createdAt || u.created_at);
          const icon = u.role === "moderator" ? "👩‍💼" : "🧑‍💻";
          return {
            ts,
            sortTs: ts ? ts.getTime() : 0,
            text: `${icon} New ${u.role}: ${u.name || u.email}`,
            type: "user",
            raw: u,
          };
        });

        const mergedActivities = [
          ...scanActivities,
          ...stationActivities,
          ...userActivities,
        ]
          .filter((a) => a.sortTs) // keep entries with a timestamp
          .sort((a, b) => b.sortTs - a.sortTs) // newest first
          .slice(0, 10) // last 10
          .map((a) => ({
            ...a,
            prettyTime: a.ts ? a.ts.toLocaleString() : "",
          }));

        setActivities(mergedActivities);

        // Prepare chart data (aggregate points per station) for the currently selected chartMode
        // We'll compute it here now for initial render and also allow mode changes to recompute below
        const aggregateByStation = (filteredScans) => {
          const map = {};
          filteredScans.forEach((sc) => {
            const sid = sc.stationId || sc.station_id || sc.station;
            const pts = sc.pointsEarned ?? sc.points ?? sc.pointsEarned ?? 0;
            if (!map[sid]) map[sid] = 0;
            map[sid] += Number(pts) || 0;
          });
          // map -> array, include station name if available
          const arr = Object.keys(map).map((sid) => ({
            stationId: sid,
            name: (stationsById[sid] && stationsById[sid].name) || sid,
            points: map[sid],
          }));
          // sort by points descending (optional)
          arr.sort((a, b) => b.points - a.points);
          return arr;
        };

        // store scans/stations/users in state? For simplicity we compute chart now and again on mode change
        // We'll keep raw scans/stations in refs via closure by setting them to state-like variables using setChartData below
        if (!mounted) return;

        // Save raw scans & stations to state by computing chart for the default mode
        const computeForMode = (mode) => {
          const nowDate = new Date();
          let start = null;
          if (mode === "today") start = startOfToday();
          else if (mode === "week") start = startOfWeek();
          else if (mode === "month") start = startOfMonth();
          else start = null; // all time

          const filtered = scans.filter((sc) => {
            const scDate = toDate(
              sc.scannedAt || sc.scanned_at || sc.createdAt
            );
            if (!scDate) return false;
            if (!start) return true;
            return scDate >= start && scDate <= nowDate;
          });

          const aggregated = aggregateByStation(filtered);
          return aggregated;
        };

        // set initial chart data based on current chartMode
        setChartData(computeForMode(chartMode));
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Recompute chart data whenever chartMode changes (refetch scans not necessary; we already read scans in first effect,
  // but because we didn't persist the raw scans in state we will re-run a fresh fetch of scans here to keep things simple and robust)
  useEffect(() => {
    let mounted = true;

    const recompute = async () => {
      try {
        const scansSnap = await getDocs(collection(db, "scans"));
        const stationsSnap = await getDocs(collection(db, "stations"));
        const stations = stationsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        const stationsById = {};
        stations.forEach((s) => (stationsById[s.id] = s));

        const scans = scansSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const toDateLocal = (value) => {
          if (!value) return null;
          if (typeof value.toDate === "function") return value.toDate();
          if (value instanceof Date) return value;
          if (value.seconds && typeof value.seconds === "number")
            return new Date(value.seconds * 1000);
          return new Date(value);
        };

        const startOfRange =
          chartMode === "today"
            ? startOfToday()
            : chartMode === "week"
            ? startOfWeek()
            : chartMode === "month"
            ? startOfMonth()
            : null;

        const nowDate = new Date();

        const filtered = scans.filter((sc) => {
          const scDate = toDateLocal(
            sc.scannedAt || sc.scanned_at || sc.createdAt
          );
          if (!scDate) return false;
          if (!startOfRange) return true;
          return scDate >= startOfRange && scDate <= nowDate;
        });

        // aggregate
        const map = {};
        filtered.forEach((sc) => {
          const sid = sc.stationId || sc.station_id || sc.station;
          const pts = sc.pointsEarned ?? sc.points ?? 0;
          if (!map[sid]) map[sid] = 0;
          map[sid] += Number(pts) || 0;
        });

        const arr = Object.keys(map).map((sid) => ({
          stationId: sid,
          name: (stationsById[sid] && stationsById[sid].name) || sid,
          points: map[sid],
        }));

        arr.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true })
        ); // stable sort by name for chart x-axis
        if (mounted) setChartData(arr);
      } catch (err) {
        console.error("Error recomputing chart data:", err);
      }
    };

    recompute();

    return () => (mounted = false);
  }, [chartMode]);

  if (loading)
    return <div className="text-center p-10 text-lg">Loading dashboard...</div>;

  return (
    <>
      <AdminNavbar />
      <div
        className="min-h-screen p-6 pt-20"
        style={{
          background:
            "linear-gradient(292deg, rgba(34, 78, 97, 0.24) 0%, rgba(27, 55, 82, 0.85) 50%, #0D1B3A 100%)",
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* 📊 Key Metrics (Dark Theme, Dynamic) */}
          {/* 📊 Key Metrics */}
          <div className="bg-[#1E1E28] border border-[#224E61] rounded-xl p-8 flex flex-col">
            <h3 className="text-[28px] font-[Poppins] font-medium text-white mb-10">
              Key Metrics
            </h3>

            <div className="flex flex-col gap-[20px]">
              {[
                {
                  title: "Registrations",
                  value: stats.totalRegistrations,
                  icon: (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="opacity-70"
                    >
                      <path
                        d="M13.25 2.75H15.75C16.1478 2.75 16.5294 2.90804 16.8107 3.18934C17.092 3.47064 17.25 3.85218 17.25 4.25M13.05 19.14L9.33 19.67L9.86 16L19.41 6.46C19.8365 6.06256 20.4007 5.84619 20.9836 5.85647C21.5665 5.86676 22.1226 6.1029 22.5349 6.51513C22.9471 6.92737 23.1832 7.48353 23.1935 8.06643C23.2038 8.64934 22.9874 9.21348 22.59 9.64L13.05 19.14ZM5.5 0.75H12.5C12.5 0.75 13.25 0.75 13.25 1.5V4C13.25 4 13.25 4.75 12.5 4.75H5.5C5.5 4.75 4.75 4.75 4.75 4V1.5C4.75 1.5 4.75 0.75 5.5 0.75Z"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Points Redeemed",
                  value: stats.totalPoints,
                  icon: (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="opacity-70"
                    >
                      <path
                        d="M11 14.5C11 15.88 13.239 17 16 17C18.761 17 21 15.88 21 14.5M3 9.5C3 10.88 5.239 12 8 12C9.126 12 10.165 11.814 11 11.5M3 13C3 14.38 5.239 15.5 8 15.5C9.126 15.5 10.164 15.314 11 15M16 13C13.239 13 11 11.88 11 10.5C11 9.12 13.239 8 16 8C18.761 8 21 9.12 21 10.5C21 11.88 18.761 13 16 13Z"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Active Events",
                  value: stats.activeEvents,
                  icon: (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="white"
                      xmlns="http://www.w3.org/2000/svg"
                      className="opacity-70"
                    >
                      <path d="M21 17V8H7V17H21ZM21 3C21.5304 3 22.0391 3.21071 22.4142 3.58579C22.7893 3.96086 23 4.46957 23 5V17C23 17.5304 22.7893 18.0391 22.4142 18.4142C22.0391 18.7893 21.5304 19 21 19H7C6.46957 19 5.96086 18.7893 5.58579 18.4142C5.21071 18.0391 5 17.5304 5 17V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H8V1H10V3H18V1H20V3H21ZM3 21H17V23H3C2.46957 23 1.96086 22.7893 1.58579 22.4142C1.21071 22.0391 1 21.5304 1 21V9H3V21ZM19 15H15V11H19V15Z" />
                    </svg>
                  ),
                },
                {
                  title: "Total Attendees",
                  value: stats.totalAttendees,
                  icon: (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="white"
                      xmlns="http://www.w3.org/2000/svg"
                      className="opacity-70"
                    >
                      <path d="M9 13.75C6.66 13.75 2 14.92 2 17.25V19H16V17.25C16 14.92 11.34 13.75 9 13.75ZM4.34 17C5.18 16.42 7.21 15.75 9 15.75C10.79 15.75 12.82 16.42 13.66 17H4.34ZM9 12C10.93 12 12.5 10.43 12.5 8.5C12.5 6.57 10.93 5 9 5C7.07 5 5.5 6.57 5.5 8.5C5.5 10.43 7.07 12 9 12ZM9 7C9.83 7 10.5 7.67 10.5 8.5C10.5 9.33 9.83 10 9 10C8.17 10 7.5 9.33 7.5 8.5C7.5 7.67 8.17 7 9 7ZM16.04 13.81C17.2 14.65 18 15.77 18 17.25V19H22V17.25C22 15.23 18.5 14.08 16.04 13.81ZM15 12C16.93 12 18.5 10.43 18.5 8.5C18.5 6.57 16.93 5 15 5C14.46 5 13.96 5.13 13.5 5.35C14.13 6.24 14.5 7.33 14.5 8.5C14.5 9.67 14.13 10.76 13.5 11.65C13.96 11.87 14.46 12 15 12Z" />
                    </svg>
                  ),
                },
              ].map((metric, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-[14px]">
                    {metric.icon}
                    <span className="text-[18px] text-white/70 font-[Poppins]">
                      {metric.title}
                    </span>
                  </div>
                  <span className="text-[18px] text-white font-semibold font-[Poppins]">
                    {metric.value ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 🏆 Dynamic Top Attendees (Dark Themed) */}
          <div className="bg-[#1E1E28] border border-[#224E61] rounded-xl p-8 mb-10">
            <h2 className="text-[28px] font-[Poppins] font-medium text-white mb-8">
              Top Attendees
            </h2>

            {leaderboard.length === 0 ? (
              <p className="text-center text-white/60 italic">
                No attendees with points yet.
              </p>
            ) : (
              <div className="flex flex-col gap-[23px] overflow-y-auto max-h-[400px]">
                {leaderboard.slice(0, 8).map((u, idx) => {
                  // scale the bar width dynamically based on max points
                  const maxPoints = leaderboard[0]?.totalPoints || 1;
                  const barWidth = Math.max(
                    (u.totalPoints / maxPoints) * 136,
                    20 // minimum visible width
                  );
                  const opacity = 1 - idx * 0.1; // gradual fade-down effect

                  return (
                    <div key={u.id || idx} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[18px] text-white/70 font-[Poppins]">
                          {u.name || "Unnamed"}
                        </span>
                        <span className="text-[18px] text-white font-[Poppins] font-semibold">
                          {u.totalPoints || 0} pts
                        </span>
                      </div>
                      <div
                        className="h-[20px] rounded-md transition-all duration-500"
                        style={{
                          width: `${barWidth}px`,
                          backgroundColor: `rgba(0, 224, 255, ${opacity})`,
                        }}
                      ></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* 🕒 Recent Activity (Dark Theme, Dynamic) */}
          <div className="bg-[#1E1E28] border border-[#224E61] rounded-xl w-[412px] h-[236px] p-[40px] flex flex-col">
            <h3 className="text-[28px] font-[Poppins] font-medium text-white mb-6">
              Recent Activity
            </h3>

            {activities.length === 0 ? (
              <p className="text-center text-white/60 italic">
                No recent activity yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-[9px] overflow-y-auto">
                {activities.slice(0, 10).map((a, i) => {
                  // Choose color dynamically (or randomize if you like)
                  const colorMap = [
                    "#00E0FF",
                    "#0000FF",
                    "#800080",
                    "#FF0080",
                    "#FFA500",
                  ];
                  const circleColor = colorMap[i % colorMap.length];

                  return (
                    <li key={i} className="flex items-center gap-[21px]">
                      {/* Colored Circle */}
                      <div
                        className="w-[18px] h-[18px] rounded-full flex-shrink-0"
                        style={{ backgroundColor: circleColor }}
                      ></div>

                      {/* Activity Text */}
                      <div className="flex flex-col">
                        <span className="text-[18px] text-white/70 font-[Poppins] leading-tight">
                          {a.text}
                        </span>
                        {a.prettyTime && (
                          <span className="text-[14px] text-white/40 font-[Poppins] mt-1">
                            {a.prettyTime}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Chart */}
          <div className="flex-1 bg-[#1E1E28] border border-[#224E61] rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-medium text-white">
                Event Overview
              </h3>
              <div className="flex items-center gap-2 bg-white/10 border border-black/10 px-3 py-1.5 rounded-lg">
                <span className="text-sm text-white/70">
                  {chartMode === "month"
                    ? "This Month"
                    : chartMode === "week"
                    ? "This Week"
                    : chartMode === "today"
                    ? "Today"
                    : "All Time"}
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 13 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.91953 4.61837L6.45174 7.08079L3.98395 4.61837L3.22587 5.37645L6.45174 8.60233L9.67761 5.37645L8.91953 4.61837Z"
                    fill="white"
                    fillOpacity="0.72"
                  />
                </svg>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="text-center text-gray-400 py-12 text-sm">
                No data for selected range.
              </div>
            ) : (
              <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
                    <YAxis stroke="rgba(255,255,255,0.7)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E1E28",
                        border: "1px solid #224E61",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="points"
                      stroke="#00E0FF"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {["today", "week", "month", "all"].map((mode) => (
                <Button
                  key={mode}
                  variant={chartMode === mode ? "default" : "outline"}
                  onClick={() => setChartMode(mode)}
                >
                  {mode === "today"
                    ? "Today"
                    : mode === "week"
                    ? "This Week"
                    : mode === "month"
                    ? "This Month"
                    : "All Time"}
                </Button>
              ))}
            </div>

            <div className="text-xs text-gray-400 mt-3 text-center">
              Showing total points earned by attendees per event for selected
              range.
            </div>
          </div>

          {/* ⚙️ Quick Actions */}
          {/* ⚡ Quick Actions (Dark Theme, Export Only) */}
          <div className="bg-[#1E1E28] border border-[#224E61] rounded-xl w-[412px] h-[236px] p-[40px] flex flex-col items-center">
            <h3 className="text-[28px] font-[Poppins] font-medium text-white mb-[60px]">
              Quick Actions
            </h3>

            <button
              onClick={() => navigate("/admin/reports")}
              className="w-[155px] h-[40px] border border-[#00E0FF] rounded-lg flex justify-center items-center text-white text-[18px] font-[Poppins] font-semibold transition-all hover:bg-[#00E0FF]/10"
            >
              Reports
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
