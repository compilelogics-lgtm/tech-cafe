import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useAuth } from "../../contexts/AuthContext";

export default function ManageStations() {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStation, setNewStation] = useState({ name: "", points: "", active: true });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", points: "", active: true });

  // 🧭 Load stations
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "stations"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setStations(data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ➕ Add station
  const handleAddStation = async () => {
    if (!newStation.name || !newStation.points) {
      alert("Please enter a name and points.");
      return;
    }

    await addDoc(collection(db, "stations"), {
      name: newStation.name.trim(),
      points: Number(newStation.points),
      active: newStation.active,
      createdBy: user?.uid || "admin",
      createdAt: serverTimestamp(),
    });

    setNewStation({ name: "", points: "", active: true });
    alert("Station added successfully!");
  };

  // ✏️ Start editing
  const openEdit = (s) => {
    setEditing(s);
    setEditForm({
      name: s.name,
      points: s.points,
      active: s.active,
    });
  };

  // 💾 Save edit
  const saveEdit = async () => {
    await updateDoc(doc(db, "stations", editing.id), {
      name: editForm.name.trim(),
      points: Number(editForm.points),
      active: editForm.active,
    });
    setEditing(null);
    alert("Station updated!");
  };

  // ❌ Delete
  const handleDelete = async (s) => {
    if (window.confirm(`Delete ${s.name}? This cannot be undone.`)) {
      await deleteDoc(doc(db, "stations", s.id));
      alert(`${s.name} deleted.`);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading stations...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-blue-800 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-4">🏁 Manage Stations</h1>
        <p className="text-center text-gray-300 mb-8">
          Add, edit, activate, or delete event stations
        </p>

        {/* ➕ Add Station Form */}
        <div className="bg-white/10 border border-white/20 p-4 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-3">Add New Station</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Station name"
              value={newStation.name}
              onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
              className="p-2 rounded bg-white/10 border border-white/20 text-white placeholder-gray-400"
            />
            <input
              type="number"
              placeholder="Points"
              value={newStation.points}
              onChange={(e) => setNewStation({ ...newStation, points: e.target.value })}
              className="p-2 rounded bg-white/10 border border-white/20 text-white placeholder-gray-400"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newStation.active}
                onChange={(e) => setNewStation({ ...newStation, active: e.target.checked })}
                className="w-5 h-5 accent-indigo-500"
              />
              <span>Active</span>
            </div>
          </div>
          <button
            onClick={handleAddStation}
            className="mt-4 bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700"
          >
            Add Station
          </button>
        </div>

        {/* 📋 Station List */}
        <div className="overflow-x-auto rounded-lg bg-white/10 border border-white/20">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-white/10 text-gray-200 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 text-center">Points</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-white/10 hover:bg-white/5 transition"
                >
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 text-center">{s.points}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        s.active ? "bg-green-600" : "bg-gray-500"
                      }`}
                    >
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button
                      onClick={() => openEdit(s)}
                      className="bg-blue-500 px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        updateDoc(doc(db, "stations", s.id), { active: !s.active })
                      }
                      className="bg-yellow-500 px-3 py-1 rounded text-sm hover:bg-yellow-600"
                    >
                      {s.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      className="bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✏️ Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white text-gray-800 p-6 rounded-lg w-96 relative">
            <h2 className="text-xl font-semibold mb-4">Edit Station</h2>
            <label className="block text-sm font-medium">Name</label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full mb-3 p-2 border rounded"
            />
            <label className="block text-sm font-medium">Points</label>
            <input
              type="number"
              value={editForm.points}
              onChange={(e) => setEditForm({ ...editForm, points: e.target.value })}
              className="w-full mb-3 p-2 border rounded"
            />
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={editForm.active}
                onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                className="w-5 h-5 accent-indigo-500"
              />
              <span>Active</span>
            </div>
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
