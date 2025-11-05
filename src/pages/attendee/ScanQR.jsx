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
import toast from "react-hot-toast";

const ScanQR = ({ stationId, onSuccess }) => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [showPoints, setShowPoints] = useState(null);
  const html5QrCodeRef = useRef(null);
  const scannedOnce = useRef(false); // <-- NEW: prevents multiple awards

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {}
      html5QrCodeRef.current = null;
    }
  };

  const startScanner = () => {
    stopScanner();
    scannedOnce.current = false; // reset on start
    const scanner = new Html5Qrcode("qr-reader");
    html5QrCodeRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          if (scannedOnce.current) return; // skip if already scanned
          scannedOnce.current = true;

          setProcessing(true);
          await stopScanner(); // stop camera before handling scan
          const success = await handleScan(decodedText);
          setProcessing(false);

          if (success) {
            setShowPoints(success.points || 0);
            setTimeout(() => {
              setShowPoints(null);
              if (onSuccess) onSuccess(); // close modal
            }, 1500);
          }
        }
      )
      .catch(() => toast.error("Camera unavailable or denied."));
  };

  useEffect(() => {
    startScanner();
    return () => stopScanner();
  }, []);

  const handleScan = async (qrData) => {
    try {
      if (!user?.uid) return toast.error("Login required.");
      if (!qrData.includes("station=")) return toast.error("Invalid QR format.");

      const scannedStationId = new URL(qrData).searchParams.get("station");
      if (scannedStationId !== stationId) return toast.error("Wrong station QR.");

      const stationRef = doc(db, "stations", stationId);
      const stationSnap = await getDoc(stationRef);
      if (!stationSnap.exists()) return toast.error("Station missing.");
      const stationData = stationSnap.data();

      // Already scanned?
      const scanQ = query(
        collection(db, "scans"),
        where("userId", "==", user.uid),
        where("stationId", "==", stationId)
      );
      const scanCheck = await getDocs(scanQ);
      if (!scanCheck.empty) return toast.error("Already scanned.");

      const userRef = doc(db, "users", user.uid);
      const scanRef = doc(collection(db, "scans"));

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User missing.");

        const newPoints =
          (userDoc.data().totalPoints || 0) + (stationData.points || 0);

        transaction.update(userRef, { totalPoints: newPoints });
        transaction.set(scanRef, {
          userId: user.uid,
          stationId,
          pointsEarned: stationData.points || 0,
          scannedAt: serverTimestamp(),
        });
      });

      return { success: true, points: stationData.points || 0 };
    } catch (err) {
      console.log(err);
      toast.error("Scan failed. Try again.");
      return null;
    }
  };

  return (
    <div className="bg-[#0d1b3a]/95 border-2 border-dashed border-[#00e0ff] rounded-2xl p-6 w-[320px] shadow-2xl flex flex-col items-center relative">
      <div className="w-full h-[250px] rounded-xl bg-black/20 flex items-center justify-center mb-4">
        <div id="qr-reader" className="w-full h-full flex items-center justify-center">
          {processing ? (
            <p className="text-white text-sm animate-pulse">Scanning...</p>
          ) : (
            <p className="text-gray-400 text-sm">Align QR inside the frame</p>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-300 text-center">
        Align QR inside the frame to scan.
      </p>

      {showPoints !== null && (
        <div className="absolute top-16 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg animate-fade-up">
          +{showPoints} points!
        </div>
      )}

      <style>{`
        @keyframes fade-up {
          0% { opacity: 0; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-10px); }
          100% { opacity: 0; transform: translateY(-30px); }
        }
        .animate-fade-up {
          animation: fade-up 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ScanQR;
