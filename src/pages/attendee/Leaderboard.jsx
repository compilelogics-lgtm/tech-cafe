import { useEffect, useState, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import profile1 from "../../assets/profile-2.png";
import leaderboard from "../../assets/leaderboard.png";
import map from "../../assets/journey-2.png";
import bg from "../../assets/image.png";


const navItems = [
  {
    label: "Leaderboard",
    path: "/attendee/leaderboard",
    icon: leaderboard,
  },
  {
    label: "Map",
    path: "/attendee/journey",
    icon: map,
  },
  {
    label: "Profile",
    path: "/attendee/profile",
    icon: profile1, // local image for active profile
  },
];
// ---------------- Avatar Component ----------------
const Avatar = ({ src, fallback, className }) => (
  <div className={`relative flex rounded-full overflow-hidden ${className}`}>
    {src ? (
      <img src={src} alt="avatar" className="w-full h-full object-cover" />
    ) : (
      <div className="flex items-center justify-center w-full h-full bg-gray-400">
        {fallback}
      </div>
    )}
  </div>
);

// ---------------- Card ----------------
const Card = ({ children, className }) => (
  <div className={`rounded-xl shadow relative ${className}`}>{children}</div>
);

const CardContent = ({ children, className }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

// ---------------- Leaderboard Page ----------------
export default function Leaderboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const navigate = useNavigate();


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

  if (loading)
    return (
      <div className="p-10 text-center text-white">Loading leaderboard...</div>
    );

  const topThree = users.slice(0, 3);
  const podiumData = [
    {
      ...topThree[1], // 2nd
      position: 2,
      podiumColor: "bg-[#ff7a00]",
      podiumHeight: "h-[70px]",
    },
    {
      ...topThree[0], // 1st
      position: 1,
      podiumColor: "bg-[#00e0ff]",
      podiumHeight: "h-[90px]",
    },
    {
      ...topThree[2], // 3rd
      position: 3,
      podiumColor: "bg-[#ff3b5c]",
      podiumHeight: "h-[60px]",
    },
  ].filter(Boolean);

  return (
    <div className="min-h-screen w-full relative bg-[linear-gradient(72deg,rgba(34,78,97,0.24)_0%,rgba(27,55,82,0.85)_50%,rgba(20,33,67,1)_100%),linear-gradient(104deg,rgba(34,78,97,0.64)_0%,rgba(13,27,58,1)_100%),linear-gradient(98deg,rgba(34,78,97,1)_0%,rgba(24,53,78,1)_47%,rgba(13,27,58,1)_100%)] text-white">
      {/* Background */}
     {/* <main className="relative min-h-screen w-full overflow-hidden bg-[linear-gradient(72deg,rgba(34,78,97,0.24)_0%,rgba(27,55,82,0.85)_50%,rgba(20,33,67,1)_100%),linear-gradient(104deg,rgba(34,78,97,0.64)_0%,rgba(13,27,58,1)_100%),linear-gradient(98deg,rgba(34,78,97,1)_0%,rgba(24,53,78,1)_47%,rgba(13,27,58,1)_100%)] bg-cover bg-center bg-no-repeat"> */}
       <img
         src={bg}
         alt="Group"
         className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
       />

      <div className="relative z-10 flex flex-col items-center pt-28 px-6 pb-36">
        <h1 className="text-2xl font-bold text-center mb-1">LEADERBOARD</h1>
        <p className="text-center text-gray-300 mb-8">
          Who’s leading the event challenge?
        </p>

        {/* Podium Top 3 */}
        <div className="flex justify-center items-end gap-6 mb-12 relative">
          {podiumData.map((p, idx) => (
            <div key={p.id} className="flex flex-col items-center">
              {/* Avatar */}
              <Avatar
                src={p.photoURL || "https://via.placeholder.com/64?text=👤"}
                fallback={(p.name || "U").charAt(0)}
                className="w-20 h-20 rounded-full border-4 border-white object-cover mb-2"
              />
              {/* Name */}
              <div className="text-sm font-medium text-white mb-1">
                {p.name || "Unnamed"}
              </div>
              {/* Podium Block */}
              <div
                className={`${p.podiumColor} ${p.podiumHeight} w-24 rounded-t-xl flex items-end justify-center`}
              />
              {/* Points */}
              <div className="bg-white text-indigo-900 font-bold rounded px-2 mt-1">
                {p.medal} {p.totalPoints || 0} pts
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable leaderboard */}
        <div
          ref={scrollRef}
          className="bg-white/10 rounded-lg p-4 w-full max-w-md max-h-[300px] overflow-y-auto scroll-smooth mb-6"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#4f46e5 transparent",
          }}
        >
          {users.map((u, idx) => {
            const isCurrentUser = user?.uid === u.id;
            return (
              <Card
                key={u.id}
                className={`flex justify-between items-center p-3 mb-2 rounded-md transition ${isCurrentUser
                    ? "bg-indigo-600 scale-105"
                    : "bg-white/5 hover:bg-white/20"
                  }`}
              >
                <CardContent className="flex items-center gap-3">
                  <span className="text-lg font-bold w-6 text-center">
                    {idx + 1}
                  </span>
                  <Avatar
                    src={u.photoURL}
                    fallback="👤"
                    className="w-10 h-10 border border-white/30"
                  />
                  <span>{u.name}</span>
                </CardContent>
                <span className="font-semibold">{u.totalPoints} pts</span>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom navigation */}
<nav className="fixed bottom-0 left-0 w-full h-[85px] bg-[#0f1930de] z-50">
  <div className="flex items-center justify-center gap-[73px] h-full px-7 md:px-8">
    {navItems.map((item) => {
      const isActive = location.pathname === item.path;

      // width classes for consistent clickable area
      const widthClass =
        item.label === "Leaderboard"
          ? "w-[71px]"
          : item.label === "Map"
          ? "w-[60px]"
          : "w-[41px]";

      return (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`flex flex-col items-center h-auto p-0 transition-opacity hover:opacity-80 ${widthClass}`}
        >
          <img
            className={`${
              item.label === "Profile"
                ? "w-[55px] h-[55px]"
                : "w-[55px] h-[55px]"
            }`}
            src={item.icon}
          />
         
        </button>
      );
    })}
  </div>
</nav>

    </div>
  );
}
