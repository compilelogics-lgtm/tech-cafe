import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useAuth } from "../../contexts/AuthContext";
import AdminNavbar from "../../components/ui/AdminNavbar";
import QRCode from "qrcode";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/**
 * ManageStations.jsx
 * Single-file page that merges your dynamic ManageStations logic
 * with the Figma layout (responsive Tailwind), adds Export CSV,
 * and dynamic charts/metrics.
 *
 * Assumptions:
 * - Firestore collections: "stations", "events", "scans", "participations", "users"
 * - stations documents may include fields: id, name, description, points, active, createdAt, eventId (optional)
 *
 * Drop this file in place of your existing ManageStations and it should work with the Emulator / production DB.
 */

export default function ManageStations() {
  const { user } = useAuth();

  // data states
  const [stations, setStations] = useState([]);
  const [events, setEvents] = useState([]);
  const [scans, setScans] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [users, setUsers] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [newStation, setNewStation] = useState({
    name: "",
    description: "",
    points: "",
    active: true,
    eventId: "",
  });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    points: "",
    active: true,
    eventId: "",
  });
  const [selectedStation, setSelectedStation] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [stats, setStats] = useState({
    participations: 0,
    scans: 0,
    activeUsers: 0,
  });

  // Quick UI flags
  const [generatingQr, setGeneratingQr] = useState(false);

  // --- Firestore realtime subscriptions
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const unsubStations = onSnapshot(
      collection(db, "stations"),
      (snap) => {
        if (!mounted) return;
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort by createdAt desc if available
        data.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setStations(data);
      },
      (err) => {
        console.error("stations subscription error", err);
      }
    );

    const unsubEvents = onSnapshot(
      collection(db, "events"),
      (snap) => {
        if (!mounted) return;
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEvents(data);
      },
      (err) => console.error("events subscription", err)
    );

    const unsubScans = onSnapshot(
      collection(db, "scans"),
      (snap) => {
        if (!mounted) return;
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setScans(data);
      },
      (err) => console.error("scans subscription", err)
    );

    const unsubParts = onSnapshot(
      collection(db, "participations"),
      (snap) => {
        if (!mounted) return;
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setParticipations(data);
      },
      (err) => console.error("participations subscription", err)
    );

    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        if (!mounted) return;
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(data);
      },
      (err) => console.error("users subscription", err)
    );

    // short delay to show spinner quickly
    const t = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 300);

    return () => {
      mounted = false;
      unsubStations();
      unsubEvents();
      unsubScans();
      unsubParts();
      unsubUsers();
      clearTimeout(t);
    };
  }, []);

  // --- Helpers & derived maps
  const eventsById = useMemo(() => {
    const map = {};
    events.forEach((e) => (map[e.id] = e));
    return map;
  }, [events]);

  const stationsById = useMemo(() => {
    const map = {};
    stations.forEach((s) => (map[s.id] = s));
    return map;
  }, [stations]);

  // Key metrics derived
  const totalRegistrations = participations.length;
  const totalPointsRedeemed = scans.reduce((sum, s) => sum + (Number(s.pointsRedeemed || s.pointsEarned || 0)), 0);
  const activeUsersCount = new Set(participations.map((p) => p.userId)).size;

  // --- Add station
  const handleAddStation = async () => {
    if (!newStation.name || !newStation.points) {
      alert("Please enter a name and points.");
      return;
    }
    try {
      await addDoc(collection(db, "stations"), {
        name: newStation.name.trim(),
        description: newStation.description.trim(),
        points: Number(newStation.points),
        active: !!newStation.active,
        eventId: newStation.eventId || null,
        createdBy: user?.uid || "admin",
        createdAt: serverTimestamp(),
      });
      setNewStation({ name: "", description: "", points: "", active: true, eventId: "" });
      alert("Station added successfully!");
    } catch (err) {
      console.error("add station error", err);
      alert("Failed to add station. See console.");
    }
  };

  // --- Edit station
  const openEdit = (s) => {
    setEditing(s);
    setEditForm({
      name: s.name || "",
      description: s.description || "",
      points: s.points ?? "",
      active: s.active ?? true,
      eventId: s.eventId || "",
    });
  };

  const saveEdit = async () => {
    try {
      await updateDoc(doc(db, "stations", editing.id), {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        points: Number(editForm.points),
        active: editForm.active,
        eventId: editForm.eventId || null,
      });
      setEditing(null);
      alert("Station updated!");
    } catch (err) {
      console.error("save edit error", err);
      alert("Failed to update. See console.");
    }
  };

  // --- Toggle active
  const handleToggleActive = async (s) => {
    try {
      await updateDoc(doc(db, "stations", s.id), { active: !s.active });
    } catch (err) {
      console.error("toggle active error", err);
      alert("Failed to toggle active.");
    }
  };

  // --- Delete
  const handleDelete = async (s) => {
    if (!window.confirm(`Delete ${s.name}? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "stations", s.id));
      alert(`${s.name} deleted.`);
      if (selectedStation?.id === s.id) setSelectedStation(null);
    } catch (err) {
      console.error("delete station error", err);
      alert("Failed to delete.");
    }
  };

  // --- QR & Stats for selected station
  useEffect(() => {
    if (!selectedStation) {
      setQrUrl("");
      setStats({ participations: 0, scans: 0, activeUsers: 0 });
      return;
    }

    let cancelled = false;
    const loadQRAndStats = async () => {
      try {
        setGeneratingQr(true);
        // generate QR link for station — can include timestamp token if desired
        const qrLink = `https://tech-cafe.app/scan?station=${selectedStation.id}`;
        const dataUrl = await QRCode.toDataURL(qrLink);
        if (cancelled) return;
        setQrUrl(dataUrl);

        // fetch participations & scans counts (using queries)
        const [partSnap, scanSnap] = await Promise.all([
          getDocs(query(collection(db, "participations"), where("stationId", "==", selectedStation.id))),
          getDocs(query(collection(db, "scans"), where("stationId", "==", selectedStation.id))),
        ]);

        if (cancelled) return;
        setStats({
          participations: partSnap.size,
          scans: scanSnap.size,
          activeUsers: new Set(partSnap.docs.map((d) => d.data().userId)).size,
        });
      } catch (err) {
        console.error("load qr & stats", err);
      } finally {
        if (!cancelled) setGeneratingQr(false);
      }
    };

    loadQRAndStats();
    return () => {
      cancelled = true;
    };
  }, [selectedStation]);

  const handleDownloadQR = () => {
    if (!qrUrl || !selectedStation) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `${(selectedStation.name || selectedStation.id)}-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const regenerateQR = async () => {
    if (!selectedStation) return;
    try {
      setGeneratingQr(true);
      const qrLink = `https://tech-cafe.app/scan?station=${selectedStation.id}&t=${Date.now()}`;
      const dataUrl = await QRCode.toDataURL(qrLink);
      setQrUrl(dataUrl);
      setGeneratingQr(false);
    } catch (err) {
      console.error("regenerate qr", err);
      setGeneratingQr(false);
    }
  };

  // --- Export CSV (stations + events combined)
  const exportToCSV = (rows, fileName = "export.csv") => {
    if (!rows || !rows.length) {
      alert("No data to export");
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(","), // header
      ...rows.map((row) =>
        headers.map((h) => {
          const cell = row[h] ?? "";
          // escape quotes
          return `"${String(cell).replace(/"/g, '""')}"`;
        }).join(",")
      ),
    ];
    const csvContent = csvRows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportData = async () => {
    // Build combined rows: Event Name,Event ID,Station Name,Station ID,QR Link,Points,Active,Created At
    const rows = stations.map((s) => {
      const ev = s.eventId ? eventsById[s.eventId] : null;
      const createdAt = s.createdAt
        ? (s.createdAt.seconds ? new Date(s.createdAt.seconds * 1000).toISOString() : new Date(s.createdAt).toISOString())
        : "";
      const qrLink = `https://tech-cafe.app/scan?station=${s.id}`;
      return {
        "Event Name": ev?.name ?? "",
        "Event ID": ev?.id ?? (s.eventId ?? ""),
        "Station Name": s.name ?? "",
        "Station ID": s.id,
        "QR Link": qrLink,
        "Points": s.points ?? "",
        "Active": s.active ? "true" : "false",
        "Created At": createdAt,
      };
    });
    exportToCSV(rows, `events-stations-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.csv`);
  };

  // --- Analytics data (registrations / points over time)
  // Build a daily aggregation for last 30 days from participations & scans
  const analyticsData = useMemo(() => {
    // Helper: date key YYYY-MM-DD
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const now = new Date();
    const start = new Date(now); start.setDate(now.getDate() - 29); start.setHours(0,0,0,0);

    const map = {};
    for (let d = new Date(start); d <= now; d.setDate(d.getDate()+1)) {
      map[fmt(new Date(d))] = { date: fmt(new Date(d)), registrations: 0, pointsRedeemed: 0 };
    }

    participations.forEach((p) => {
      const d = p.markedAt ? (p.markedAt.seconds ? new Date(p.markedAt.seconds*1000) : new Date(p.markedAt)) : null;
      if (!d) return;
      const key = fmt(d);
      if (!map[key]) map[key] = { date: key, registrations: 0, pointsRedeemed: 0 };
      map[key].registrations += 1;
    });

    scans.forEach((s) => {
      const d = s.scannedAt ? (s.scannedAt.seconds ? new Date(s.scannedAt.seconds*1000) : new Date(s.scannedAt)) : null;
      if (!d) return;
      const key = fmt(d);
      if (!map[key]) map[key] = { date: key, registrations: 0, pointsRedeemed: 0 };
      map[key].pointsRedeemed += Number(s.pointsEarned || s.pointsRedeemed || s.points || 0);
    });

    const arr = Object.values(map).sort((a,b)=> a.date.localeCompare(b.date));
    return arr;
  }, [participations, scans]);

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <div className="min-h-screen p-10 text-center text-gray-300 bg-gradient-to-b from-gray-900 to-gray-800">
          Loading stations...
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <main className="min-h-screen w-full p-6 pt-20 flex flex-col gap-6"
      style={{
        background: `
        linear-gradient(248.32deg, rgba(34, 78, 97, 0.24) 1.53%, rgba(27, 55, 82, 0.85) 48.49%, #0D1B3A 95.44%),
        linear-gradient(115.02deg, rgba(34, 78, 97, 0.64) 20.88%, #0D1B3A 100%)
      `,
      }}>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header / Title */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold text-white">Event Management</h1>
              <p className="text-white/70 mt-1">Manage your Tech Café events, QR codes, and performance data.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // open add-event modal or navigate — simple placeholder, you can wire to your add event route/component
                  alert("Add Event clicked (implement your flow)");
                }}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-[#00E0FF] text-white rounded-lg hover:opacity-95"
              >
                + Add Event
              </button>

              <div className="flex items-center gap-2">
                <input
                  placeholder="Search events/stations..."
                  className="bg-[#0D1B3A] border border-[#224E61] px-3 py-2 rounded text-white placeholder:text-white/60"
                  onChange={(e) => {
                    // optional: wire search state if you want a search filter
                  }}
                />
              </div>
            </div>
          </header>

          {/* Top row: Analytics (left) | QR Management (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Analytics (span 2) */}
            <section className="lg:col-span-2 bg-[#1E1E28] border border-[#224E61] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-2xl font-medium">Event Analytics — overview</h2>
                <div className="flex items-center gap-2">
                  <select className="bg-[#1E1E28] border border-[#224E61] text-white px-2 py-1 rounded" defaultValue="7">
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg p-3">
                  <h3 className="text-white font-medium mb-2">Registrations Over Time</h3>
                  <div style={{ width: "100%", height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData}>
                        <CartesianGrid stroke="#224E61" strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                        <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1E1E28', border: '1px solid #224E61', color: '#fff' }} />
                        <Line dataKey="registrations" stroke="#00E0FF" strokeWidth={3} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-lg p-3">
                  <h3 className="text-white font-medium mb-2">Points Redeemed</h3>
                  <div style={{ width: "100%", height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData}>
                        <CartesianGrid stroke="#224E61" strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                        <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1E1E28', border: '1px solid #224E61', color: '#fff' }} />
                        <Bar dataKey="pointsRedeemed" fill="#00E0FF" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>

            {/* QR Code Management */}
            <aside className="bg-[#1E1E28] border border-[#224E61] rounded-xl p-6 flex flex-col">
              <h2 className="text-white text-2xl font-medium mb-4">QR Code Management</h2>

              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="w-48 h-48 rounded-lg bg-white flex items-center justify-center shadow" aria-hidden>
                  {qrUrl ? (
                    <img src={qrUrl} alt="QR code" className="w-44 h-44" />
                  ) : (
                    <div className="text-sm text-gray-400">Select a station to view QR</div>
                  )}
                </div>

                <div className="text-white/80 text-center">
                  <div className="font-medium">{selectedStation?.name ?? "No station selected"}</div>
                  <div className="text-sm text-white/50">{selectedStation?.description}</div>
                </div>

                <div className="w-full flex gap-2">
                  <button
                    onClick={handleDownloadQR}
                    disabled={!qrUrl}
                    className="flex-1 px-3 py-2 rounded-lg border border-[#00E0FF] text-white disabled:opacity-50"
                  >
                    Download QR
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedStation) return;
                      navigator.clipboard.writeText(`https://tech-cafe.app/scan?station=${selectedStation.id}`);
                      alert("Link copied");
                    }}
                    disabled={!selectedStation}
                    className="flex-1 px-3 py-2 rounded-lg border border-[#00E0FF] text-white disabled:opacity-50"
                  >
                    Copy Link
                  </button>
                </div>

                <div className="w-full flex gap-2">
                  <button
                    onClick={regenerateQR}
                    disabled={!selectedStation || generatingQr}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#00E0FF] text-white disabled:opacity-50"
                  >
                    {generatingQr ? "Regenerating..." : "Regenerate"}
                  </button>
                </div>

                <div className="text-white/60 text-xs text-center mt-2">
                  Last stats: Participations {stats.participations} • Scans {stats.scans} • Active Users {stats.activeUsers}
                </div>
              </div>
            </aside>
          </div>

          {/* middle row: Event List + Key Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Event List (span 2) */}
            <section className="lg:col-span-2 bg-[#1E1E28] border border-[#224E61] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-2xl font-medium">Event List</h2>
                <div className="text-white/60 text-sm">{events.length} events</div>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-white/70">
                      <th className="py-2 px-3">Event Name</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Attendees</th>
                      <th className="py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr key={ev.id} className="border-t border-[#224E61] hover:bg-white/2">
                        <td className="py-2 px-3 text-white/80">{ev.name}</td>
                        <td className="py-2 px-3 text-white/60">{ev.date ?? ev.eventDate ?? ""}</td>
                        <td className="py-2 px-3 text-white/60">{ev.status ?? "—"}</td>
                        <td className="py-2 px-3 text-white/80">{ev.attendees ?? "—"}</td>
                        <td className="py-2 px-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                // could open event details
                                alert(`Open event ${ev.name}`);
                              }}
                              className="px-2 py-1 bg-[#00E0FF] rounded text-black text-sm"
                            >
                              Open
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Key Metrics */}
            <aside className="bg-[#1E1E28] border border-[#224E61] rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-white text-2xl font-medium mb-4">Key Metrics</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="  p-3 rounded">
                    <div className="text-white/70 text-sm">Total Registrations</div>
                    <div className="text-white font-semibold">{totalRegistrations}</div>
                  </div>

                  <div className="  p-3 rounded">
                    <div className="text-white/70 text-sm">Total Points Redeemed</div>
                    <div className="text-white font-semibold">{totalPointsRedeemed}</div>
                  </div>

                  <div className="  p-3 rounded">
                    <div className="text-white/70 text-sm">Avg Session Time</div>
                    <div className="text-white font-semibold">—</div>
                  </div>

                  <div className="  p-3 rounded">
                    <div className="text-white/70 text-sm">Active Users</div>
                    <div className="text-white font-semibold">{activeUsersCount}</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions / Export */}
              <div className="mt-4">
                <h3 className="text-white/80 mb-2">Quick Actions</h3>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      // placeholder for create event flow
                      alert("Create Event (implement flow)");
                    }}
                    className="w-full bg-[#00E0FF] text-black py-2 rounded"
                  >
                    + Create Event
                  </button>
                  <button
                    onClick={handleExportData}
                    className="w-full border border-[#00E0FF] text-white py-2 rounded hover:bg-[#00E0FF]/10"
                  >
                    Export Data
                  </button>
                </div>
              </div>
            </aside>
          </div>

          {/* Bottom: Stations Table / Add Station */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Station Form */}
            <div className="lg:col-span-1 bg-[#1E1E28] border border-[#224E61] rounded-xl p-6">
              <h2 className="text-white text-xl font-medium mb-3">Add New Station</h2>
              <div className="space-y-3">
                <input
                  className="w-full p-2 bg-[#1E1E28]  border border-[#224E61] rounded text-white"
                  placeholder="Station name"
                  value={newStation.name}
                  onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                />
                <input
                  className="w-full p-2 bg-[#1E1E28]  border border-[#224E61] rounded text-white"
                  type="number"
                  placeholder="Points"
                  value={newStation.points}
                  onChange={(e) => setNewStation({ ...newStation, points: e.target.value })}
                />
                <select
                  className="w-full p-2 bg-[#1E1E28]  border border-[#224E61] rounded text-white"
                  value={newStation.eventId}
                  onChange={(e) => setNewStation({ ...newStation, eventId: e.target.value })}
                >
                  <option value="">Assign to event (optional)</option>
                  {events.map((ev) => (
                    <option value={ev.id} key={ev.id}>{ev.name}</option>
                  ))}
                </select>
                <textarea
                  className="w-full p-2 bg-[#1E1E28]  border border-[#224E61] rounded text-white"
                  placeholder="Description (optional)"
                  value={newStation.description}
                  onChange={(e) => setNewStation({ ...newStation, description: e.target.value })}
                />

                <label className="flex items-center gap-2 text-white">
                  <input
                    type="checkbox"
                    checked={!!newStation.active}
                    onChange={(e) => setNewStation({ ...newStation, active: e.target.checked })}
                    className="accent-[#00E0FF]"
                  />
                  Active
                </label>

                <div className="flex gap-2">
                  <button onClick={handleAddStation} className="flex-1 bg-[#00E0FF] py-2 rounded text-black">Add Station</button>
                  <button onClick={() => setNewStation({ name: "", description: "", points: "", active: true, eventId: "" })} className="flex-1 border border-[#224E61] py-2 rounded text-white">Reset</button>
                </div>
              </div>
            </div>

            {/* Stations list (span 2) */}
            <section className="lg:col-span-2 bg-[#1E1E28] border border-[#224E61] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-2xl font-medium">Stations</h2>
                <div className="text-white/60 text-sm">{stations.length} stations</div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-white/70">
                      <th className="py-2 px-3">Name & Description</th>
                      <th className="py-2 px-3 text-center">Points</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3 text-center">Event</th>
                      <th className="py-2 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stations.map((s) => (
                      <tr
                        key={s.id}
                        className="border-t border-[#224E61] hover:bg-white/2 cursor-pointer"
                        onClick={() => setSelectedStation(s)}
                      >
                        <td className="py-2 px-3">
                          <div className="font-medium text-white">{s.name}</div>
                          {/* {s.description && <div className="text-white/60 text-sm mt-1">{s.description}</div>} */}
                        </td>
                        <td className="py-2 px-3 text-center text-white/80">{s.points}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${s.active ? "bg-green-600 text-white" : "bg-gray-500 text-white"}`}>{s.active ? "Active" : "Inactive"}</span>
                        </td>
                        <td className="py-2 px-3 text-center text-white/80">{s.eventId ? (eventsById[s.eventId]?.name ?? s.eventId) : "—"}</td>
                        <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex gap-2">
                            <button onClick={() => openEdit(s)} className="px-2 py-1 rounded bg-blue-500 text-white">Edit</button>
                            <button onClick={() => handleToggleActive(s)} className="px-2 py-1 rounded bg-yellow-500 text-white">{s.active ? "Deactivate" : "Activate"}</button>
                            <button onClick={() => handleDelete(s)} className="px-2 py-1 rounded bg-red-500 text-white">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </section>
          </div>
        </div>

        {/* Edit modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0D1720] rounded-xl p-6 w-full max-w-md border border-[#224E61]">
              <h3 className="text-white text-xl mb-4">Edit Station</h3>
              <input className="w-full p-2 mb-2 bg-[#1E1E28] border border-[#224E61] rounded text-white" value={editForm.name} onChange={(e)=>setEditForm({...editForm,name:e.target.value})} />
              <input className="w-full p-2 mb-2 bg-[#1E1E28] border border-[#224E61] rounded text-white" value={editForm.points} onChange={(e)=>setEditForm({...editForm,points:e.target.value})} />
              <select className="w-full p-2 mb-2 bg-[#1E1E28] border border-[#224E61] rounded text-white" value={editForm.eventId} onChange={(e)=>setEditForm({...editForm,eventId:e.target.value})}>
                <option value="">Assign to event (optional)</option>
                {events.map(ev => <option value={ev.id} key={ev.id}>{ev.name}</option>)}
              </select>
              <textarea className="w-full p-2 mb-2 bg-[#1E1E28] border border-[#224E61] rounded text-white" value={editForm.description} onChange={(e)=>setEditForm({...editForm,description:e.target.value})} />
              <label className="flex items-center gap-2 text-white mb-3">
                <input type="checkbox" checked={!!editForm.active} onChange={(e)=>setEditForm({...editForm,active:e.target.checked})} className="accent-[#00E0FF]" />
                Active
              </label>

              <div className="flex justify-end gap-2">
                <button onClick={()=>setEditing(null)} className="px-3 py-1 rounded bg-gray-500">Cancel</button>
                <button onClick={saveEdit} className="px-3 py-1 rounded bg-[#00E0FF] text-black">Save</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </>
  );
}
