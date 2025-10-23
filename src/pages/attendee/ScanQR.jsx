import React, { useEffect, useRef, useState } from "react";
import { db } from "../../utils/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "../../contexts/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const ScanQR = ({ stationId }) => {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const fileInputRef = useRef();
  const html5QrCodeRef = useRef(null);

  if (!stationId) {
    console.error("ScanQR: Missing stationId prop");
    return (
      <div className="text-red-600 text-sm mt-2 text-center">
        ⚠️ Missing station reference. Please reopen this station.
      </div>
    );
  }

  const stopScanner = async () => {
    const scanner = html5QrCodeRef.current;
    if (scanner && scanner.isScanning) {
      try {
        await scanner.stop();
      } catch (err) {
        if (!String(err).includes("not running")) console.warn(err);
      }
    }
    html5QrCodeRef.current = null;
    setScanning(false);
  };

  const startScanner = () => {
    stopScanner();
    const scanner = new Html5Qrcode("qr-reader");
    html5QrCodeRef.current = scanner;
    setScanning(true);

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          await stopScanner();
          await handleScan(decodedText);
        },
        () => {}
      )
      .catch(() => {
        toast.error("Camera access denied or unavailable.");
        setScanning(false);
      });
  };

  useEffect(() => {
    if (!uploadMode) startScanner();
    else stopScanner();
    return () => stopScanner();
  }, [uploadMode]);

  const handleScan = async (qrData) => {
    try {
      if (!user?.uid) return toast.error("You must be logged in.");
      if (!qrData.includes("station=")) return toast.error("Invalid QR code format.");

      const scannedStationId = new URL(qrData).searchParams.get("station");
      if (scannedStationId !== stationId) return toast.error("Wrong QR code. Scan the correct station.");

      const stationRef = doc(db, "stations", stationId);
      const stationSnap = await getDoc(stationRef);
      if (!stationSnap.exists()) return toast.error("Station not found.");
      const stationData = stationSnap.data();

      const scanQuery = query(
        collection(db, "scans"),
        where("userId", "==", user.uid),
        where("stationId", "==", stationId)
      );
      const scanSnap = await getDocs(scanQuery);
      if (!scanSnap.empty) return toast.error("Already scanned this station.");

      const userRef = doc(db, "users", user.uid);
      const scanRef = doc(collection(db, "scans"));

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User not found");

        const currentPoints = userDoc.data().totalPoints || 0;
        const stationPoints = stationData.points || 0;
        const newPoints = currentPoints + stationPoints;

        transaction.update(userRef, { totalPoints: newPoints });
        transaction.set(scanRef, {
          userId: user.uid,
          stationId,
          pointsEarned: stationPoints,
          scannedAt: serverTimestamp(),
        });
      });

      toast.success(`✅ ${stationData.points} points earned!`);
    } catch {
      toast.error("Scan failed. Try again.");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const qrCode = new Html5Qrcode("qr-reader");
    try {
      const scanResult = await qrCode.scanFile(file, true);
      await handleScan(scanResult);
    } catch (err) {
      if (String(err).includes("No QR code detected")) toast.error("No QR code detected in image.");
      else toast.error("Image scan failed.");
    } finally {
      qrCode.stop().catch(() => {});
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-[#0d1b3a]/95 border-2 border-dashed border-[#00e0ff] rounded-2xl p-6 w-[320px] shadow-2xl flex flex-col items-center">


  <div className="w-full h-[250px] rounded-xl bg-black/20 flex items-center justify-center mb-4">
   
      <div id="qr-reader" className="w-full h-full flex items-center justify-center">
        {scanning ? (
          <p className="text-white text-sm animate-pulse">Scanning...</p>
        ) : (
          <p className="text-gray-400 text-sm">Initializing camera...</p>
        )}
      </div>
    </div>

  {uploadMode && (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleImageUpload}
      className="mt-2 w-full text-sm text-white"
    />
  )}

  <p className="text-xs text-gray-300 text-center mb-4">
    {uploadMode
      ? "Select an image containing the QR code."
      : "Align the QR code within the frame to check in."}
  </p>

 
</div>

  );
};

export default ScanQR;
