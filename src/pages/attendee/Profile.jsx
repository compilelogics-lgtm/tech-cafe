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
import { useAuth } from "../../contexts/AuthContext";
import React from "react";
import { Link } from "react-router-dom";

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
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
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

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-600">Loading profile...</div>
    );
  }

  const completedStations = scans.length;
  const totalStations = stations.length;
  const progress =
    totalStations > 0 ? (completedStations / totalStations) * 100 : 0;

  const navigationItems = [
    {
      icon: "https://c.animaapp.com/mh3hl0ofl3qLzT/img/iconoir-leaderboard-star.svg",
      label: "Leaderboard",
      path: "/attendee/leaderboard",
    },
    {
      icon: "https://c.animaapp.com/mh3hl0ofl3qLzT/img/et-map.svg",
      label: "Map",
      path: "/attendee/journey",
    },
    {
      icon: "https://c.animaapp.com/mh3hl0ofl3qLzT/img/healthicons-ui-user-profile-outline.svg",
      label: "Profile",
      path: "/attendee/profile",
    },
  ];

  return (
    <main className="overflow-hidden bg-[linear-gradient(180deg,rgba(10,15,37,1)_0%,rgba(16,32,66,1)_100%)] w-full min-h-screen relative flex justify-center items-start">
      {/* Background Image */}
      <img
        className="absolute w-[98.08%] h-full top-0 left-0 object-cover"
        alt="Background grid pattern"
        src="https://c.animaapp.com/mh3hl0ofl3qLzT/img/group.png"
      />

      <div className="relative z-10 w-full max-w-[390px] pt-[119px] pb-[100px] px-7">
        <h1 className="text-center font-semibold text-[22px] [font-family:'Poppins',Helvetica] text-white tracking-[0] leading-[normal] mb-[50px] opacity-0 translate-y-[-1rem] animate-fade-in">
          MY PROFILE
        </h1>

        {/* Profile Info Card */}
        <Card className="w-full h-[120px] bg-[#0f1930] rounded-2xl overflow-hidden border-none shadow-[0px_4px_12px_#00000040] relative mb-4 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:200ms] before:content-[''] before:absolute before:inset-0 before:p-0.5 before:rounded-2xl before:[background:linear-gradient(90deg,rgba(126,75,254,0.42)_7%,rgba(0,108,255,0.42)_47%,rgba(0,177,255,0.42)_100%)] before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:z-[1] before:pointer-events-none">
          <CardContent className="p-5 h-full flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="[font-family:'Poppins',Helvetica] font-bold text-white text-base">
                {profile?.name || "Unnamed User"}
              </h2>
              <p className="[font-family:'Poppins',Helvetica] font-medium text-[#b4c1d9] text-xs">
                #{profile?.userId || user.uid}
              </p>
              <p className="[font-family:'Poppins',Helvetica] font-bold text-[#8abde6] text-sm">
                Total: {profile?.totalPoints ?? 0} pts
              </p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <img
                  className="w-12 h-12"
                  alt="QR Code"
                  src={
                    profile?.qrCode ||
                    "https://c.animaapp.com/mh3hl0ofl3qLzT/img/la-qrcode.svg"
                  }
                />
              </div>
              <span className="[font-family:'Poppins',Helvetica] text-[#b4c1d9] text-xs">
                My QR Code
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Progress Section */}
        <section className="mb-6 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:400ms]">
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
        </section>

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
      </div>

      <nav className="absolute bottom-0 left-0 w-full h-[85px] bg-[#0f1930de]">
        <div className="flex items-center justify-center gap-[73px] h-full px-7 md:px-8">
          {navigationItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                className="flex flex-col items-center gap-0.5 transition-opacity hover:opacity-80"
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <img
                  className={`${
                    item.label === "Profile"
                      ? "w-[55px] h-[55px]"
                      : item.label === "Map"
                      ? "w-[41px] h-8"
                      : "w-[41px] h-[41px]"
                  }`}
                  alt={item.label}
                  src={item.icon}
                />
                <span
                  className={`[font-family:'Poppins',Helvetica] text-xs text-center tracking-[0] leading-[normal] ${
                    isActive
                      ? "font-medium text-[#00e0ffc4]"
                      : "font-light text-[#b4c1d9] text-[11px]"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
