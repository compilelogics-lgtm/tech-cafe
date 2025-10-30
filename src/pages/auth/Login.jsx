import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../utils/firebase";
import { useNavigate } from "react-router-dom";
import novartislogotransparent2 from "./../../assets/novartis-logo-transparent-2-1.png";
import novartislogotransparent1 from "./../../assets/novartis-logo-transparent-2.png";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../utils/firebase";
import group from "./../../assets/group.png";

/* Utility for class merging (figma used cn()) */
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  
const handleLogin = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);

    if (!user.emailVerified) {
      setError("Please verify your email before logging in.");
      setLoading(false);
      return;
    }

    // Fetch user role from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const role = userDoc.data()?.role?.toLowerCase();

    const roleRoutes = {
      admin: "/admin/dashboard",
      moderator: "/moderator/dashboard",
      attendee: "/attendee/journey",
    };

    navigate(roleRoutes[role] || "/welcome", { replace: true });
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
  return (
    <main
      className="bg-[linear-gradient(180deg,rgba(10,15,37,1)_0%,rgba(16,32,66,1)_100%)] w-full min-w-[390px] min-h-[844px] flex flex-col items-center relative overflow-hidden"
    >
      <img
        className="absolute w-full h-full top-0 left-0 object-cover"
        alt="Background pattern"
        src={group}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-[390px] px-[58px] pt-[119px]">
        <header className="flex flex-col items-center gap-2 mb-[71px]">
          <h1 className="font-semibold text-white text-[22px] text-center">
            ACCESS YOUR PASS!
          </h1>
          <p className="font-normal text-[#b4c1d9] text-xs text-center">
            Sign in to continue your Tech Café journey.
          </p>
        </header>

        <form onSubmit={handleLogin} className="flex flex-col w-full gap-[19px] mb-[33px]">
          <div className="flex flex-col items-start gap-1.5 w-full">
            <label
              htmlFor="email"
              className="font-medium text-[#e0e0e0] text-[13px]"
            >
              Email:
            </label>
            <div className="relative w-full">
              <input
                id="email"
                type="email"
                placeholder="e.g., sara@novartis.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-[#dee5f12e] rounded-lg border-none text-[#b4c1d9] text-sm px-[17px] placeholder:text-[#b4c1d9]/70"
                required
              />
            </div>
          </div>

          <div className="flex flex-col items-start gap-1.5 w-full">
            <label
              htmlFor="password"
              className="font-medium text-[#e0e0e0] text-[13px]"
            >
              Password:
            </label>
            <div className="relative w-full">
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-[#dee5f12e] rounded-lg border-none text-[#b4c1d9] text-sm px-[17px] placeholder:text-[#b4c1d9]/70"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex items-center gap-[11px] w-full mt-[6px]">
            <input
              id="remember"
              type="checkbox"
              className="w-5 h-5 accent-blue-500"
            />
            <label
              htmlFor="remember"
              className="text-[#b4c1d9] text-xs cursor-pointer"
            >
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full h-[45px] rounded-lg border-none font-semibold text-white text-base transition-opacity",
              "bg-[linear-gradient(90deg,rgba(126,75,254,0.73)_7%,rgba(0,108,255,0.73)_47%,rgba(0,177,255,0.73)_100%)]",
              "hover:opacity-90",
              loading && "opacity-70 cursor-not-allowed"
            )}
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>
        </form>

        <p className="text-[#b4c1d9] text-xs text-center">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-medium underline hover:text-white transition-colors"
          >
            Register
          </button>
        </p>
      </div>

      <footer className="absolute bottom-[46px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
        <img
          className="w-[178px] h-[157px]"
          alt="Novartis logo"
          src={novartislogotransparent1}
        />
        <img
          className="w-[107px] h-[25px]"
          alt="Novartis wordmark"
          src={novartislogotransparent2}
        />
      </footer>
    </main>
  );
}
