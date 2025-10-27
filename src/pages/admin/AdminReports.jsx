// src/pages/admin/AdminReports.jsx
import React, { useEffect, useMemo, useState } from "react";
import AdminNavbar from "../../components/ui/AdminNavbar";
import { db } from "../../utils/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

/**
 * AdminReports.jsx
 * - Live analytics page for attendance & engagement
 * - Uses Firestore onSnapshot for live updates (emulator-friendly)
 * - Charts: Line (attendance growth), Pie (department engagement), Bar (points per event)
 * - Dark glassy UI to match other admin pages
 */

// color palette for departments (auto-assign)
const DEPT_COLORS = [
  "#7c3aed", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#6366f1", // indigo
  "#ec4899", // pink
];

export default function AdminReports() {
  const [users, setUsers] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [stations, setStations] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  // live listeners
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      if (!mounted) return;
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubParts = onSnapshot(collection(db, "participations"), (snap) => {
      if (!mounted) return;
      setParticipations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubStations = onSnapshot(collection(db, "stations"), (snap) => {
      if (!mounted) return;
      setStations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubScans = onSnapshot(collection(db, "scans"), (snap) => {
      if (!mounted) return;
      setScans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // small delay to allow first payloads
    const t = setTimeout(() => setLoading(false), 300);

    return () => {
      mounted = false;
      unsubUsers();
      unsubParts();
      unsubStations();
      unsubScans();
      clearTimeout(t);
    };
  }, []);

  // helper to normalize Firestore timestamp -> JS Date
  const toDate = (v) => {
    if (!v) return null;
    if (typeof v.toDate === "function") return v.toDate();
    if (v.seconds && typeof v.seconds === "number") return new Date(v.seconds * 1000);
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  // ---------- Attendance Growth (line chart) ----------
  // We'll aggregate participations by date -> count unique user check-ins per day
  const attendanceByDay = useMemo(() => {
    // map dateKey -> set of userIds
    const map = {};
    participations.forEach((p) => {
      const dt = toDate(p.markedAt || p.marked_at || p.createdAt);
      if (!dt) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
        dt.getDate()
      ).padStart(2, "0")}`;
      if (!map[key]) map[key] = new Set();
      if (p.userId) map[key].add(p.userId);
      else if (p.email) map[key].add(p.email);
    });
    // convert to sorted array
    const arr = Object.keys(map)
      .sort((a, b) => (a < b ? -1 : 1))
      .map((k) => ({ date: k, attendees: map[k].size }));
    return arr;
  }, [participations]);

  // ---------- Department engagement (pie) ----------
  // Count participations per user's department (fall back to 'Unknown')
  const deptEngagement = useMemo(() => {
    // build userId -> department map
    const deptOf = {};
    users.forEach((u) => (deptOf[u.id] = u.department || "Unknown"));

    const map = {};
    participations.forEach((p) => {
      const dept = deptOf[p.userId] || p.department || "Unknown";
      map[dept] = (map[dept] || 0) + 1;
    });

    const arr = Object.keys(map)
      .map((k) => ({ name: k, value: map[k] }))
      .sort((a, b) => b.value - a.value);
    return arr;
  }, [participations, users]);

  // ---------- Points per event (bar) ----------
  const pointsPerEvent = useMemo(() => {
    const map = {};
    scans.forEach((s) => {
      const sid = s.stationId || s.station;
      const pts = Number(s.pointsEarned ?? s.points ?? 0);
      map[sid] = (map[sid] || 0) + pts;
    });
    // map stationId -> name if available
    return Object.keys(map)
      .map((sid) => {
        const st = stations.find((x) => x.id === sid) || stations.find((x) => x.stationId === sid);
        return { name: st?.name || sid, points: map[sid] };
      })
      .sort((a, b) => b.points - a.points);
  }, [scans, stations]);

  // ---------- Department insights (top dept, highest individual points, avg check-ins) ----------
  const deptInsights = useMemo(() => {
    // top department by total points: sum user.totalPoints grouped by department
    const deptSum = {};
    users.forEach((u) => {
      const d = u.department || "Unknown";
      deptSum[d] = (deptSum[d] || 0) + (Number(u.totalPoints) || 0);
    });
    const topDept = Object.keys(deptSum).length
      ? Object.entries(deptSum).sort((a, b) => b[1] - a[1])[0]
      : ["—", 0];

    // highest individual points
    const maxUser = users.length
      ? users.reduce((mx, u) => ((Number(u.totalPoints) || 0) > (Number(mx.totalPoints) || 0) ? u : mx), users[0])
      : null;

    // average check-ins per user -> participations.length / number of unique users
    const uniqueUsers = new Set(participations.map((p) => p.userId || p.email)).size || 0;
    const avgCheckins = uniqueUsers ? (participations.length / uniqueUsers).toFixed(2) : "0.00";

    return {
      topDepartment: { name: topDept[0], totalPoints: topDept[1] || 0 },
      highestIndividual: { name: maxUser?.name || maxUser?.email || "—", points: maxUser?.totalPoints || 0 },
      avgCheckins,
      totalParticipations: participations.length,
    };
  }, [users, participations]);

  // ---------- Misc summary stats ----------
  const summary = useMemo(() => {
    const attendees = users.filter((u) => u.role === "attendee").length;
    const moderators = users.filter((u) => u.role === "moderator").length;
    return {
      attendees,
      moderators,
      stations: stations.length,
      participations: participations.length,
      scans: scans.length,
    };
  }, [users, stations, participations, scans]);

  // pie colors assignment
  const pieColors = useMemo(() => {
    return deptEngagement.map((_, i) => DEPT_COLORS[i % DEPT_COLORS.length]);
  }, [deptEngagement]);

  if (loading)
    return (
      <>
        <AdminNavbar />
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6 pt-20">
          <div className="max-w-6xl mx-auto text-center py-20">
            <div className="text-lg">Loading reports...</div>
          </div>
        </div>
      </>
    );

  return (
    <>
      <AdminNavbar />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6 pt-20">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Reports & Analytics</h1>
              <p className="text-sm text-gray-300 mt-1">Attendance, engagement and points overview (live)</p>
            </div>
          </header>

          {/* summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Attendees" value={summary.attendees} />
            <StatCard title="Moderators" value={summary.moderators} />
            <StatCard title="Stations" value={summary.stations} />
            <StatCard title="Participations" value={summary.participations} />
          </div>

          {/* main content grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Large: Attendance growth + department insights */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Attendance Growth</h2>
                  <div className="text-sm text-gray-300">Unique attendees per day</div>
                </div>

                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <LineChart data={attendanceByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="attendees" stroke="#06b6d4" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div className="grid sm:grid-cols-3 gap-4">
                <Card>
                  <h3 className="text-sm text-gray-300">Top Department</h3>
                  <div className="mt-2">
                    <div className="text-lg font-semibold">{deptInsights.topDepartment.name}</div>
                    <div className="text-sm text-gray-400">{deptInsights.topDepartment.totalPoints} total points</div>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-sm text-gray-300">Highest Individual Points</h3>
                  <div className="mt-2">
                    <div className="text-lg font-semibold">{deptInsights.highestIndividual.name}</div>
                    <div className="text-sm text-gray-400">{deptInsights.highestIndividual.points} pts</div>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-sm text-gray-300">Avg Check-ins / User</h3>
                  <div className="mt-2">
                    <div className="text-lg font-semibold">{deptInsights.avgCheckins}</div>
                    <div className="text-sm text-gray-400">{deptInsights.totalParticipations} total participations</div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Right column: Pie + Bars */}
            <div className="space-y-6">
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Department Engagement</h2>
                  <div className="text-sm text-gray-300">By participations</div>
                </div>

                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie dataKey="value" data={deptEngagement} nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                        {deptEngagement.map((entry, idx) => (
                          <Cell key={entry.name} fill={pieColors[idx % pieColors.length]} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Points per Event</h2>
                  <div className="text-sm text-gray-300">Total points earned at each station</div>
                </div>

                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={pointsPerEvent}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                      <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip />
                      <Bar dataKey="points" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- Small UI components ---------------- */

function Card({ children }) {
  return <div className="bg-white/6 rounded-2xl p-4 shadow-lg backdrop-blur-md border border-white/6">{children}</div>;
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white/6 rounded-2xl p-4 shadow-lg backdrop-blur-md border border-white/6 text-center">
      <div className="text-sm text-gray-300">{title}</div>
      <div className="text-3xl font-bold mt-2">{value}</div>
    </div>
  );
}
