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

const ScanQR = () => {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const fileInputRef = useRef();
  // Use useRef to safely store the scanner instance
  const html5QrCodeRef = useRef(null); 

  // --- Scanner Control Functions ---

  const stopScanner = async () => {
    const scanner = html5QrCodeRef.current;
    
    // Safely check if a scanner instance exists and is actively scanning
    if (scanner && scanner.isScanning) { 
      try {
        await scanner.stop();
        console.log("Scanner successfully stopped.");
      } catch (err) {
        // Suppress expected errors ("not running") but log others
        if (!String(err).includes("not running")) {
            console.warn("Scanner stop warning:", err);
        }
      }
    }
    // Cleanup state and reference
    setScanning(false);
    html5QrCodeRef.current = null; 
  };

  const startScanner = () => {
    // 1. Clean up any previous instance first
    stopScanner(); 
    
    const scanner = new Html5Qrcode("qr-reader");
    html5QrCodeRef.current = scanner; // Store the new instance

    setScanning(true);

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      async (decodedText) => {
        // Successful scan handler
        // Stop the scanner immediately upon successful scan
        await stopScanner(); 
        await handleScan(decodedText);
      },
      (errorMsg) => {
        // Handle minor errors or warnings quietly
      }
    )
    .catch(err => {
        // Handle major errors (like permission denied) gracefully
        console.error("Scanner failed to start:", err);
        toast.error("Camera access denied or camera in use. Switch to upload mode.");
        setScanning(false);
        html5QrCodeRef.current = null;
    });
  };

  // useEffect: Handles startup, mode switching, and unmount cleanup
  useEffect(() => {
    if (!uploadMode) {
      startScanner();
    } else {
      stopScanner(); // Stop if switching to upload mode
    }
    
    // Cleanup function: runs on component unmount
    return () => {
      stopScanner();
    };
  }, [uploadMode]);

  // --- Data and Transaction Logic ---

  const handleScan = async (qrData) => {
    try {
      if (!user?.uid) {
        toast.error("You must be logged in.");
        return;
      }

      // QR data format check
      if (!qrData.includes("station=")) {
        toast.error("Invalid QR code format.");
        return;
      }

      const stationId = new URL(qrData).searchParams.get("station");
      if (!stationId) return toast.error("Invalid QR content.");

      // 1️⃣ Check if station exists
      const stationRef = doc(db, "stations", stationId);
      const stationSnap = await getDoc(stationRef);
      if (!stationSnap.exists()) return toast.error("Station not found.");

      const stationData = stationSnap.data();

      // 2️⃣ Check for duplicate scan
      const scanQuery = query(
        collection(db, "scans"),
        where("userId", "==", user.uid),
        where("stationId", "==", stationId)
      );
      const scanSnap = await getDocs(scanQuery);
      if (!scanSnap.empty) {
        toast.error("You already scanned this station!");
        return;
      }

      // 3️⃣ Transaction: update user points + log scan
      const userRef = doc(db, "users", user.uid);
      const scanRef = doc(collection(db, "scans"));

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User not found");

        // Safely access and update points field
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

      toast.success(`+${stationData.points} points added! 🎉`);
    } catch (err) {
      console.error(err);
      toast.error("Scan failed. Try again.");
    } 
  };
  
  // 🛑 Corrected handleImageUpload: Solves "Cannot stop" error in file mode
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Use a clean, new instance for file scanning
    const qrCode = new Html5Qrcode("qr-reader"); 
    let scanResult = null;

    try {
      // Attempt to scan the file
      scanResult = await qrCode.scanFile(file, true);
      
      // If successful, handle the data
      await handleScan(scanResult);

    } catch (err) {
      // Check for failed detection or other errors
      if (String(err).includes("No QR code detected in image")) {
          toast.error("No QR code detected in image.");
      } else {
          console.error("Image scan error:", err);
          toast.error("Image scan failed. Try a different image.");
      }
    } 
    
    // CRITICAL FIX: Always stop the temporary file scanner, suppressing any error
    // to prevent the "Cannot stop, scanner is not running or paused." error.
    finally {
      qrCode.stop().catch(stopErr => {
          if (!String(stopErr).includes("not running")) {
              console.warn("File scanner cleanup warning:", stopErr);
          }
      });
      // Clear file input to allow re-uploading the same file
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // --- Render ---

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow rounded-2xl text-center">
      <Toaster position="top-center" />
      <h2 className="text-2xl font-semibold mb-6">Scan QR to Earn Points</h2>

      {/* 🛑 FIX: The qr-reader div must ALWAYS be in the DOM. 
           We use inline style to hide it when uploadMode is true. */}
      <div 
        id="qr-reader" 
        className="w-full min-h-[300px] bg-gray-100 rounded"
        style={{ display: uploadMode ? 'none' : 'block' }} // Hides it visually
      ></div>

      {!uploadMode ? (
        // Camera Mode UI
        <>
          {scanning && <p className="text-blue-500 mt-4 text-sm">Camera active. Point at QR code.</p>}
          {!scanning && html5QrCodeRef.current === null && (
            <p className="text-red-500 mt-4 text-sm">Scanner initializing or permission denied.</p>
          )}
          <p className="text-gray-600 mt-4 text-sm">
            Point your camera at the station QR code
          </p>
        </>
      ) : (
        // Upload Mode UI
        <div className="mt-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-gray-600 text-sm mt-2">
            Upload an image of the QR code
          </p>
        </div>
      )}

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mt-6 hover:bg-blue-700 transition duration-150"
        onClick={() => setUploadMode((prev) => !prev)}
      >
        {uploadMode ? "Switch to Camera Mode" : "Upload QR Image"}
      </button>
    </div>
  );
};

export default ScanQR;