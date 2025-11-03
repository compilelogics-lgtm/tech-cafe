// scripts/hooks/useAutoLogout.js
import { useEffect } from "react";
import { useAuth } from "../../app/contexts/AuthContext";

export default function useAutoLogout(timeout = 30 * 60 * 1000) {
  const { logout } = useAuth();

  useEffect(() => {
    let timer;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout();
      }, timeout);
    };

    // user activity listeners
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keypress", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("scroll", resetTimer);

    resetTimer(); // start timer on load

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keypress", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, [logout, timeout]);
}
