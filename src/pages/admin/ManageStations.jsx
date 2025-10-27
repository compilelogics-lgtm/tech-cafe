import { useEffect, useState } from "react";
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
} from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useAuth } from "../../contexts/AuthContext";
import AdminNavbar from "../../components/ui/AdminNavbar";
import QRCode from "qrcode";

export default function ManageStations() {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStation, setNewStation] = useState({
    name: "",
    description: "",
    points: "",
    active: true,
  });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    points: "",
    active: true,
  });

  const [selectedStation, setSelectedStation] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [stats, setStats] = useState({
    participations: 0,
    scans: 0,
    activeUsers: 0,
  });

  // 🔹 Fetch Stations
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "stations"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setStations(
        data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 🔹 Add Station
  const handleAddStation = async () => {
    if (!newStation.name || !newStation.points) {
      alert("Please enter a name and points.");
      return;
    }

    await addDoc(collection(db, "stations"), {
      name: newStation.name.trim(),
      description: newStation.description.trim(),
      points: Number(newStation.points),
      active: newStation.active,
      createdBy: user?.uid || "admin",
      createdAt: serverTimestamp(),
    });

    setNewStation({ name: "", description: "", points: "", active: true });
    alert("Station added successfully!");
  };

  // 🔹 Edit Station
  const openEdit = (s) => {
    setEditing(s);
    setEditForm({
      name: s.name,
      description: s.description || "",
      points: s.points,
      active: s.active,
    });
  };

  const saveEdit = async () => {
    await updateDoc(doc(db, "stations", editing.id), {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      points: Number(editForm.points),
      active: editForm.active,
    });
    setEditing(null);
    alert("Station updated!");
  };

  // 🔹 Toggle Active
  const handleToggleActive = async (s) => {
    await updateDoc(doc(db, "stations", s.id), { active: !s.active });
  };

  // 🔹 Delete Station
  const handleDelete = async (s) => {
    if (window.confirm(`Delete ${s.name}? This cannot be undone.`)) {
      await deleteDoc(doc(db, "stations", s.id));
      alert(`${s.name} deleted.`);
    }
  };

  // 🔹 Load QR + Stats for Selected Station
  useEffect(() => {
    if (selectedStation) {
      const loadQRAndStats = async () => {
        const qrLink = `https://tech-cafe.app/scan?station=${selectedStation.id}`;
        const qr = await QRCode.toDataURL(qrLink);
        setQrUrl(qr);

        const [partSnap, scanSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, "participations"),
              where("stationId", "==", selectedStation.id)
            )
          ),
          getDocs(
            query(
              collection(db, "scans"),
              where("stationId", "==", selectedStation.id)
            )
          ),
        ]);

        setStats({
          participations: partSnap.size,
          scans: scanSnap.size,
          activeUsers: new Set(
            partSnap.docs.map((d) => d.data().userId)
          ).size,
        });
      };

      loadQRAndStats();
    }
  }, [selectedStation]);

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `${selectedStation.name}-qr.png`;
    link.click();
  };

  const regenerateQR = async () => {
    const qrLink = `https://tech-cafe.app/scan?station=${selectedStation.id}`;
    const qr = await QRCode.toDataURL(qrLink + `?t=${Date.now()}`);
    setQrUrl(qr);
  };

  if (loading)
    return <div className="p-10 text-center">Loading stations...</div>;

  return (
    <>
      <AdminNavbar />
      <div className="min-h-screen bg-gray-100 p-6 pt-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
            🏁 Manage Stations
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Add, edit, activate, view QR, or delete event stations
          </p>

          {/* ➕ Add Station Form */}
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Station</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-3">
              <input
                type="text"
                placeholder="Station name"
                value={newStation.name}
                onChange={(e) =>
                  setNewStation({ ...newStation, name: e.target.value })
                }
                className="p-2 rounded border border-gray-300 text-gray-800 placeholder-gray-400"
              />
              <input
                type="number"
                placeholder="Points"
                value={newStation.points}
                onChange={(e) =>
                  setNewStation({ ...newStation, points: e.target.value })
                }
                className="p-2 rounded border border-gray-300 text-gray-800 placeholder-gray-400"
              />
            </div>
            <textarea
              placeholder="Station description (optional)"
              value={newStation.description}
              onChange={(e) =>
                setNewStation({ ...newStation, description: e.target.value })
              }
              className="w-full p-2 rounded border border-gray-300 text-gray-800 placeholder-gray-400 mb-3"
            />
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={newStation.active}
                onChange={(e) =>
                  setNewStation({ ...newStation, active: e.target.checked })
                }
                className="w-5 h-5 accent-indigo-500"
              />
              <span className="text-gray-700">Active</span>
            </div>
            <button
              onClick={handleAddStation}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition"
            >
              Add Station
            </button>
          </div>

          {/* 📋 Station List */}
          <div className="overflow-x-auto rounded-xl shadow bg-white p-4">
            <table className="min-w-full text-left text-sm text-gray-700">
              <thead className="border-b border-gray-300 bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Name & Description</th>
                  <th className="px-4 py-3 text-center">Points</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => setSelectedStation(s)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">
                        {s.name}
                      </div>
                      {s.description && (
                        <div className="text-gray-500 text-sm mt-1">
                          {s.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{s.points}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          s.active
                            ? "bg-green-600 text-white"
                            : "bg-gray-400 text-white"
                        }`}
                      >
                        {s.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-center space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => openEdit(s)}
                        className="bg-blue-500 px-3 py-1 rounded text-sm text-white hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(s)}
                        className="bg-yellow-500 px-3 py-1 rounded text-sm text-white hover:bg-yellow-600"
                      >
                        {s.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="bg-red-500 px-3 py-1 rounded text-sm text-white hover:bg-red-600"
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow p-6 w-full max-w-md relative">
              <h2 className="text-xl font-semibold mb-4">Edit Station</h2>

              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="w-full mb-3 p-2 border rounded"
              />

              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                className="w-full mb-3 p-2 border rounded"
              />

              <label className="block text-sm font-medium mb-1">Points</label>
              <input
                type="number"
                value={editForm.points}
                onChange={(e) =>
                  setEditForm({ ...editForm, points: e.target.value })
                }
                className="w-full mb-3 p-2 border rounded"
              />

              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={editForm.active}
                  onChange={(e) =>
                    setEditForm({ ...editForm, active: e.target.checked })
                  }
                  className="w-5 h-5 accent-indigo-500"
                />
                <span>Active</span>
              </div>

              <div className="flex justify-end gap-2">
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

        {/* 📱 Station Detail Modal (QR + Stats) */}
        {selectedStation && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg relative">
              <button
                onClick={() => setSelectedStation(null)}
                className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {selectedStation.name}
              </h2>
              <p className="text-gray-600 mb-4">
                {selectedStation.description}
              </p>

              {/* QR Code */}
              {qrUrl ? (
                <>
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    className="mx-auto w-48 h-48 p-2 bg-white rounded-lg shadow mb-4"
                  />
                  <div className="flex justify-center gap-3 mb-6">
                    <button
                      onClick={handleDownloadQR}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Download
                    </button>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `https://tech-cafe.app/scan?station=${selectedStation.id}`
                        )
                      }
                      className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={regenerateQR}
                      className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                    >
                      Regenerate
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500">Generating QR...</div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="text-2xl font-bold">
                    {stats.participations}
                  </div>
                  <div className="text-gray-600 text-sm">Participations</div>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="text-2xl font-bold">{stats.scans}</div>
                  <div className="text-gray-600 text-sm">Scans</div>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="text-2xl font-bold">
                    {stats.activeUsers}
                  </div>
                  <div className="text-gray-600 text-sm">Active Users</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
