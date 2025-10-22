import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
  getDocs,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useAuth } from "../../contexts/AuthContext";

export default function AttendeeManager() {
  const { user } = useAuth();
  const [attendees, setAttendees] = useState([]);
  const [stations, setStations] = useState([]);
  const [scans, setScans] = useState({});
  const [participations, setParticipations] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");

  // ✅ Load all attendees
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

  // ✅ Load all stations
  useEffect(() => {
    const q = query(collection(db, "stations"), where("active", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      setStations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ✅ Load all scans
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

  // ✅ Load all participations
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

  // ✅ Toggle participation (does NOT affect points)
  const toggleParticipation = async (attendee, station, participated) => {
    if (participated) {
      // Remove participation
      const record = participations[attendee.id]?.[station.id];
      if (record) await deleteDoc(doc(db, "participations", record.id));
    } else {
      // Add participation
      await addDoc(collection(db, "participations"), {
        userId: attendee.id,
        stationId: station.id,
        name: attendee.name,
        email: attendee.email,
        markedAt: new Date(),
      });
    }
  };

  // ✅ Toggle scan completion (affects points)
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

  const filtered = attendees.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.rank.toString().includes(search)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-blue-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">
          🎓 Attendee Manager
        </h1>
        <p className="text-center text-gray-300 mb-6">
          Manage attendees, station progress, and participation
        </p>

        {/* 🔍 Search */}
        <div className="mb-6 flex justify-center">
          <input
            type="text"
            placeholder="Search attendee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-80 p-2 rounded bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none"
          />
        </div>

        {/* 📋 Table */}
        <div className="overflow-x-auto rounded-lg bg-white/10 border border-white/20">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-white/10 text-gray-200 uppercase text-xs">
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
                <>
                  <tr
                    key={a.id}
                    className="border-b border-white/10 hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-3 text-center font-semibold text-indigo-300">
                      #{a.rank}
                    </td>
                    <td className="px-4 py-3">{a.name}</td>
                    <td className="px-4 py-3 text-gray-300">{a.email}</td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {a.totalPoints}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          setExpanded(expanded === a.id ? null : a.id)
                        }
                        className="text-sm bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-700"
                      >
                        {expanded === a.id ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>

                  {/* 🔽 Expanded Station Details */}
                  {expanded === a.id && (
                    <tr className="bg-white/5">
                      <td colSpan="6" className="px-4 py-3">
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-300 mb-2 font-semibold">
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
                                  className="flex justify-between items-center bg-white/10 p-2 rounded-md"
                                >
                                  <div>
                                    <p className="font-medium">{st.name}</p>
                                    <p className="text-xs text-gray-300">
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
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
