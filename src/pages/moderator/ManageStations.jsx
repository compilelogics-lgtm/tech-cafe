import React, { useEffect, useState } from "react";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../../utils/firebase";
import ModeratorNavbar from "../../components/ui/ModeratorNavbar";
import QRCode from "qrcode";
import toast, { Toaster } from "react-hot-toast";

export default function ModeratorManageStations() {
  const [stations, setStations] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", points: "" });
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "stations"), (snap) => {
      setStations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const openEdit = (station) => {
    setEditing(station);
    setEditForm({
      name: station.name || "",
      description: station.description || "",
      points: station.points || "",
    });
  };

  const saveEdit = async () => {
    if (!editForm.name || !editForm.points) {
      toast.error("Name and points are required");
      return;
    }
    await updateDoc(doc(db, "stations", editing.id), {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      points: Number(editForm.points),
    });
    toast.success("Station updated");
    setEditing(null);
  };

  const toggleStatus = async (station) => {
    await updateDoc(doc(db, "stations", station.id), { active: !station.active });
    toast.success(`Station ${station.active ? "deactivated" : "activated"}`);
  };

  const handleGenerateQR = async (station) => {
    try {
      const qrCodeData = await QRCode.toDataURL(
        `https://tech-cafe.app/scan?station=${station.id}`
      );
      setQrUrl(qrCodeData);
      setExpanded(station.id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate QR");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-gray-300">
        Loading stations...
      </div>
    );

  return (
    <>
      <ModeratorNavbar />
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-6 pt-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-[#00E0FF]">
            Manage Stations
          </h1>
          <p className="text-center text-gray-400 mb-6 text-sm md:text-base">
            View, edit, toggle, and preview station QR codes.
          </p>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto bg-[#1E1E28] border border-[#224E61] rounded-2xl shadow-[0_0_20px_#00E0FF20] backdrop-blur-md">
            <table className="min-w-full text-sm text-left text-gray-200">
              <thead className="bg-[#11121A] text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-center">Points</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((s) => (
                  <React.Fragment key={s.id}>
                    <tr className="border-t border-[#224E61]/30 hover:bg-[#00E0FF05] transition">
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3 text-gray-400 truncate max-w-sm">
                        {s.description}
                      </td>
                      <td className="px-4 py-3 text-center text-cyan-400 font-semibold">
                        {s.points}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            s.active
                              ? "bg-green-600/20 text-green-400 border border-green-500/40"
                              : "bg-red-600/20 text-red-400 border border-red-500/40"
                          }`}
                        >
                          {s.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center space-x-2">
                        <button
                          onClick={() => openEdit(s)}
                          className="bg-[#00E0FF]/80 hover:bg-[#00E0FF] text-white px-3 py-1 rounded text-sm transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleStatus(s)}
                          className={`px-3 py-1 rounded text-sm transition ${
                            s.active
                              ? "bg-yellow-500/80 hover:bg-yellow-500 text-black"
                              : "bg-green-500/80 hover:bg-green-500 text-black"
                          }`}
                        >
                          {s.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleGenerateQR(s)}
                          className="bg-[#1A9FFF]/70 hover:bg-[#1A9FFF] text-white px-3 py-1 rounded text-sm transition"
                        >
                          QR
                        </button>
                      </td>
                    </tr>

                    {expanded === s.id && qrUrl && (
                      <tr className="bg-[#0E141B]">
                        <td colSpan="5" className="px-4 py-4 text-center">
                          <h3 className="text-gray-300 mb-2 font-semibold">
                            QR Code for {s.name}
                          </h3>
                          <img
                            src={qrUrl}
                            alt="Station QR"
                            className="mx-auto mb-3 w-52 h-52 rounded-lg bg-white p-2 shadow-lg"
                          />
                          <button
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = qrUrl;
                              a.download = `${s.name}-qr.png`;
                              a.click();
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                          >
                            Download QR
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="grid gap-4 md:hidden">
            {stations.map((s) => (
              <div
                key={s.id}
                className="bg-[#1E1E28] border border-[#224E61] rounded-2xl shadow-[0_0_20px_#00E0FF20] p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-[#00E0FF]">{s.name}</h3>
                    <p className="text-gray-400 text-sm mb-2">{s.description}</p>
                    <p className="text-cyan-400 text-sm font-medium">
                      Points: {s.points}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      s.active
                        ? "bg-green-600/20 text-green-400 border border-green-500/40"
                        : "bg-red-600/20 text-red-400 border border-red-500/40"
                    }`}
                  >
                    {s.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => openEdit(s)}
                    className="flex-1 bg-[#00E0FF]/80 hover:bg-[#00E0FF] text-white py-2 rounded text-sm transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(s)}
                    className={`flex-1 py-2 rounded text-sm transition ${
                      s.active
                        ? "bg-yellow-500/80 hover:bg-yellow-500 text-black"
                        : "bg-green-500/80 hover:bg-green-500 text-black"
                    }`}
                  >
                    {s.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleGenerateQR(s)}
                    className="flex-1 bg-[#1A9FFF]/70 hover:bg-[#1A9FFF] text-white py-2 rounded text-sm transition"
                  >
                    QR
                  </button>
                </div>

                {expanded === s.id && qrUrl && (
                  <div className="mt-4 text-center">
                    <h4 className="text-gray-300 mb-2 font-medium text-sm">
                      QR Code for {s.name}
                    </h4>
                    <img
                      src={qrUrl}
                      alt="QR"
                      className="mx-auto mb-3 w-40 h-40 rounded-lg bg-white p-2 shadow-lg"
                    />
                    <button
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = qrUrl;
                        a.download = `${s.name}-qr.png`;
                        a.click();
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-medium transition"
                    >
                      Download QR
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Edit Modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1E1E28] border border-[#224E61] rounded-2xl shadow-[0_0_20px_#00E0FF20] p-5 w-full max-w-sm sm:max-w-md">
              <h2 className="text-xl font-semibold mb-4 text-[#00E0FF]">
                Edit Station
              </h2>

              <label className="block text-sm font-medium mb-1 text-gray-300">
                Name
              </label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full mb-3 p-2 rounded bg-[#0000001a] border border-[#224E61] text-white focus:ring-2 focus:ring-[#00E0FF] outline-none"
              />

              <label className="block text-sm font-medium mb-1 text-gray-300">
                Description
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                rows={3}
                className="w-full mb-3 p-2 rounded bg-[#0000001a] border border-[#224E61] text-white focus:ring-2 focus:ring-[#00E0FF] outline-none resize-none"
              />

              <label className="block text-sm font-medium mb-1 text-gray-300">
                Points
              </label>
              <input
                type="number"
                value={editForm.points}
                onChange={(e) => setEditForm({ ...editForm, points: e.target.value })}
                className="w-full mb-5 p-2 rounded bg-[#0000001a] border border-[#224E61] text-white focus:ring-2 focus:ring-[#00E0FF] outline-none"
              />

              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className="px-3 py-1 bg-white/10 rounded hover:bg-white/20 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-3 py-1 bg-[#00E0FF] text-white rounded hover:bg-[#00C8E6] transition text-sm"
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
