import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { FiMenu, FiX } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import logo from "../../assets/navlogo.png";

export default function ModeratorNavbar() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { name: "Dashboard", path: "/moderator/dashboard" },
    // { name: "Generate QR", path: "/moderator/generate-qr" },
    { name: "Stations", path: "/moderator/stations" },
    { name: "Attendees", path: "/moderator/attendee-management" },
  ];

  const toggleMobileMenu = () => setMobileOpen(!mobileOpen);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/welcome", { replace: true });
  };

  return (
    <nav className="bg-[#14141B] text-white shadow-md font-[Poppins] border-b border-[#224E61]">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Tech Café Logo"
              className="w-12 h-12 object-contain"
            />
            <span className="text-m font-semibold text-white">
              Tech Café Moderator
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm transition ${
                    isActive
                      ? "text-[#00E0FF] font-medium underline underline-offset-4"
                      : "text-white/90 hover:text-[#00E0FF]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Desktop Logout */}
          <div className="hidden md:flex items-center gap-5">
            <button
              onClick={handleLogout}
              className="ml-3 px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded transition"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={toggleMobileMenu} className="focus:outline-none">
              {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#1E1E28] border-t border-[#224E61] px-4 pt-4 pb-5 space-y-3">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded text-sm transition ${
                  isActive
                    ? "bg-[#00E0FF]/20 text-[#00E0FF] font-medium"
                    : "text-white/90 hover:bg-[#00E0FF]/10"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#224E61] mt-2">
            <div className="flex items-center gap-2">
              <FaUserCircle size={22} className="text-white/70" />
              <span className="text-sm text-white/80 truncate">
                {user?.email || "Moderator"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
