import { useEffect, useState, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useAuth } from "../../contexts/AuthContext";

export default function Leaderboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const userList = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.role === "attendee")
          .sort((a, b) => b.totalPoints - a.totalPoints);
        setUsers(userList);
      } catch (err) {
        console.error("Error loading leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (scrollRef.current && users.length > 0 && user?.uid) {
      const index = users.findIndex((u) => u.id === user.uid);
      if (index !== -1) {
        const itemHeight = 70; // approximate row height
        const scrollPosition = Math.max(itemHeight * (index - 1), 0);
        scrollRef.current.scrollTo({
          top: scrollPosition,
          behavior: "smooth",
        });
      }
    }
  }, [users, user]);

  if (loading) {
    return <div className="p-10 text-center text-white">Loading leaderboard...</div>;
  }

  const topThree = users.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-blue-800 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-1">LEADERBOARD</h1>
        <p className="text-center text-gray-300 mb-8">
          Who’s leading the event challenge?
        </p>

        {/* 🥇 Podium for Top 3 */}
        <div className="flex justify-center items-end gap-6 mb-12">
          {topThree[1] && (
            <div className="flex flex-col items-center scale-95 opacity-90">
              <img
                src={
                  topThree[1].photoURL ||
                  "https://via.placeholder.com/64?text=👤"
                }
                alt={topThree[1].name}
                className="w-16 h-16 rounded-full border-4 border-gray-300 object-cover"
              />
              <div className="bg-gray-300 px-3 py-1 mt-2 rounded font-bold text-indigo-900">
                🥈 {topThree[1].totalPoints} pts
              </div>
              <p className="mt-1 text-sm">{topThree[1].name}</p>
            </div>
          )}

          {topThree[0] && (
            <div className="flex flex-col items-center scale-110">
              <img
                src={
                  topThree[0].photoURL ||
                  "https://via.placeholder.com/80?text=👑"
                }
                alt={topThree[0].name}
                className="w-20 h-20 rounded-full border-4 border-yellow-400 object-cover"
              />
              <div className="bg-yellow-400 px-3 py-1 mt-2 rounded font-bold text-indigo-900">
                🥇 {topThree[0].totalPoints} pts
              </div>
              <p className="mt-1 font-medium">{topThree[0].name}</p>
            </div>
          )}

          {topThree[2] && (
            <div className="flex flex-col items-center scale-95 opacity-90">
              <img
                src={
                  topThree[2].photoURL ||
                  "https://via.placeholder.com/64?text=🏅"
                }
                alt={topThree[2].name}
                className="w-16 h-16 rounded-full border-4 border-orange-400 object-cover"
              />
              <div className="bg-orange-400 px-3 py-1 mt-2 rounded font-bold text-indigo-900">
                🥉 {topThree[2].totalPoints} pts
              </div>
              <p className="mt-1 text-sm">{topThree[2].name}</p>
            </div>
          )}
        </div>

        {/* 📜 Scrollable leaderboard */}
        <div
          ref={scrollRef}
          className="bg-white/10 rounded-lg p-4 max-h-[220px] overflow-y-auto scroll-smooth"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#4f46e5 transparent",
          }}
        >
          {users.map((u, index) => {
            const rank = index + 1;
            const isCurrentUser = user?.uid === u.id;

            return (
              <div
                key={u.id}
                className={`flex justify-between items-center p-3 mb-2 rounded-md transition ${
                  isCurrentUser
                    ? "bg-indigo-600 scale-105"
                    : "bg-white/5 hover:bg-white/20"
                }`}
                style={{
                  minHeight: "60px",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold w-6 text-center">
                    {rank}
                  </span>
                  <img
                    src={
                      u.photoURL ||
                      "https://via.placeholder.com/40?text=👤"
                    }
                    alt={u.name}
                    className="w-10 h-10 rounded-full border border-white/30 object-cover"
                  />
                  <span>{u.name}</span>
                </div>
                <span className="font-semibold">{u.totalPoints} pts</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
