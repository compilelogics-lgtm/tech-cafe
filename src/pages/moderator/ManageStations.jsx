import React, { useEffect, useState } from "react";
import { db } from "../../utils/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import QRCode from "qrcode";
import { useAuth } from "../../contexts/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const ManageStations = () => {
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
    <div className="max-w-5xl mx-auto mt-10 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <Toaster position="top-center" />
      <h2 className="text-3xl font-semibold mb-6 text-blue-700">Manage Stations</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm text-gray-600">
            <thead>
              <tr className="bg-blue-50 text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Points</th>
                <th className="p-3">Status</th>
                <th className="p-3">QR</th>
                {canEdit && <th className="p-3">Action</th>}
              </tr>
            </thead>
            <tbody>
              {stations.map((s) => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    {editingId === s.id ? (
                      <input
                        className="border p-2 rounded w-full"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      s.name
                    )}
                  </td>

                  <td className="p-3">
                    {editingId === s.id ? (
                      <input
                        type="number"
                        className="border p-2 rounded w-full"
                        value={editPoints}
                        onChange={(e) => setEditPoints(e.target.value)}
                      />
                    ) : (
                      s.points
                    )}
                  </td>

                  <td className="p-3">
                    {s.active ? (
                      <span className="text-green-600 font-semibold">Active</span>
                    ) : (
                      <span className="text-gray-400">Inactive</span>
                    )}
                  </td>

                  <td className="p-3">
                    <img src={s.qrUrl} alt="QR" className="w-16 rounded-lg shadow-sm" />
                  </td>

                  {canEdit && (
                    <td className="p-3 space-x-2">
                      {editingId === s.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(s.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-600 underline"
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
                            className="text-blue-600 underline"
                          >
                            Edit
                          </button>
                          {s.active && (
                            <button
                              onClick={() => deactivateStation(s.id)}
                              className="text-red-600 underline"
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
  );
};

export default ManageStations;
