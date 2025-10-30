import { useEffect, useState, useCallback } from "react";
import React from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useAuth } from "../../contexts/AuthContext";
import ModeratorNavbar from "../../components/ui/ModeratorNavbar";
import { Html5Qrcode } from "html5-qrcode";

export default function AttendeeManager() {
  const { user } = useAuth();
  const [attendees, setAttendees] = useState([]);
  const [stations, setStations] = useState([]);
  const [scans, setScans] = useState({});
  const [participations, setParticipations] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerInstance, setScannerInstance] = useState(null);

  // -------------------- Fetch Data --------------------
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("totalPoints", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs
        .map((d, i) => ({ id: d.id, rank: i + 1, ...d.data() }))
        .filter((u) => u.role === "attendee");
      setAttendees(all);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "stations"), where("active", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      setStations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "scans"), (snap) => {
      const data = {};
      snap.docs.forEach((d) => {
        const s = d.data();
        if (!data[s.userId]) data[s.userId] = {};
        data[s.userId][s.stationId] = { id: d.id, ...s };
      });
      setScans(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "participations"), (snap) => {
      const data = {};
      snap.docs.forEach((d) => {
        const s = d.data();
        if (!data[s.userId]) data[s.userId] = {};
        data[s.userId][s.stationId] = { id: d.id, ...s };
      });
      setParticipations(data);
    });
    return () => unsub();
  }, []);

  // -------------------- Participation & Scans --------------------
  const toggleParticipation = async (attendee, station, participated) => {
    if (participated) {
      const record = participations[attendee.id]?.[station.id];
      if (record) await deleteDoc(doc(db, "participations", record.id));
    } else {
      await addDoc(collection(db, "participations"), {
        userId: attendee.id,
        stationId: station.id,
        name: attendee.name,
        email: attendee.email,
        markedAt: new Date(),
      });
    }
  };

  const toggleStation = async (attendee, station, completed) => {
    const userRef = doc(db, "users", attendee.id);
    const currentPoints = attendee.totalPoints || 0;

    if (completed) {
      const scan = scans[attendee.id]?.[station.id];
      if (scan) {
        await deleteDoc(doc(db, "scans", scan.id));
        await updateDoc(userRef, {
          totalPoints: Math.max(currentPoints - station.points, 0),
        });
      }
    } else {
      await addDoc(collection(db, "scans"), {
        userId: attendee.id,
        stationId: station.id,
        pointsEarned: station.points,
        scannedAt: new Date(),
      });
      await updateDoc(userRef, {
        totalPoints: currentPoints + station.points,
      });
    }
  };

// -------------------- QR Scanner --------------------
const openScanner = () => setScannerOpen(true);

