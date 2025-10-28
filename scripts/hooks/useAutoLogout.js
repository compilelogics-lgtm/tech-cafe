import { useEffect, useRef } from "react";
import { useAuth } from "../../src/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function useAutoLogout(timeout = 60 * 1000) { // 1 minute
  const { logout, user } = useAuth();
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (user) {
        console.log("⏰ Auto logout triggered after inactivity");
        await logout();
        navigate("/login", { replace: true }); // ✅ redirect to login after logout
      }
    }, timeout);
  };

  useEffect(() => {
    if (!user) return; // only track logged-in users

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // start timer immediately on mount

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [user, timeout]);
}
