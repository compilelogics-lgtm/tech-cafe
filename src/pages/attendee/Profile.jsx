import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useAuth } from "../../contexts/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [scans, setScans] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // 🧩 Fetch user profile from Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setProfile(userSnap.data());

        // 📍 Fetch all stations
        const stationsSnap = await getDocs(collection(db, "stations"));
        const stationsList = stationsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // 🏁 Fetch user's scans
        const scansQuery = query(
          collection(db, "scans"),
          where("userId", "==", user.uid)
        );
        const scansSnap = await getDocs(scansQuery);
        const scanList = scansSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setStations(stationsList);
        setScans(scanList);
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return <div className="p-10 text-center text-gray-600">Loading profile...</div>;
  }

  const completedStations = scans.length;
  const totalStations = stations.length;
  const progress =
    totalStations > 0 ? (completedStations / totalStations) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white shadow p-6 rounded">
      {/* 🖼️ Profile Header */}
      <div className="flex flex-col items-center mb-6">
        <img
          src={
            profile?.photoURL ||
            "https://via.placeholder.com/120?text=No+Image"
          }
          alt="Profile"
          className="w-28 h-28 rounded-full border-4 border-indigo-500 object-cover mb-3"
        />
        <h2 className="text-2xl font-semibold text-gray-800">
          {profile?.name || "Unnamed User"}
        </h2>
        <p className="text-gray-500">{profile?.email}</p>
      </div>

      {/* 🏆 Stats */}
      <div className="mb-6 text-gray-700">
        <p>
          <strong>Total Points:</strong> {profile?.totalPoints ?? 0}
        </p>
        <p>
          <strong>Department:</strong> {profile?.department || "—"}
        </p>
      </div>

      {/* 📊 Progress */}
      <div className="mb-6">
        <p className="font-medium mb-1 text-gray-800">Progress</p>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-500 h-4 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm mt-1 text-gray-600">
          {completedStations} / {totalStations} stations completed
        </p>
      </div>

      {/* ✅ Completed Stations */}
      <div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800">
          🏁 Completed Stations
        </h3>
        {scans.length === 0 ? (
          <p className="text-gray-600">No stations completed yet.</p>
        ) : (
          <ul className="space-y-2">
            {scans.map((scan) => {
              const station = stations.find((s) => s.id === scan.stationId);
              return (
                <li
                  key={scan.id}
                  className="border p-3 rounded bg-gray-50 flex justify-between items-center text-gray-800"
                >
                  <span>{station?.name || "Unknown Station"}</span>
                  <span className="text-sm text-green-600 font-medium">
                    +{scan.pointsEarned} pts
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