useEffect(() => {
  if (!scannerOpen) return;

  const qrElement = document.getElementById("qr-reader");
  if (!qrElement) return;

  const html5QrCode = new Html5Qrcode("qr-reader");
  setScannerInstance(html5QrCode);

  let stopped = false;

  const startScanner = async () => {
    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          if (stopped) return;

          const matchedUser = attendees.find(
            (u) => u.id === decodedText || u.email === decodedText
          );

          if (matchedUser) {
            setExpanded(matchedUser.id);

            // Smooth scroll and highlight
            setTimeout(() => {
              const el = document.getElementById(`attendee-${matchedUser.id}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("highlight-pulse");
                setTimeout(() => el.classList.remove("highlight-pulse"), 2000);
              }
            }, 300);

            stopped = true;
            await safeStopScanner(html5QrCode);
            setScannerOpen(false);
          } else {
            alert("User not found in attendee list.");
          }
        },
        (err) => console.warn("QR scan error:", err)
      );
    } catch (err) {
      console.error("Unable to start QR scanner:", err);
    }
  };

  const timeout = setTimeout(startScanner, 300);

  return () => {
    clearTimeout(timeout);
    stopped = true;
    safeStopScanner(html5QrCode);
  };
}, [scannerOpen, attendees]);

const safeStopScanner = async (scanner) => {
  if (!scanner) return;
  try {
    const state = scanner.getState?.();
    if (state === 2 || state === 1) { // 2=SCANNING, 1=PAUSED
      await scanner.stop();
    }
  } catch (err) {
    console.warn("Stop error:", err.message);
  }
  try {
    await scanner.clear();
  } catch (err) {
    console.warn("Clear warning:", err.message);
  }
};

const closeScanner = async () => {
  await safeStopScanner(scannerInstance);
  setScannerOpen(false);
};

  // -------------------- Filter --------------------
  const filtered = attendees.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.rank.toString().includes(search)
  );

  return (
    <>
      <ModeratorNavbar />
      {/* Inline highlight CSS */}
      <style>
        {`
          @keyframes pulseHighlight {
            0% { box-shadow: 0 0 0px 0 rgba(0, 224, 255, 0.8); }
            50% { box-shadow: 0 0 25px 5px rgba(0, 224, 255, 0.8); }
            100% { box-shadow: 0 0 0px 0 rgba(0, 224, 255, 0); }
          }
          .highlight-pulse {
            animation: pulseHighlight 2s ease-in-out;
            border-color: #00E0FF !important;
          }
        `}
      </style>

      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 p-6 pt-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-semibold text-center mb-2">
            Attendee Manager
          </h1>
          <p className="text-center text-gray-400 mb-6">
            Manage attendees, monitor progress, and track participation
          </p>

          {/* 🔍 Search + Scan */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-6">
            <input
              type="text"
              placeholder="Search attendee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 p-2 rounded-lg bg-white/10 text-gray-100 placeholder-gray-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#00E0FF]"
            />
            <button
              onClick={openScanner}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#00E0FF]/20 border border-[#00E0FF]/50 text-[#00E0FF] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00E0FF]/30 transition"
            >
              📷 Scan QR
            </button>
          </div>

          {/* 📋 Attendees */}
          <div className="mt-6">
            <div className="hidden md:block overflow-x-auto bg-[#1E1E28] border border-[#224E61] rounded-xl p-4">
              <table className="min-w-full text-sm text-left text-gray-200">
                <thead className="bg-[#0000001a] text-white/70 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-center">Rank</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 text-center">Points</th>
                    <th className="px-4 py-3 text-center">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <React.Fragment key={a.id}>
                      <tr
                        id={`attendee-${a.id}`}
                        className="border-b border-[#224E61]/30 hover:bg-[#00E0FF]/5 transition"
                      >
                        <td className="px-4 py-3 text-center font-semibold text-cyan-400">
                          #{a.rank}
                        </td>
                        <td className="px-4 py-3 font-medium">{a.name}</td>
                        <td className="px-4 py-3 text-gray-400">{a.email}</td>
                        <td className="px-4 py-3 text-center font-semibold text-white">
                          {a.totalPoints}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              setExpanded(expanded === a.id ? null : a.id)
                            }
                            className="bg-[#00E0FF]/20 border border-[#00E0FF]/50 text-[#00E0FF] px-3 py-1 rounded-lg text-sm hover:bg-[#00E0FF]/30 transition"
                          >
                            {expanded === a.id ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                      {expanded === a.id && (
                        <tr className="bg-[#00000033]">
                          <td colSpan="6" className="px-4 py-3">
                            <div className="space-y-3 text-sm">
                              <p className="text-gray-300 font-semibold">
                                Station Progress:
                              </p>
                              <div className="grid md:grid-cols-2 gap-3">
                                {stations.map((st) => {
                                  const completed = !!scans[a.id]?.[st.id];
                                  const participated =
                                    !!participations[a.id]?.[st.id];
                                  return (
                                    <div
                                      key={st.id}
                                      className="flex justify-between items-center bg-[#1E1E28] border border-[#224E61]/40 p-3 rounded-lg"
                                    >
                                      <div>
                                        <p className="font-medium text-white">
                                          {st.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                          {st.points} pts
                                        </p>
                                      </div>
                                      <div className="flex gap-3 items-center">
                                        <label className="flex items-center gap-1">
                                          <input
                                            type="checkbox"
                                            checked={participated}
                                            onChange={() =>
                                              toggleParticipation(
                                                a,
                                                st,
                                                participated
                                              )
                                            }
                                            className="w-4 h-4 accent-yellow-400"
                                          />
                                          <span className="text-xs text-gray-300">
                                            Participated
                                          </span>
                                        </label>
                                        <label className="flex items-center gap-1">
                                          <input
                                            type="checkbox"
                                            checked={completed}
                                            onChange={() =>
                                              toggleStation(a, st, completed)
                                            }
                                            className="w-4 h-4 accent-green-500"
                                          />
                                          <span className="text-xs text-gray-300">
                                            Scanned
                                          </span>
                                        </label>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="grid gap-4 md:hidden">
              {filtered.map((a) => (
                <div
                  key={a.id}
                  id={`attendee-${a.id}`}
                  className="bg-[#1E1E28] border border-[#224E61] rounded-xl p-4 shadow-[0_0_15px_#00E0FF20]"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-[#00E0FF]">
                        #{a.rank} • {a.name}
                      </h3>
                      <p className="text-gray-400 text-sm">{a.email}</p>
                    </div>
                    <p className="text-cyan-400 font-bold text-sm">
                      {a.totalPoints} pts
                    </p>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() =>
                        setExpanded(expanded === a.id ? null : a.id)
                      }
                      className="bg-[#00E0FF]/20 border border-[#00E0FF]/50 text-[#00E0FF] px-3 py-1 rounded-lg text-sm hover:bg-[#00E0FF]/30 transition"
                    >
                      {expanded === a.id ? "Hide" : "View"}
                    </button>
                  </div>
                  {expanded === a.id && (
                    <div className="mt-4 bg-[#00000033] p-3 rounded-lg">
                      <p className="text-gray-300 font-semibold text-sm mb-2">
                        Station Progress:
                      </p>
                      <div className="grid gap-3">
                        {stations.map((st) => {
                          const completed = !!scans[a.id]?.[st.id];
                          const participated = !!participations[a.id]?.[st.id];
                          return (
                            <div
                              key={st.id}
                              className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#1E1E28] border border-[#224E61]/40 p-3 rounded-lg"
                            >
                              <div>
                                <p className="font-medium text-white">
                                  {st.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {st.points} pts
                                </p>
                              </div>
                              <div className="flex gap-3 mt-2 sm:mt-0">
                                <label className="flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    checked={participated}
                                    onChange={() =>
                                      toggleParticipation(a, st, participated)
                                    }
                                    className="w-4 h-4 accent-yellow-400"
                                  />
                                  <span className="text-xs text-gray-300">
                                    Participated
                                  </span>
                                </label>
                                <label className="flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    checked={completed}
                                    onChange={() =>
                                      toggleStation(a, st, completed)
                                    }
                                    className="w-4 h-4 accent-green-500"
                                  />
                                  <span className="text-xs text-gray-300">
                                    Scanned
                                  </span>
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scanner Modal */}
      {/* Scanner Modal */}
      {scannerOpen && (
        <div id="scanner-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1E1E28] border border-[#224E61] rounded-xl p-6 shadow-xl w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-center mb-4 text-[#00E0FF]">
              Scan Attendee QR
            </h2>

            <div
              id="qr-reader"
              className="w-full h-[300px] rounded-lg overflow-hidden"
            />

            <button
              onClick={closeScanner}
              className="mt-4 w-full bg-[#00E0FF]/20 border border-[#00E0FF]/50 text-[#00E0FF] py-2 rounded-lg text-sm hover:bg-[#00E0FF]/30 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
