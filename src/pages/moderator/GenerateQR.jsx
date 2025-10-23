import React, { useState } from "react";
import { db } from "../../utils/firebase";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import QRCode from "qrcode";
import { useAuth } from "../../contexts/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import ModeratorNavbar from "../../components/ui/ModeratorNavbar";

export default function GenerateQR() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const canCreate = user?.role === "admin" || user?.role === "moderator";

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!canCreate)
      return toast.error("Only moderators or admins can create stations");
    if (!name || !points || !description)
      return toast.error("Please fill all fields");

    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "stations"));
      if (snapshot.size >= 6) {
        toast.error("Maximum of 6 stations already created.");
        setLoading(false);
        return;
      }

      const stationRef = await addDoc(collection(db, "stations"), {
        name,
        description,
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
      setDescription("");
      setPoints("");
    } catch (err) {
      console.error("Error creating station:", err);
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
    <>
      <ModeratorNavbar />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center py-10 px-4">
        <Toaster position="top-center" />

        <div className="max-w-2xl w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-lg">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-indigo-400">
            🧩 Generate Station QR
          </h1>
          <p className="text-center text-gray-300 mb-8">
            Create a new station and generate its QR code instantly
          </p>

          {canCreate ? (
            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block mb-1 text-gray-300 font-medium">
                  Station Name
                </label>
                <input
                  type="text"
                  placeholder="Enter station name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-300 font-medium">
                  Description
                </label>
                <textarea
                  placeholder="Enter station description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-300 font-medium">
                  Points
                </label>
                <input
                  type="number"
                  placeholder="Enter points"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-lg font-semibold transition disabled:opacity-60"
              >
                {loading ? "Generating..." : "Generate QR Code"}
              </button>
            </form>
          ) : (
            <p className="text-red-500 font-medium text-center mt-4">
              You don’t have permission to create stations.
            </p>
          )}

          {qrUrl && (
            <div className="mt-10 text-center border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-200">
                QR Code Preview
              </h3>
              <img
                src={qrUrl}
                alt="Generated QR"
                className="mx-auto mb-4 w-56 h-56 shadow-lg rounded-lg bg-white p-2"
              />
              <button
                onClick={handleDownload}
                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg font-medium transition"
              >
                Download QR
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
