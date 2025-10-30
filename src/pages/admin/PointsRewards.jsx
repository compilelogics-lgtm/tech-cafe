import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../../utils/firebase";
import AdminNavbar from "../../components/ui/AdminNavbar";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

/**
 * AdminPointsRewards
 * - Admin-only page
 * - Stats (total allotted, awarded, pending)
 * - Stations table (search + pagination)
 * - Recent notifications (latest scans)
 * - Curvy line chart aggregated by time range
 */

const PAGE_SIZE = 6;

export default function AdminPointsRewards() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Access control: only admins
  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") {
      // if not admin, redirect or show unauthorized
      // we navigate back to dashboard (or show message)
      navigate("/admin", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Data from Firestore
  const [stations, setStations] = useState([]);
  const [scans, setScans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI states
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [range, setRange] = useState("month"); // today, week, month, all
  const [granularity, setGranularity] = useState("day"); // hour or day (chart mode)

  // Real-time listeners for stations, scans, users
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const unsubStations = onSnapshot(collection(db, "stations"), (snap) => {
      if (!mounted) return;
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // sort by createdAt desc if available
      data.sort((a, b) => {
        const ta = a.createdAt?.seconds ?? 0;
        const tb = b.createdAt?.seconds ?? 0;
        return tb - ta;
      });
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

    // finish loading when we have at least stations and scans snapshot
    // small timeout to let initial snapshots settle
    const t = setTimeout(() => setLoading(false), 300);

    return () => {
      mounted = false;
      unsubStations();
      unsubScans();
      unsubUsers();
      clearTimeout(t);
    };
  }, []);

  // Derived lookups
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

  // Stats calculations
  const totalPointsAllotted = useMemo(
    () => stations.reduce((sum, s) => sum + (Number(s.points) || 0), 0),
    [stations]
  );

  const totalPointsAwarded = useMemo(
    () => scans.reduce((sum, sc) => sum + (Number(sc.pointsEarned) || 0), 0),
    [scans]
  );

  const pendingPoints = totalPointsAllotted - totalPointsAwarded;

  // Recent notifications (latest scans)
  const recentNotifications = useMemo(() => {
    return scans
      .slice(0, 12)
      .map((sc) => {
        const u = usersById[sc.userId] || {};
        const st = stationsById[sc.stationId] || {};
        const time = sc.scannedAt ? asDate(sc.scannedAt) : null;
        return {
          text: `${u.name || u.email || sc.userId} earned ${sc.pointsEarned || sc.points || 0} pts at ${st.name || sc.stationId}`,
          time,
          raw: sc,
        };
      })
      .filter(Boolean);
  }, [scans, usersById, stationsById]);

  // Station table data with search and pagination
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

  const totalPages = Math.max(1, Math.ceil(filteredStations.length / PAGE_SIZE));
  const pageStations = filteredStations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Chart data: aggregate scans by time based on range & granularity
  const chartData = useMemo(() => {
    // determine startTime based on range
    const now = new Date();
    let start = null;
    if (range === "today") {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
    } else if (range === "week") {
      start = new Date(now);
      const day = start.getDay(); // 0..6
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - day);
    } else if (range === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      start = null; // all time
    }

    // function to get bucket key
    const formatKey = (d) => {
      if (!d) return "";
      if (granularity === "hour") {
        // "YYYY-MM-DD HH:00"
        const y = d.getFullYear();
        const m = `${d.getMonth() + 1}`.padStart(2, "0");
        const day = `${d.getDate()}`.padStart(2, "0");
        const hr = `${d.getHours()}`.padStart(2, "0");
        return `${y}-${m}-${day} ${hr}:00`;
      } else {
        // day -> "YYYY-MM-DD"
        const y = d.getFullYear();
        const m = `${d.getMonth() + 1}`.padStart(2, "0");
        const day = `${d.getDate()}`.padStart(2, "0");
        return `${y}-${m}-${day}`;
      }
    };

    // accumulate
    const map = {};
    scans.forEach((sc) => {
      const ts = sc.scannedAt;
      const dateObj = asDate(ts);
      if (!dateObj) return;
      if (start && dateObj < start) return;
      const key = formatKey(dateObj);
      if (!map[key]) map[key] = 0;
      map[key] += Number(sc.pointsEarned || sc.points || 0);
    });

    // convert to array sorted by key (chronological)
    const arr = Object.keys(map)
      .sort((a, b) => {
        // lexicographic works because format YYYY-MM-DD [HH:00]
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      })
      .map((k) => ({ time: k, points: map[k] }));

    // if empty and range is 'today' create hourly buckets for today to show zero-line (optional)
    if (arr.length === 0 && range === "today" && granularity === "hour") {
      const r = [];
      const startToday = new Date();
      startToday.setHours(0, 0, 0, 0);
      for (let h = 0; h < 24; h++) {
        const d = new Date(startToday);
        d.setHours(h);
        const key = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")} ${`${d.getHours()}`.padStart(2, "0")}:00`;
        r.push({ time: key, points: 0 });
      }
      return r;
    }

    return arr;
  }, [scans, range, granularity]);

  // helper to convert Firestore timestamp-ish to Date (handles Timestamp.toDate or string)
  function asDate(value) {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    if (value.seconds && typeof value.seconds === "number") return new Date(value.seconds * 1000);
    // sometimes it's a plain string date
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
    return null;
  }

  // small UI helpers
  const formatShort = (d) => {
    if (!d) return "";
    const date = asDate(d);
    if (!date) return "";
    return date.toLocaleString();
  };

  // station-level quick stats (counts)
  const stationSummary = useMemo(() => {
    return stations.map((s) => {
      // scans for this station
      const stationScans = scans.filter((sc) => sc.stationId === s.id);
      const participations = stationScans.length;
      const uniqueUsers = new Set(stationScans.map((sc) => sc.userId)).size;
      return {
        ...s,
        participations,
        uniqueUsers,
      };
    });
  }, [stations, scans]);

  // pagination handlers
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));
  useEffect(() => setPage(1), [search, stations.length]);

  // Render
  return (
    <>
      <AdminNavbar />
      <div
  className="min-h-screen text-gray-100 pt-24 px-6 pb-10"
  style={{
    background: `
      linear-gradient(248.32deg, rgba(34, 78, 97, 0.24) 1.53%, rgba(27, 55, 82, 0.85) 48.49%, #0D1B3A 95.44%),
      linear-gradient(115.02deg, rgba(34, 78, 97, 0.64) 20.88%, #0D1B3A 100%)
    `,
  }}
>

        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Points & Rewards Management</h1>
              <p className="text-sm text-gray-300 mt-1">Manage allotments, awards and recent activity.</p>
            </div>
            <div>
              <Button onClick={() => navigate("/admin")}>Back to Dashboard</Button>
            </div>
          </header>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card title="Total Points Allotted" value={totalPointsAllotted} />
            <Card title="Total Points Awarded" value={totalPointsAwarded} />
            <Card title="Pending Points" value={pendingPoints} warning={pendingPoints < 0} />
          </div>

          {/* Main: left chart+notifications, right table */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* left: chart + notifications */}
{/* left: chart + notifications */}
<div className="lg:col-span-2 space-y-4">
  {/* Chart card */}
  <div
    className="rounded-2xl p-5 shadow-md border border-white/10 backdrop-blur-sm"
    style={{
      background: "rgba(30, 30, 40, 1)",
      border: "1px solid rgba(34, 78, 97, 1)",
    }}
  >
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-semibold text-white">Awards over time</h2>

      <div className="flex gap-2 items-center">
        <div className="text-sm text-gray-300 mr-2">Range:</div>
        <div className="flex gap-2">
          <SmallToggle active={range === "today"} onClick={() => setRange("today")}>Today</SmallToggle>
          <SmallToggle active={range === "week"} onClick={() => setRange("week")}>This Week</SmallToggle>
          <SmallToggle active={range === "month"} onClick={() => setRange("month")}>This Month</SmallToggle>
          <SmallToggle active={range === "all"} onClick={() => setRange("all")}>All Time</SmallToggle>
        </div>
        <div className="ml-4 text-sm text-gray-300 mr-2">Granularity:</div>
        <div className="flex gap-2">
          <SmallToggle active={granularity === "hour"} onClick={() => { setGranularity("hour"); setRange("today"); }}>Hour</SmallToggle>
          <SmallToggle active={granularity === "day"} onClick={() => setGranularity("day")}>Day</SmallToggle>
        </div>
      </div>
    </div>

    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              background: "rgba(30, 30, 40, 0.9)",
              border: "1px solid rgba(34, 78, 97, 0.6)",
              borderRadius: "8px",
              color: "#fff",
            }}
            itemStyle={{ color: "#00E0FF" }}
            labelStyle={{ color: "#9CA3AF" }}
          />
          <Legend />
          <Line type="monotone" dataKey="points" stroke="#06b6d4" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>

    <div className="mt-3 text-sm text-gray-300">
      X = time (by {granularity}), Y = total points awarded in that bucket.
    </div>
  </div>

  {/* Notifications card */}
  <div
    className="rounded-2xl p-5 shadow-md border border-white/10 backdrop-blur-sm"
    style={{
      background: "rgba(30, 30, 40, 1)",
      border: "1px solid rgba(34, 78, 97, 1)",
    }}
  >
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-semibold text-white">Recent Awards</h3>
      <div className="text-sm text-gray-300">{recentNotifications.length} latest</div>
    </div>

    <ul className="space-y-2 max-h-64 overflow-auto">
      {recentNotifications.length === 0 ? (
        <li className="text-gray-400">No awards yet.</li>
      ) : (
        recentNotifications.map((n, i) => (
          <li
            key={i}
            className="p-3 rounded-lg border border-white/10"
            style={{
              background: "rgba(40, 40, 55, 1)",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-200">{n.text}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {n.time ? n.time.toLocaleString() : ""}
                </div>
              </div>
            </div>
          </li>
        ))
      )}
    </ul>
  </div>
</div>


            {/* right: stations table */}
         <div className="space-y-4">
  {/* Stations card */}
  <div
    className="rounded-2xl p-5 shadow-md border border-white/10 backdrop-blur-sm"
    style={{
      background: "rgba(30, 30, 40, 1)",
      border: "1px solid rgba(34, 78, 97, 1)",
    }}
  >
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-semibold text-white">Stations</h3>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search station..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded bg-[rgba(40,40,55,1)] placeholder:text-gray-400 text-sm text-gray-200 focus:outline-none border border-white/10"
        />
      </div>
    </div>

    <div className="overflow-x-auto rounded-lg border border-white/5">
      <table className="min-w-full text-left text-sm text-gray-300">
        <thead>
          <tr className="bg-[rgba(40,40,55,1)] text-gray-300">
            <th className="py-2 px-3 font-medium">Station</th>
            <th className="py-2 px-3 text-center font-medium">Points</th>
            <th className="py-2 px-3 text-center font-medium">Participations</th>
            <th className="py-2 px-3 text-center font-medium">Active</th>
          </tr>
        </thead>
        <tbody>
          {pageStations.map((s) => {
            const summary = stationSummary.find((ss) => ss.id === s.id) || {};
            return (
              <tr
                key={s.id}
                className="border-t border-white/10 hover:bg-[rgba(40,40,55,0.8)] transition-colors"
              >
                <td className="py-3 px-3">
                  <div className="font-semibold text-white">{s.name}</div>
                </td>
                <td className="py-3 px-3 text-center text-gray-200">
                  {s.points}
                </td>
                <td className="py-3 px-3 text-center text-gray-200">
                  {summary.participations ?? 0}
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      s.active
                        ? "bg-green-600/30 text-green-400 border border-green-600/40"
                        : "bg-gray-600/30 text-gray-400 border border-gray-600/40"
                    }`}
                  >
                    {s.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            );
          })}
          {pageStations.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-gray-400">
                No stations found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    <div className="mt-3 flex items-center justify-between text-sm text-gray-300">
      <div>
        Page {page} / {totalPages}
      </div>
      <div className="flex gap-2">
        <button
          onClick={goPrev}
          className="px-3 py-1 rounded bg-[rgba(40,40,55,1)] border border-white/10 text-gray-200 hover:bg-[rgba(50,50,65,1)] transition disabled:opacity-50"
          disabled={page <= 1}
        >
          Prev
        </button>
        <button
          onClick={goNext}
          className="px-3 py-1 rounded bg-[rgba(40,40,55,1)] border border-white/10 text-gray-200 hover:bg-[rgba(50,50,65,1)] transition disabled:opacity-50"
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  </div>

  {/* Quick Summary card */}
  <div
    className="rounded-2xl p-5 shadow-md border border-white/10 backdrop-blur-sm"
    style={{
      background: "rgba(30, 30, 40, 1)",
      border: "1px solid rgba(34, 78, 97, 1)",
    }}
  >
    <h4 className="font-semibold text-white mb-3">Quick Summary</h4>
    <div className="grid grid-cols-2 gap-3 text-sm">
      {[
        { label: "Stations", value: stations.length },
        { label: "Total Scans", value: scans.length },
        { label: "Users", value: users.length },
        { label: "Awarded Points", value: totalPointsAwarded },
      ].map((item, i) => (
        <div
          key={i}
          className="rounded-lg p-3 border border-white/10 bg-[rgba(40,40,55,1)]"
        >
          <div className="text-xs text-gray-300">{item.label}</div>
          <div className="text-lg font-semibold text-white mt-1">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  </div>
</div>

          </div>
        </div>
      </div> 
    </>
  );
}

/* ---------- Small UI subcomponents ---------- */

function Card({ title, value, warning, children }) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-md border border-white/10 backdrop-blur-sm ${
        warning ? "ring-2 ring-red-500/40" : ""
      }`}
      style={{
        background: "rgba(30, 30, 40, 1)",
        border: "1px solid rgba(34, 78, 97, 1)",
      }}
    >
      {title && <div className="text-sm text-gray-300">{title}</div>}
      {value !== undefined && (
        <div className="text-3xl font-bold mt-2 text-white">{value}</div>
      )}
      {children}
    </div>
  );
}


function SmallToggle({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-3 py-1 rounded-lg ${active ? "bg-indigo-600 text-white" : "bg-white/5 text-gray-200"}`}
    >
      {children}
    </button>
  );
}
