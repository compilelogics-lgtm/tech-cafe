import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import React from "react";
import { Link } from "react-router-dom";
import profile1 from "../../assets/profile.png";
import leaderboard from "../../assets/leaderboard-2.png";
import map from "../../assets/journey-2.png";
import bg from "../../assets/image.png";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateDoc } from "firebase/firestore";
import { storage } from "../../utils/firebase";
import { useRef } from "react";
import bgMobile from "../../assets/image.png";
import bgDesktop from "../../assets/desktopbg.png";
// import map from "../../assets/journey-2.png";
import profile from "../../assets/profile.png";



// ---------------------- Embedded UI Components ----------------------
const cn = (...classes) => classes.filter(Boolean).join(" ");
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";

const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
      className
    )}
    {...props}
  >
    <div
      className="h-full w-full flex-1 transition-all"
      style={{
        background:
          "linear-gradient(90deg,rgba(126,75,254,1)_7%,rgba(0,108,255,1)_47%,rgba(0,177,255,1)_100%)",
        transform: `translateX(-${100 - (value || 0)}%)`,
      }}
    />
  </div>
));
Progress.displayName = "Progress";
// -------------------------------------------------------------------

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [scans, setScans] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();
const [showQR, setShowQR] = useState(false);
 const fileInputRef = useRef(null);   // <---- Add this

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    const storageRef = ref(storage, `profileImages/${user.uid}.jpg`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    await updateDoc(doc(db, "users", user.uid), { photoURL: downloadURL });
    setProfile((prev) => ({ ...prev, photoURL: downloadURL }));
  };
  const handleLogout = () => {
    logout();
    navigate("/welcome", { replace: true });
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setProfile(userSnap.data());

        const stationsSnap = await getDocs(collection(db, "stations"));
        const stationsList = stationsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

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

  if (loading)
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center text-white text-lg font-medium">

      {/* Mobile BG */}
      <img
        src={bgMobile}
        alt="Mobile Background"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none md:hidden"
      />

      {/* Desktop BG */}
      <img
        src={bgDesktop}
        alt="Desktop Background"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none hidden md:block"
      />

      {/* Overlay gradients (same as main layout if needed) */}
      <div className="absolute inset-0 bg-[linear-gradient(72deg,rgba(34,78,97,0.24)_0%,rgba(27,55,82,0.85)_50%,rgba(20,33,67,1)_100%),linear-gradient(104deg,rgba(34,78,97,0.64)_0%,rgba(13,27,58,1)_100%),linear-gradient(98deg,rgba(34,78,97,1)_0%,rgba(24,53,78,1)_47%,rgba(13,27,58,1)_100%)]" />

      {/* Loading text */}
      <div className="relative z-10 animate-pulse">
        Loading Profile...
      </div>
    </div>
  );


  const completedStations = scans.length;
  const totalStations = stations.length;
  const progress =
    totalStations > 0 ? (completedStations / totalStations) * 100 : 0;

  return (
    <main className="overflow-hidden bg-[linear-gradient(72deg,rgba(34,78,97,0.24)_0%,rgba(27,55,82,0.85)_50%,rgba(20,33,67,1)_100%),linear-gradient(104deg,rgba(34,78,97,0.64)_0%,rgba(13,27,58,1)_100%),linear-gradient(98deg,rgba(34,78,97,1)_0%,rgba(24,53,78,1)_47%,rgba(13,27,58,1)_100%)] bg-cover bg-center bg-no-repeat w-full min-h-screen relative flex justify-center items-start">
  {/* Mobile BG */}
  <img
    src={bgMobile}
    alt="Mobile BG"
    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none md:hidden"
  />

  {/* Desktop BG */}
  <img
    src={bgDesktop}
    alt="Desktop BG"
    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none hidden md:block"
  />

      <div className="relative z-10 w-full max-w-[390px] pt-[119px] pb-[100px] px-7">
        <h1 className="text-center font-semibold text-[22px] [font-family:'Poppins',Helvetica] text-white tracking-[0] leading-[normal] mb-[20px] opacity-0 translate-y-[-1rem] animate-fade-in">
          MY PROFILE
        </h1>

        {/* Profile Photo (Centered Below Title, Above Card) */}
        <div className="flex flex-col items-center gap-3 mb-4 animate-fade-in">
          <div
            className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#00b1ff] shadow-lg bg-[#0f1930] cursor-pointer hover:scale-[1.03] transition-transform"
            onClick={() => fileInputRef.current.click()}
          >
            <img
              src={profile?.photoURL || profile1}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          <p className="text-[13px] text-[#8abde6] font-medium [font-family:'Poppins',Helvetica] tracking-wide">
            Tap to upload or change photo
          </p>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>


        {/* Profile Info Card */}
        <Card className="w-full h-[120px] bg-[#0f1930] rounded-2xl overflow-hidden border-none shadow-[0px_4px_12px_#00000040] relative mb-4 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:250ms] before:content-[''] before:absolute before:inset-0 before:p-0.5 before:rounded-2xl before:[background:linear-gradient(90deg,rgba(126,75,254,0.42)_7%,rgba(0,108,255,0.42)_47%,rgba(0,177,255,0.42)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none">
          <CardContent className="p-5 h-full flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="[font-family:'Poppins',Helvetica] font-bold text-white text-base">
                {profile?.name || "Unnamed User"}
              </h2>
              <p className="[font-family:'Poppins',Helvetica] font-bold text-[#8abde6] text-sm">
                Total: {profile?.totalPoints ?? 0} pts
              </p>
            </div>

           <div className="flex flex-col items-center gap-1.5">
  <div
    className="w-24 h-24 bg-white rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 transition-transform"
    onClick={() => setShowQR(true)}
  >
    <img
      className="w-24 h-24 object-contain"
      alt="QR Code"
      src={
        profile?.qrCodeURL ||
        "https://c.animaapp.com/mh3hl0ofl3qLzT/img/la-qrcode.svg"
      }
    />
  </div>
</div>

          </CardContent>
        </Card>

        {/* Progress Section */}
        {/* <section className="mb-6 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:400ms]">
          <h3 className="[font-family:'Poppins',Helvetica] font-medium text-white text-sm mb-4">
            Participation Progress
          </h3>
          <div className="w-full mb-2">
            <Progress
              value={progress}
              className="h-2.5 bg-[#e9e9e9] [&>div]:bg-[linear-gradient(90deg,rgba(126,75,254,1)_7%,rgba(0,108,255,1)_47%,rgba(0,177,255,1)_100%)]"
            />
          </div>
          <p className="[font-family:'Poppins',Helvetica] text-[#b4c1d9] text-xs">
            {completedStations} / {totalStations} Activities Completed
          </p>
        </section> */}

        {/* Activities List */}
        <section className="flex flex-col gap-3 w-full mb-8">
          {scans.map((scan, index) => {
            const station = stations.find((s) => s.id === scan.stationId);
            return (
              <Card
                key={scan.id}
                className="w-full h-20 bg-[#0f1930] rounded-xl overflow-hidden border-none shadow-[0px_2px_6px_#00000040] relative before:content-[''] before:absolute before:inset-0 before:p-[1.5px] before:rounded-xl before:[background:linear-gradient(90deg,rgba(126,75,254,0.42)_7%,rgba(0,108,255,0.42)_47%,rgba(0,177,255,0.42)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none opacity-0 translate-y-[-1rem] animate-fade-in transition-transform hover:scale-[1.02]"
                style={{ "--animation-delay": `${600 + index * 100}ms` }}
              >
                <CardContent className="p-0 h-full flex items-center justify-center">
                  <div className="flex items-center gap-[19px]">
                    <div className="flex items-center justify-center w-9 h-9 bg-[#00e0ffad] rounded-[18px]">
                      <span className="[font-family:'Poppins',Helvetica] text-black text-xl">
                        🏁
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 w-44">
                      <h4 className="[font-family:'Poppins',Helvetica] font-semibold text-white text-[13px]">
                        {station?.name || "Unknown Station"}
                      </h4>
                      <p className="[font-family:'Poppins',Helvetica] text-[#b4c1d9] text-xs">
                        +{scan.pointsEarned} pts
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* Logout Button */}
        <div className="w-full flex justify-center mt-6 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:700ms]">
          <button
            onClick={handleLogout}
            className="w-full sm:w-[85%] md:w-[75%] py-3 bg-gradient-to-r from-[#7e4ffe] via-[#006cff] to-[#00b1ff] rounded-2xl text-white font-semibold text-sm sm:text-base tracking-wide hover:opacity-90 transition-all shadow-[0px_4px_12px_rgba(0,0,0,0.4)] active:scale-[0.97]"
          >
            Logout
          </button>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 w-full h-[85px] bg-[#0f1930de] z-10">
        <div className="flex items-center justify-center gap-[73px] h-full px-7 md:px-8">
          <button
            onClick={() => navigate("/attendee/leaderboard")}
            className="flex flex-col w-[71px] items-center p-0 transition-opacity hover:opacity-80"
          >
            <img
              className="w-full"
              alt="Leaderboard"
              src={leaderboard}
            />
          </button>

          <button
            onClick={() => navigate("/attendee/journey")}
            className="flex flex-col w-[70px] items-center p-0"
          >
            <img
              className="w-full"
              alt="Map"
              src={map}
            />
          </button>

          <button
            onClick={() => navigate("/attendee/profile")}
            className="flex flex-col w-[41px] items-center p-0 transition-opacity hover:opacity-80"
          >
            <img
              className="w-full"
              alt="Profile"
              src={profile1}
            />
          </button>
        </div>
      </nav>
      {showQR && (
  <div
    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
    onClick={() => setShowQR(false)}
  >
    <div
      className="bg-white p-6 rounded-2xl shadow-xl relative"
      onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside
    >
      <img
        src={
          profile?.qrCodeURL ||
          "https://c.animaapp.com/mh3hl0ofl3qLzT/img/la-qrcode.svg"
        }
        alt="QR Code Large"
        className="w-72 h-72 object-contain"
      />
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
        onClick={() => setShowQR(false)}
      >
        ✕
      </button>
    </div>
  </div>
)}

    </main>
  );
}
