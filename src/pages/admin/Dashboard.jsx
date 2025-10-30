import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useAuth } from "../../contexts/AuthContext";
import AdminNavbar from "../../components/ui/AdminNavbar";
import { Button } from "../../components/ui/Button";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const PAGE_SIZE = 6;

export default function AdminPointsRewards() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") navigate("/admin", { replace: true });
  }, [user]);

  // Data states
  const [stations, setStations] = useState([]);
  const [scans, setScans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI states
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [range, setRange] = useState("month");
  const [granularity, setGranularity] = useState("day");

  function exportToCSV(data, fileName = "data.csv") {
    if (!data || !data.length) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","), // header row first
      ...data.map((row) =>
        headers.map((fieldName) => `"${row[fieldName] ?? ""}"`).join(",")
      ),
    ];

    const csvContent = csvRows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Firestore subscriptions
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const unsubStations = onSnapshot(collection(db, "stations"), (snap) => {
      if (!mounted) return;
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort(
        (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
      );
      setStations(data);
    });

    const unsubScans = onSnapshot(
      query(collection(db, "scans"), orderBy("scannedAt", "desc")),
      (snap) => {
        if (!mounted) return;
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setScans(data);
      }
    );

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      if (!mounted) return;
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(data);
    });

    const t = setTimeout(() => setLoading(false), 300);

    return () => {
      mounted = false;
      unsubStations();
      unsubScans();
      unsubUsers();
      clearTimeout(t);
    };
  }, []);

  const usersById = useMemo(() => {
    const map = {};
    users.forEach((u) => (map[u.id] = u));
    return map;
  }, [users]);

  const stationsById = useMemo(() => {
    const map = {};
    stations.forEach((s) => (map[s.id] = s));
    return map;
  }, [stations]);

  const totalPointsAllotted = useMemo(
    () => stations.reduce((sum, s) => sum + (Number(s.points) || 0), 0),
    [stations]
  );
  const totalPointsAwarded = useMemo(
    () => scans.reduce((sum, sc) => sum + (Number(sc.pointsEarned) || 0), 0),
    [scans]
  );
  const pendingPoints = totalPointsAllotted - totalPointsAwarded;

  const recentNotifications = useMemo(() => {
    return scans
      .slice(0, 12)
      .map((sc) => {
        const u = usersById[sc.userId] || {};
        const st = stationsById[sc.stationId] || {};
        const time = sc.scannedAt ? asDate(sc.scannedAt) : null;
        return {
          text: `${u.name || u.email || sc.userId} earned ${
            sc.pointsEarned || sc.points || 0
          } pts at ${st.name || sc.stationId}`,
          time,
          raw: sc,
        };
      })
      .filter(Boolean);
  }, [scans, usersById, stationsById]);

  const filteredStations = useMemo(() => {
    if (!search) return stations;
    const q = search.toLowerCase();
    return stations.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q) ||
        (s.id || "").toLowerCase().includes(q)
    );
  }, [stations, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStations.length / PAGE_SIZE)
  );
  const pageStations = filteredStations.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const chartData = useMemo(() => {
    const now = new Date();
    let start = null;
    if (range === "today") {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
    } else if (range === "week") {
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - now.getDay()
      );
    } else if (range === "month")
      start = new Date(now.getFullYear(), now.getMonth(), 1);

    const formatKey = (d) => {
      if (!d) return "";
      if (granularity === "hour") {
        const y = d.getFullYear(),
          m = `${d.getMonth() + 1}`.padStart(2, "0"),
          day = `${d.getDate()}`.padStart(2, "0"),
          hr = `${d.getHours()}`.padStart(2, "0");
        return `${y}-${m}-${day} ${hr}:00`;
      } else {
        const y = d.getFullYear(),
          m = `${d.getMonth() + 1}`.padStart(2, "0"),
          day = `${d.getDate()}`.padStart(2, "0");
        return `${y}-${m}-${day}`;
      }
    };

    const map = {};
    scans.forEach((sc) => {
      const dateObj = asDate(sc.scannedAt);
      if (!dateObj || (start && dateObj < start)) return;
      const key = formatKey(dateObj);
      if (!map[key]) map[key] = 0;
      map[key] += Number(sc.pointsEarned || sc.points || 0);
    });

    const arr = Object.keys(map)
      .sort()
      .map((k) => ({ time: k, points: map[k] }));
    if (!arr.length && range === "today" && granularity === "hour") {
      const r = [];
      const startToday = new Date();
      startToday.setHours(0, 0, 0, 0);
      for (let h = 0; h < 24; h++) {
        const d = new Date(startToday);
        d.setHours(h);
        const key = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(
          2,
          "0"
        )}-${`${d.getDate()}`.padStart(2, "0")} ${`${d.getHours()}`.padStart(
          2,
          "0"
        )}:00`;
        r.push({ time: key, points: 0 });
      }
      return r;
    }
    return arr;
  }, [scans, range, granularity]);

  function asDate(value) {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    if (value.seconds) return new Date(value.seconds * 1000);
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
    return null;
  }

  const stationSummary = useMemo(() => {
    return stations.map((s) => {
      const stationScans = scans.filter((sc) => sc.stationId === s.id);
      return {
        ...s,
        participations: stationScans.length,
        uniqueUsers: new Set(stationScans.map((sc) => sc.userId)).size,
      };
    });
  }, [stations, scans]);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));
  useEffect(() => setPage(1), [search, stations.length]);

  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `
      linear-gradient(248.32deg, rgba(34, 78, 97, 0.24) 1.53%, rgba(27, 55, 82, 0.85) 48.49%, #0D1B3A 95.44%),
      linear-gradient(115.02deg, rgba(34, 78, 97, 0.64) 20.88%, #0D1B3A 100%)
    `,
        }}
      >
        Loading dashboard...
      </div>
    );

  return (
    <>
      <AdminNavbar />
      <main
        className="min-h-screen w-full p-6 pt-20 flex flex-col gap-6"
        style={{
          background: `
      linear-gradient(248.32deg, rgba(34, 78, 97, 0.24) 1.53%, rgba(27, 55, 82, 0.85) 48.49%, #0D1B3A 95.44%),
      linear-gradient(115.02deg, rgba(34, 78, 97, 0.64) 20.88%, #0D1B3A 100%)
    `,
        }}
      >
        {/* Key Metrics + Event Overview Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Overview */}
          <div
            className="lg:col-span-2 rounded-xl p-6 flex flex-col"
            style={{
              background: "rgba(30, 30, 40, 1)",
              border: "1px solid rgba(34, 78, 97, 1)",
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-2xl font-medium">
                Event Overview
              </h2>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="bg-[#1E1E28] border border-[#224E61] text-[#ffffffb8] px-3 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00E0FF] appearance-none cursor-pointer"
                style={{
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  colorScheme: "dark",
                  backgroundImage:
                    'url(\'data:image/svg+xml;utf8,<svg fill="%23ffffffb8" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M5.25 7.5L10 12.5L14.75 7.5H5.25Z"/></svg>\')',
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.5rem center",
                  backgroundSize: "1rem",
                }}
              >
                <option className="bg-[#1E1E28] text-[#ffffffb8]" value="today">
                  Today
                </option>
                <option className="bg-[#1E1E28] text-[#ffffffb8]" value="week">
                  Week
                </option>
                <option className="bg-[#1E1E28] text-[#ffffffb8]" value="month">
                  Month
                </option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#224E61" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E1E28",
                    border: "1px solid #224E61",
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="points"
                  stroke="#00E0FF"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Key Metrics */}
          <div className="bg-[#1E1E28] border border-[#224E61] rounded-xl p-6 flex flex-col">
            <h2 className="text-white text-2xl font-medium mb-6">
              Key Metrics
            </h2>
            <div className="flex flex-col gap-4 bg-transparent">
              {[
                {
                  label: "Registrations",
                  value: totalPointsAllotted,
                  icon: (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2" />
                    </svg>
                  ),
                },
                {
                  label: "Points Redeemed",
                  value: totalPointsAwarded,
                  icon: (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="4"
                        y="4"
                        width="16"
                        height="16"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <path
                        d="M4 12h16M12 4v16"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </svg>
                  ),
                },
                {
                  label: "Active Events",
                  value: stations.length,
                  icon: (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <path
                        d="M6 12h12M12 6v12"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </svg>
                  ),
                },
                {
                  label: "Pending Points",
                  value: pendingPoints,
                  icon: (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4h16v16H4z" stroke="white" strokeWidth="2" />
                      <path d="M4 12h16" stroke="white" strokeWidth="2" />
                    </svg>
                  ),
                },
              ].map((metric, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    {metric.icon}
                    <span className="text-white/70 text-sm">
                      {metric.label}
                    </span>
                  </div>
                  <span className="text-white font-semibold text-lg">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Attendees + Recent Activity + Quick Actions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Attendees */}
<div className="bg-[#1E1E28] border border-[#224E61] rounded-xl p-6 flex flex-col">
  <h2 className="text-white text-2xl font-medium mb-6">Top Attendees</h2>

  <p className="text-[#00E0FF]/70 text-sm mb-4">
    Total Available Points: {totalPointsAllotted}
  </p>

  <div className="flex flex-col gap-5">
    {users
      .filter((u) => u.role === "attendee")
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0)) // sort by top points
      .map((u) => {
        const points = Number(u.totalPoints || 0);
        const progress =
          totalPointsAllotted > 0
            ? Math.min((points / totalPointsAllotted) * 100, 100)
            : 0;

        return (
          <div
            key={u.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            {/* Left: Attendee name + role */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="text-[16px] sm:text-[18px] text-white/80 truncate max-w-[160px]">
                {u.name || u.email}
              </span>
              <span className="text-[14px] text-[#00E0FF]/90 font-medium bg-[#224E61]/40 px-2 py-[2px] rounded-md w-fit">
                {u.role}
              </span>
            </div>

            {/* Right: Progress + Points */}
            <div className="flex items-center gap-3 w-full sm:w-[65%] relative">
              <div className="relative flex-1 h-[16px] bg-[#224E61]/50 rounded-md overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full rounded-md transition-all duration-500 ease-in-out"
                  style={{
                    width: `${progress}%`,
                    background: `rgba(0, 224, 255, ${0.9 - progress / 150})`,
                  }}
                ></div>
              </div>
              <span className="text-white font-semibold text-[15px] sm:text-[16px] whitespace-nowrap">
                {points} pts
              </span>
            </div>
          </div>
        );
      })}
  </div>
</div>

          {/* Recent Activity */}
          <div className="bg-[#1E1E28] border border-[#224E61] rounded-xl p-6 flex flex-col">
            <h2 className="text-white text-2xl font-medium mb-4">
              Recent Activity
            </h2>
            <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {recentNotifications.map((n, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: [
                        "#00E0FF",
                        "#0000FF",
                        "#800080",
                        "#FF0080",
                        "#FFA500",
                      ][i % 5],
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-white/70 text-sm">{n.text}</span>
                    {n.time && (
                      <span className="text-white/40 text-xs">
                        {n.time.toLocaleString()}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#1E1E28] border border-[#224E61] rounded-xl p-6 flex flex-col justify-between">
            <h2 className="text-white text-2xl font-medium mb-4">
              Quick Actions
            </h2>
            <button className="w-full bg-[#00E0FF] text-white rounded-lg py-2 mb-2 hover:bg-[#00C8E6]">
              + Create Event
            </button>
            <button
              className="w-full border border-[#00E0FF] text-white rounded-lg py-2 hover:bg-[#00E0FF]/10"
              onClick={() => {
                // Choose which data to export
                const exportData = users.map((u) => ({
                  ID: u.id,
                  Name: u.name || "",
                  Email: u.email || "",
                  Role: u.role || "",
                  Points: u.points || 0,
                }));
                exportToCSV(exportData, "users.csv");
              }}
            >
              Export Data
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
