import React, { useEffect, useState } from "react";
import { db } from "../../utils/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import QRCode from "qrcode";
import { useAuth } from "../../contexts/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import ModeratorNavbar from "../../components/ui/ModeratorNavbar";

export default function ManageStations() {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPoints, setEditPoints] = useState("");

  const canEdit = user?.role === "admin" || user?.role === "moderator";

  const fetchStations = async () => {
    try {
      const snapshot = await getDocs(collection(db, "stations"));
      const list = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const qrUrl = await QRCode.toDataURL(
            `https://tech-cafe.app/scan?station=${docSnap.id}`
          );
          return { id: docSnap.id, ...data, qrUrl };
        })
      );
      setStations(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load stations");
    } finally {
      setLoading(false);
    }
  };

  const deactivateStation = async (id) => {
    if (!canEdit) return toast.error("Permission denied");
    try {
      await updateDoc(doc(db, "stations", id), { active: false });
      toast.success("Station deactivated");
      fetchStations();
    } catch {
      toast.error("Failed to deactivate station");
    }
  };

  const saveEdit = async (id) => {
    if (!canEdit) return toast.error("Permission denied");
    try {
      await updateDoc(doc(db, "stations", id), {
        name: editName,
        points: Number(editPoints),
      });
      toast.success("Station updated successfully!");
      setEditingId(null);
      fetchStations();
    } catch {
      toast.error("Failed to update station");
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  return (
    <>
      <ModeratorNavbar />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center py-10 px-4">
        <Toaster position="top-center" />

        <div className="max-w-6xl w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-lg">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-indigo-400">
            🗂 Manage Stations
          </h1>
          <p className="text-center text-gray-300 mb-8">
            Edit, deactivate, or view QR codes of your event stations
          </p>

          {loading ? (
            <p className="text-center text-gray-400">Loading stations...</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-white/20">
              <table className="min-w-full text-sm md:text-base">
                <thead className="bg-white/10 text-gray-300 uppercase text-xs md:text-sm">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-center">Points</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">QR Code</th>
                    {canEdit && <th className="px-4 py-3 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {stations.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        {editingId === s.id ? (
                          <input
                            className="w-full p-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          s.name
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {editingId === s.id ? (
                          <input
                            type="number"
                            className="w-full p-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={editPoints}
                            onChange={(e) => setEditPoints(e.target.value)}
                          />
                        ) : (
                          s.points
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {s.active ? (
                          <span className="text-green-400 font-semibold">Active</span>
                        ) : (
                          <span className="text-gray-400 font-medium">Inactive</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <img
                          src={s.qrUrl}
                          alt="QR"
                          className="w-16 h-16 rounded-lg shadow-md mx-auto"
                        />
                      </td>

                      {canEdit && (
                        <td className="px-4 py-3 text-center space-x-2">
                          {editingId === s.id ? (
                            <>
                              <button
                                onClick={() => saveEdit(s.id)}
                                className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded-lg text-white font-medium transition"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-gray-300 underline hover:text-white"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(s.id);
                                  setEditName(s.name);
                                  setEditPoints(s.points);
                                }}
                                className="text-indigo-400 underline hover:text-indigo-200"
                              >
                                Edit
                              </button>
                              {s.active && (
                                <button
                                  onClick={() => deactivateStation(s.id)}
                                  className="text-red-500 underline hover:text-red-400"
                                >
                                  Deactivate
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
