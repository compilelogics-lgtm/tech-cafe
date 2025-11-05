import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import ScanQR from "./ScanQR";
import bg from "../../assets/image.png";

export default function Journey() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [selectedForScan, setSelectedForScan] = useState(null);
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

        setStations(stationsList.slice(0, 6));
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
    // Firestore participation record
    await addDoc(collection(db, "participations"), {
      userId: user.uid,
      email: user.email,
      name: user.displayName || user.email,
      stationId: station.id,
      markedAt: serverTimestamp(),
      autoRewarded: station.points === 0, // flag for 0-point stations
    });

    // Update UI state
    setParticipations((prev) => [
      ...prev,
      { userId: user.uid, stationId: station.id, autoRewarded: station.points === 0 },
    ]);

    // Popup feedback
    setPopup(
      station.points === 0
        ? `✅ ${station.name} marked as completed!`
        : `🎉 You've registered for ${station.name}!`
    );
    setTimeout(() => setPopup(""), 3000);

    // Close modal
    setSelected(null);

    // Only open QR if not zero-point
    if (station.points > 0) {
      setSelectedForScan(station);
    }
  } catch (err) {
    console.error("Error marking participation:", err);
  }
};


  const isParticipated = (stationId) =>
    participations.some((p) => p.stationId === stationId);

  const mapNodes = [
    {
      number: "01",
      label: "Futuristic\nWelcome",
      bgColor: "bg-[#e24d22]",
      position: "top-[414px] left-[164px]",
      labelPosition: "top-[442px] left-[138px]",
      chevronPosition: "top-[433px] left-[186px]",
      chevronSize: "w-[39px] h-[39px]",
      chevronSrc: "https://c.animaapp.com/mh3vxzzxbLNePl/img/mynaui-chevron-up-solid.svg",
    },
    {
      number: "02",
      label: "Event \nPassport",
      bgColor: "bg-[#fea724]",
      position: "top-[304px] left-[215px]",
      labelPosition: "top-[300px] left-[327px]",
      chevronPosition: "top-[302px] left-[301px]",
      chevronSize: "w-[34px] h-[34px]",
      chevronSrc: "https://c.animaapp.com/mh3vxzzxbLNePl/img/mynaui-chevron-up-solid-2.svg",
    },
    {
      number: "03",
      label: "AI \nChallenges",
      bgColor: "bg-[#e24d22]",
      position: "top-[302px] left-[92px]",
      labelPosition: "top-[334px] left-[70px]",
      labelWidth: "w-[74px]",
      chevronPosition: "top-[318px] left-[110px]",
      chevronSize: "w-[39px] h-[39px]",
      chevronSrc: "https://c.animaapp.com/mh3vxzzxbLNePl/img/mynaui-chevron-up-solid.svg",
    },
    {
      number: "04",
      label: "XR/Metaverse\nCorner",
      bgColor: "bg-[#fea724]",
      position: "top-[180px] left-[143px]",
      labelPosition: "top-44 left-[257px]",
      chevronPosition: "top-[179px] left-[229px]",
      chevronSize: "w-[33px] h-[33px]",
      chevronSrc: "https://c.animaapp.com/mh3vxzzxbLNePl/img/mynaui-chevron-up-solid-2.svg",
    },
    {
      number: "05",
      label: "Tech\nCircles",
      bgColor: "bg-[#e24d22]",
      position: "top-44 left-0",
      labelPosition: "top-[204px] left-0",
      chevronPosition: "top-[195px] left-[18px]",
      chevronSize: "w-[39px] h-[39px]",
      chevronSrc: "https://c.animaapp.com/mh3vxzzxbLNePl/img/mynaui-chevron-up-solid.svg",
    },
    {
      number: "06",
      label: "Prizes &\nGiveaways",
      bgColor: "bg-[#fea724]",
      position: "top-[86px] left-[86px]",
      labelPosition: "top-[88px] left-[200px]",
      chevronPosition: "top-[90px] left-[173px]",
      chevronSize: "w-[30px] h-[30px]",
      chevronSrc: "https://c.animaapp.com/mh3vxzzxbLNePl/img/mynaui-chevron-up-solid-2.svg",
    },
  ];

  const pathVectors = [
    {
      position: "absolute top-[179px] left-[23px]",
      size: "w-[134px] h-14",
      src: "https://c.animaapp.com/mh3vxzzxbLNePl/img/vector-18.svg",
    },
    {
      position: "absolute top-[120px] left-3.5",
      size: "w-[92px] h-[60px]",
      src: "https://c.animaapp.com/mh3vxzzxbLNePl/img/vector-19.svg",
    },
    {
      position: "absolute top-[212px] left-[97px]",
      size: "w-[89px] h-24",
      src: "https://c.animaapp.com/mh3vxzzxbLNePl/img/vector-17.svg",
    },
    {
      position: "absolute top-[300px] left-[122px]",
      size: "w-[108px] h-[46px]",
      src: "https://c.animaapp.com/mh3vxzzxbLNePl/img/vector-16.svg",
    },
    {
      position: "absolute top-[420px] left-[194px]",
      size: "w-[67px] h-10",
      src: "https://c.animaapp.com/mh3vxzzxbLNePl/img/vector-14.svg",
    },
    {
      position: "absolute top-[341px] left-[169px]",
      size: "w-[84px] h-[82px]",
      src: "https://c.animaapp.com/mh3vxzzxbLNePl/img/vector-15.svg",
    },
    {
      position: "absolute top-[25px] left-[68px]",
      size: "w-14 h-[70px]",
      src: "https://c.animaapp.com/mh3vxzzxbLNePl/img/vector-20.svg",
    },
  ];

  if (loading) return <div className="p-10 text-center text-white">Loading journey...</div>;

  return (
   <main className="relative min-h-screen w-full bg-[linear-gradient(72deg,rgba(34,78,97,0.24)_0%,rgba(27,55,82,0.85)_50%,rgba(20,33,67,1)_100%),linear-gradient(104deg,rgba(34,78,97,0.64)_0%,rgba(13,27,58,1)_100%),linear-gradient(98deg,rgba(34,78,97,1)_0%,rgba(24,53,78,1)_47%,rgba(13,27,58,1)_100%)] bg-cover bg-center bg-no-repeat">
  <img
    src={bg}
    alt="Group"
    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
  />


      <header className="absolute top-[119px] left-[calc(50%_-_170px)]">
        <h1 className="[font-family:'Poppins',Helvetica] font-semibold text-white text-[22px] tracking-[0] leading-[normal] translate-y-[-1rem] animate-fade-in opacity-0">
          YOUR EVENT JOURNEY AWAITS!
        </h1>
        <p className="[font-family:'Poppins',Helvetica] font-normal text-[#b4c1d9] text-xs tracking-[0] leading-[normal] mt-2 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
          Track your stops, earn points, and complete the roadmap!
        </p>
      </header>

      <section className="absolute top-[200px] left-[calc(50%_-_190px)] w-[393px] h-[478px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
        <div className="absolute top-0 left-[47px] w-[261px] h-[460px] z-20">
          {pathVectors.map((vector, i) => (
            <img key={i} className={`${vector.position} ${vector.size} pointer-events-none`} alt="Vector" src={vector.src} />
          ))}

          {stations.map((station, index) => {
            const node = mapNodes[index];
            if (!node) return null;
            const participated = isParticipated(station.id);

            return (
              <div key={station.id}>
                <button
                  onClick={() => setSelected(station)}
                  className={`absolute ${node.position} w-[47px] h-[45px] transition-transform hover:scale-110 cursor-pointer`}
                >
                  <div className={`${node.bgColor} ${participated ? "ring-4 ring-green-400" : ""} absolute top-0 left-0 w-[45px] h-[45px] rounded-[22.5px] border-[3px] border-solid border-white`} />
                  <div className={`${node.number === "01" || node.number === "05" || node.number === "06" ? "left-[9px]" : node.number === "04" ? "left-[9px]" : "left-2.5"} absolute top-2 [font-family:'Poppins',Helvetica] font-semibold text-white text-xl text-center tracking-[0] leading-[normal]`}>
                    {node.number}
                  </div>
                  {participated && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      ✓
                    </div>
                  )}
                </button>

                <div className={`absolute ${node.labelPosition} ${node.labelWidth || ""} [font-family:'Poppins',Helvetica] font-medium text-white text-xs ${node.labelWidth ? "text-center" : ""} tracking-[0.05px] leading-[normal] whitespace-pre-line pointer-events-none`}>
                  {station.name || node.label}
                </div>

                <img
                  className={`absolute ${node.chevronPosition} ${node.chevronSize}`}
                  alt="Mynaui chevron up"
                  src={node.chevronSrc}
                />
              </div>
            );
          })}

          <img
            className="absolute top-0 left-[50px] w-[37px] h-9 object-cover"
            alt="Screenshot"
            src="https://c.animaapp.com/mh3vxzzxbLNePl/img/screenshot-2025-10-07-191423-removebg-preview--1--1.png"
          />
        </div>

        <div className="absolute top-[408px] left-[297px] w-[35px] h-[37px] flex rotate-90">
          <img
            className="mt-px w-[37px] h-[35px] -ml-px -rotate-90 object-cover"
            alt="Screenshot"
            src="https://c.animaapp.com/mh3vxzzxbLNePl/img/screenshot-2025-10-07-181305-removebg-preview--1--1.png"
          />
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 w-full h-[85px] bg-[#0f1930de]">
        <div className="flex items-center justify-center gap-[73px] h-full px-7 md:px-8">
          <button
            onClick={() => navigate("/attendee/leaderboard")}
            className="flex flex-col w-[71px] items-center h-auto p-0 transition-opacity hover:opacity-80"
          >
            <img className="w-[41px] h-[41px]" alt="Leaderboard" src="https://c.animaapp.com/mh3vxzzxbLNePl/img/iconoir-leaderboard-star.svg" />
            <span className="[font-family:'Poppins',Helvetica] font-light text-[#b4c1d9] text-[11px] text-center tracking-[0] leading-[normal]">
              Leaderboard
            </span>
          </button>

          <button
            onClick={() => navigate("/attendee/journey")}
            className="flex flex-col w-[60px] items-center h-auto p-0"
          >
            <img className="w-full h-[47px]" alt="Map" src="https://c.animaapp.com/mh3vxzzxbLNePl/img/et-map.svg" />
            <span className="[font-family:'Poppins',Helvetica] font-medium text-[#00e0ffc4] text-xs text-center tracking-[0] leading-[normal]">
              Map
            </span>
          </button>

          <button
            onClick={() => navigate("/attendee/profile")}
            className="flex flex-col w-[41px] items-center h-auto p-0 transition-opacity hover:opacity-80"
          >
            <img className="w-full h-[41px]" alt="Profile" src="https://c.animaapp.com/mh3vxzzxbLNePl/img/healthicons-ui-user-profile-outline.svg" />
            <span className="[font-family:'Poppins',Helvetica] font-light text-[#b4c1d9] text-[11px] text-center tracking-[0] leading-[normal]">
              Profile
            </span>
          </button>
        </div>
      </nav>

      {/* Modals & Toast (keep your functional code) */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#0d1b3a]/95 border-2 border-dashed border-[#00e0ff] rounded-2xl p-6 w-[304px] shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 ${mapNodes[stations.indexOf(selected)]?.bgColor} rounded-full flex items-center justify-center text-white font-semibold text-sm`}>
                {mapNodes[stations.indexOf(selected)]?.number}
              </div>
              <h2 className="[font-family:'Poppins',Helvetica] font-semibold text-white text-lg tracking-[0] leading-[normal]">
                {selected.name}
              </h2>
            </div>

            {selected.description && (
              <p className="[font-family:'Poppins',Helvetica] font-normal text-[#b4c1d9] text-sm text-center tracking-[0] leading-[1.5] mb-4">
                {selected.description}
              </p>
            )}

            <div className="flex items-center justify-center gap-2 mb-4">
              <svg className="w-5 h-5 text-[#b4c1d9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="[font-family:'Poppins',Helvetica] font-normal text-[#b4c1d9] text-sm tracking-[0] leading-[normal]">
                Day 1 — 11:00 AM
              </span>
            </div>

            <p className="text-sm text-[#b4c1d9] mb-4 text-center">
              Points: {selected.points || 0}
            </p>

         {!isParticipated(selected.id) ? (
  <button
    onClick={() => handleParticipate(selected)}
    className="w-full bg-[#e24d22] hover:bg-[#c43d1a] text-white [font-family:'Poppins',Helvetica] font-medium text-sm px-6 py-2 rounded-full transition-colors"
  >
    {selected.points === 0 ? "Mark as Participated" : "Mark as Participated"}
  </button>
) : selected.points === 0 ? (
  <div className="w-full bg-green-600 text-white text-center py-2 rounded-full [font-family:'Poppins',Helvetica] font-medium text-sm">
    Completed ✅
  </div>
) : (
  <button
    onClick={() => {
      setSelected(null);
      setSelectedForScan(selected);
    }}
    className="w-full bg-blue-600 hover:bg-blue-700 text-white [font-family:'Poppins',Helvetica] font-medium text-sm px-6 py-2 rounded-full transition-colors"
  >
    Scan QR
  </button>
)}

            <button
              onClick={() => setSelected(null)}
              className="block mx-auto mt-3 text-sm text-[#b4c1d9] hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {selectedForScan && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
          onClick={() => setSelectedForScan(null)}
        >
          <div
            className="rounded-lg p-4 shadow-2xl w-[90%] max-w-md animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <ScanQR stationId={selectedForScan.id} />
            <button
              onClick={() => setSelectedForScan(null)}
              className="mt-4 w-full text-sm text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {popup && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce z-50">
          {popup}
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-1rem); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; animation-delay: var(--animation-delay, 0ms); }
        .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
      `}</style>
    </main>
  );
}
