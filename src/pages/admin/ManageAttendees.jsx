import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../utils/firebase";
import AdminNavbar from "../../components/ui/AdminNavbar";

export default function ManageAttendees() {
  const [attendees, setAttendees] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");
  const [scanData, setScanData] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", department: "" });

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("totalPoints", "desc"));
    const unsub = onSnapshot(q, async (snap) => {
      const all = snap.docs
        .map((d, i) => ({ id: d.id, rank: i + 1, ...d.data() }))
        .filter((u) => u.role === "attendee");

      setAttendees(all);
      const data = {};
      for (const att of all) {
        const scansSnap = await getDocs(
          query(collection(db, "scans"), where("userId", "==", att.id))
        );
        data[att.id] = scansSnap.docs.map((s) => s.data());
      }
      setScanData(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleDelete = async (attendee) => {
    if (window.confirm(`Delete ${attendee.name}? This cannot be undone.`)) {
      await deleteDoc(doc(db, "users", attendee.id));
      alert(`${attendee.name} deleted.`);
    }
  };

  const handleResetPoints = async (attendee) => {
    if (window.confirm(`Reset all points for ${attendee.name}?`)) {
      await updateDoc(doc(db, "users", attendee.id), { totalPoints: 0 });
      alert(`${attendee.name}'s points reset.`);
    }
  };

  const openEdit = (a) => {
    setEditing(a);
    setEditForm({
      name: a.name || "",
      email: a.email || "",
      department: a.department || "",
    });
  };

  const saveEdit = async () => {
    if (!editForm.name || !editForm.email) {
      alert("Name and email are required.");
      return;
    }
    const ref = doc(db, "users", editing.id);
    await updateDoc(ref, {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      department: editForm.department.trim(),
    });
    alert(`${editForm.name}'s details updated.`);
    setEditing(null);
  };

  const filtered = attendees.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.rank.toString().includes(search)
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200">
        Loading attendees...
      </div>
    );

  return (
    <>
      <AdminNavbar />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 p-6 pt-20">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">
            🎓 Manage Attendees
          </h1>
          <p className="text-center text-gray-400 mb-6">
            Admin control — view, edit, reset, or delete attendees
          </p>

          {/* 🔍 Search */}
          <div className="flex justify-center mb-6">
            <input
              type="text"
              placeholder="Search attendee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-80 p-2 rounded-lg bg-white/10 text-gray-100 placeholder-gray-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          {/* 📋 Attendees Table */}
          <div className="overflow-x-auto rounded-2xl shadow-lg bg-white/5 p-4">
            <table className="min-w-full text-left text-sm text-gray-200">
              <thead className="text-gray-400 border-b border-white/10 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-center">Rank</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-center">Points</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                  <th className="px-4 py-3 text-center">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <React.Fragment key={a.id}>
                    <tr className="border-t border-white/10 hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-center font-semibold text-indigo-400">
                        #{a.rank}
                      </td>
                      <td className="px-4 py-3 font-medium">{a.name}</td>
                      <td className="px-4 py-3 text-gray-400">{a.email}</td>
                      <td className="px-4 py-3 text-center font-semibold text-cyan-400">
                        {a.totalPoints}
                      </td>
                      <td className="px-4 py-3 text-center space-x-2">
                        <button
                          onClick={() => openEdit(a)}
                          className="bg-indigo-600 px-3 py-1 rounded text-sm hover:bg-indigo-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleResetPoints(a)}
                          className="bg-yellow-500/80 px-3 py-1 rounded text-sm text-black hover:bg-yellow-500 transition"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => handleDelete(a)}
                          className="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                          className="bg-white/10 px-3 py-1 rounded text-sm hover:bg-indigo-600 hover:text-white transition"
                        >
                          {expanded === a.id ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded info */}
                    {expanded === a.id && (
                      <tr className="bg-white/5">
                        <td colSpan="6" className="px-4 py-3">
                          <div className="text-sm">
                            <p className="text-gray-300 mb-2 font-semibold">
                              Scanned Stations:
                            </p>
                            {scanData[a.id]?.length > 0 ? (
                              <ul className="pl-5 list-disc space-y-1 text-gray-200">
                                {scanData[a.id].map((s, i) => (
                                  <li key={i}>
                                    <span className="text-gray-400">Station ID:</span>{" "}
                                    <span className="text-indigo-400">{s.stationId}</span>{" "}
                                    —{" "}
                                    <span className="font-semibold text-green-400">
                                      +{s.pointsEarned} pts
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-500 italic">
                                No stations scanned yet.
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ✏️ Edit Modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md border border-white/10">
              <h2 className="text-xl font-semibold mb-4 text-gray-100">
                Edit Attendee
              </h2>

              <label className="block text-sm font-medium mb-1 text-gray-300">
                Name
              </label>
              <input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="w-full mb-3 p-2 rounded bg-white/10 border border-white/10 text-gray-100 focus:ring-2 focus:ring-indigo-600 outline-none"
              />

              <label className="block text-sm font-medium mb-1 text-gray-300">
                Email
              </label>
              <input
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                className="w-full mb-3 p-2 rounded bg-white/10 border border-white/10 text-gray-100 focus:ring-2 focus:ring-indigo-600 outline-none"
              />

              <label className="block text-sm font-medium mb-1 text-gray-300">
                Department
              </label>
              <input
                value={editForm.department}
                onChange={(e) =>
                  setEditForm({ ...editForm, department: e.target.value })
                }
                className="w-full mb-5 p-2 rounded bg-white/10 border border-white/10 text-gray-100 focus:ring-2 focus:ring-indigo-600 outline-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className="px-3 py-1 bg-white/10 rounded hover:bg-white/20 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-3 py-1 bg-indigo-600 rounded text-white hover:bg-indigo-700 transition"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
