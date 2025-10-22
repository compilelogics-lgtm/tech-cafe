import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useAuth } from "../../contexts/AuthContext";

export default function Journey() {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [popup, setPopup] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const stationsSnap = await getDocs(collection(db, "stations"));
        const stationsList = stationsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const partSnap = await getDocs(
          query(collection(db, "participations"), where("userId", "==", user.uid))
        );
        const partList = partSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setStations(stationsList);
        setParticipations(partList);
      } catch (err) {
        console.error("Error loading journey:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleParticipate = async (station) => {
    try {
      await addDoc(collection(db, "participations"), {
        userId: user.uid,
        email: user.email,
        name: user.name,
        stationId: station.id,
        markedAt: serverTimestamp(),
      });

      setParticipations((prev) => [
        ...prev,
        { userId: user.uid, stationId: station.id },
      ]);
      setPopup(`🎉 You’ve registered for ${station.name}!`);
      setTimeout(() => setPopup(""), 3000);
      setSelected(null);
    } catch (err) {
      console.error("Error marking participation:", err);
    }
  };

  const isParticipated = (stationId) =>
    participations.some((p) => p.stationId === stationId);

  if (loading) return <div className="p-10 text-center">Loading journey...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-blue-800 text-white p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">🚀 Your Journey Awaits</h1>

        <div className="relative border-l-4 border-indigo-500 pl-6 space-y-6">
          {stations.map((station, i) => (
            <div key={station.id} className="relative">
              <div className="absolute -left-[26px] w-5 h-5 rounded-full bg-indigo-500 border-4 border-white"></div>
              <div className="bg-white/10 p-4 rounded-lg">
                <h2 className="text-lg font-semibold">{station.name}</h2>
                <p className="text-sm text-gray-300">Points: {station.points}</p>

                {isParticipated(station.id) ? (
                  <p className="mt-2 text-green-400 font-medium">✅ Participated</p>
                ) : (
                  <button
                    onClick={() => setSelected(station)}
                    className="mt-3 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-sm"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white text-indigo-900 rounded-lg p-6 w-80 shadow-lg">
            <h2 className="text-xl font-bold mb-2">{selected.name}</h2>
            <p className="text-sm mb-4">Points: {selected.points}</p>
            {!isParticipated(selected.id) ? (
              <button
                onClick={() => handleParticipate(selected)}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Mark as Participated
              </button>
            ) : (
              <p className="text-green-600 font-medium">Already Participated ✅</p>
            )}
            <button
              onClick={() => setSelected(null)}
              className="block mt-3 text-sm text-gray-600 hover:text-indigo-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Popup Toast */}
      {popup && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          {popup}
        </div>
      )}
    </div>
  );
}
