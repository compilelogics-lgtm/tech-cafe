import React, { useState } from "react";
import { db } from "../../utils/firebase";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import QRCode from "qrcode";
import { useAuth } from "../../contexts/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const GenerateQR = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [points, setPoints] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Role-based access: only admin or moderator can create stations
  const canCreate = user?.role === "admin" || user?.role === "moderator";

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!canCreate) return toast.error("Only moderators or admins can create stations");
    if (!name || !points) return toast.error("Please fill all fields");

    try {
      setLoading(true);

      // Check total station count
      const snapshot = await getDocs(collection(db, "stations"));
      if (snapshot.size >= 6) {
        toast.error("Maximum of 6 stations already created.");
        setLoading(false);
        return;
      }

      // Create station
      const stationRef = await addDoc(collection(db, "stations"), {
        name,
        points: Number(points),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        active: true,
      });

      const qrLink = `https://tech-cafe.app/scan?station=${stationRef.id}`;
      const qrCodeData = await QRCode.toDataURL(qrLink);
      setQrUrl(qrCodeData);

      toast.success("Station created successfully!");
      setName("");
      setPoints("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create station");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `${name || "station"}-qr.png`;
    link.click();
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg border border-gray-100 text-center">
      <Toaster position="top-center" />
      <h2 className="text-3xl font-semibold mb-6 text-blue-700">Generate Station QR</h2>

      {canCreate ? (
        <form onSubmit={handleGenerate} className="space-y-4">
          <input
            type="text"
            placeholder="Station Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
          />

          <input
            type="number"
            placeholder="Points"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate QR"}
          </button>
        </form>
      ) : (
        <p className="text-red-600 font-medium mt-4">
          You don’t have permission to create stations.
        </p>
      )}

      {qrUrl && (
        <div className="mt-8">
          <h3 className="font-semibold mb-3">QR Code Preview:</h3>
          <img src={qrUrl} alt="Generated QR" className="mx-auto mb-4 w-56 shadow-md rounded-lg" />
          <button
            onClick={handleDownload}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Download QR
          </button>
        </div>
      )}
    </div>
  );
};

export default GenerateQR;
