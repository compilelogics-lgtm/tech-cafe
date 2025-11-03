import { useEffect, useRef } from "react";
import { useAuth } from "../../src/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function useSessionTimer(durationMs = 60 * 60 * 1000) {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
      localStorage.removeItem("sessionExpiry");
      return;
    }

    let expiry = parseInt(localStorage.getItem("sessionExpiry") || "0", 10);
    if (!expiry || Date.now() > expiry) {
      expiry = Date.now() + durationMs;
      localStorage.setItem("sessionExpiry", expiry.toString());
    }

    const checkExpiry = () => {
      const exp = parseInt(localStorage.getItem("sessionExpiry") || "0", 10);
      if (exp && Date.now() > exp) {
        console.log("⏰ Session expired, logging out...");
        clearTimeout(timeoutRef.current);
        clearInterval(intervalRef.current);
        localStorage.removeItem("sessionExpiry");
        logout();
        navigate("/login", { replace: true }); // 🔥 immediate route switch
      }
    };

    const timeLeft = expiry - Date.now();
    timeoutRef.current = setTimeout(checkExpiry, timeLeft);
    intervalRef.current = setInterval(checkExpiry, 2000);
    checkExpiry();

    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
    };
  }, [user, logout, loading, durationMs, navigate]);

  // console.log("user", user, "loading", loading);
}
