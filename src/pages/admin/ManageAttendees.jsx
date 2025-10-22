import { useEffect, useState } from "react";
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

export default function ManageAttendees() {
  const [attendees, setAttendees] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");
  const [scanData, setScanData] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // 👈 stores user being edited
  const [editForm, setEditForm] = useState({ name: "", email: "", department: "" });

  // 🧭 Load attendees
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

  // 🧹 Delete attendee
  const handleDelete = async (attendee) => {
    if (window.confirm(`Delete ${attendee.name}? This cannot be undone.`)) {
      await deleteDoc(doc(db, "users", attendee.id));
      alert(`${attendee.name} deleted.`);
    }
  };

  // 🔁 Reset points
  const handleResetPoints = async (attendee) => {
    if (window.confirm(`Reset all points for ${attendee.name}?`)) {
      await updateDoc(doc(db, "users", attendee.id), { totalPoints: 0 });
      alert(`${attendee.name}'s points reset.`);
    }
  };

  // ✏️ Open edit modal
  const openEdit = (a) => {
    setEditing(a);
    setEditForm({
      name: a.name || "",
      email: a.email || "",
      department: a.department || "",
    });
  };

  // 💾 Save edits
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

  if (loading) return <div className="p-10 text-center">Loading attendees...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-blue-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">🎓 Manage Attendees</h1>
        <p className="text-center text-gray-300 mb-6">
          Admin control — view, edit, reset, or delete attendees
        </p>

        {/* 🔍 Search */}
        <div className="mb-6 flex justify-center">
          <input
            type="text"
            placeholder="Search attendee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-80 p-2 rounded bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none"
          />
        </div>

        {/* 📋 Table */}
        <div className="overflow-x-auto rounded-lg bg-white/10 border border-white/20">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-white/10 text-gray-200 uppercase text-xs">
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
                <>
                  <tr key={a.id} className="border-b border-white/10 hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-center font-semibold text-indigo-300">
                      #{a.rank}
                    </td>
                    <td className="px-4 py-3">{a.name}</td>
                    <td className="px-4 py-3 text-gray-300">{a.email}</td>
                    <td className="px-4 py-3 text-center font-semibold">{a.totalPoints}</td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        onClick={() => openEdit(a)}
                        className="bg-blue-500 px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetPoints(a)}
                        className="bg-yellow-500 px-3 py-1 rounded text-sm hover:bg-yellow-600"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => handleDelete(a)}
                        className="bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                        className="text-sm bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-700"
                      >
                        {expanded === a.id ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded station info */}
                  {expanded === a.id && (
                    <tr className="bg-white/5">
                      <td colSpan="6" className="px-4 py-3">
                        <div className="text-sm">
                          <p className="text-gray-300 mb-2 font-semibold">Scanned Stations:</p>
                          {scanData[a.id]?.length > 0 ? (
                            <ul className="pl-4 list-disc">
                              {scanData[a.id].map((s, i) => (
                                <li key={i}>
                                  Station ID:{" "}
                                  <span className="text-indigo-300">{s.stationId}</span> —{" "}
                                  <span className="font-semibold text-green-400">
                                    +{s.pointsEarned} pts
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-400 italic">No stations scanned yet.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✏️ Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white text-gray-800 p-6 rounded-lg w-96 relative">
            <h2 className="text-xl font-semibold mb-4">Edit Attendee</h2>
            <label className="block text-sm font-medium">Name</label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full mb-3 p-2 border rounded"
            />
            <label className="block text-sm font-medium">Email</label>
            <input
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full mb-3 p-2 border rounded"
            />
            <label className="block text-sm font-medium">Department</label>
            <input
              value={editForm.department}
              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              className="w-full mb-4 p-2 border rounded"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditing(null)}
                className="px-3 py-1 bg-gray-400 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
