import { useState } from "react";
import { Link, useLocation ,useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { FiMenu, FiX } from "react-icons/fi";

export default function ModeratorNavbar() {
  const { logout } = useAuth();
  const location = useLocation();
   const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { name: "Dashboard", path: "/moderator/dashboard" },
    { name: "Generate QR", path: "/moderator/generate-qr" },
    { name: "Stations", path: "/moderator/stations" },
    { name: "Attendees", path: "/moderator/attendee-management" },
  ];

  const toggleMobileMenu = () => setMobileOpen(!mobileOpen);
  const handleLogout = () => {
    logout(); // clear auth state
    setMobileOpen(false); // close mobile menu if open
    navigate("/welcome", { replace: true }); // redirect to welcome page
  };
  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 font-bold text-xl hover:text-cyan-400 transition">
            Moderator Panel
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-6">
            {links.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`hover:text-cyan-400 transition ${
                  location.pathname === link.path ? "underline font-semibold text-cyan-400" : ""
                }`}
              >
                {link.name}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="ml-4 bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={toggleMobileMenu} className="focus:outline-none text-white text-2xl">
              {mobileOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-800 px-2 pt-2 pb-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded hover:bg-gray-700 transition ${
                location.pathname === link.path ? "bg-gray-700 font-semibold text-cyan-400" : ""
              }`}
            >
              {link.name}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left bg-red-600 hover:bg-red-700 px-3 py-2 rounded transition"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
