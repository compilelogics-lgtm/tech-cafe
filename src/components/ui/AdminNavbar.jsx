import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { FiMenu, FiX, FiSearch } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import logo from "../../assets/novartis-logo-transparent-1.png";

export default function AdminNavbar() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Manage Moderators", path: "/admin/manage-users" },
    { name: "Manage Attendees", path: "/admin/manage-attendees" },
    { name: "Manage Stations", path: "/admin/manage-stations" },
    { name: "Reports", path: "/admin/reports" },
    { name: "Points & Rewards", path: "/admin/points" },
    { name: "Notifications", path: "/admin/notification" },
    // { name: "Settings", path: "/admin/settings" },
  ];

  const toggleMobileMenu = () => setMobileOpen(!mobileOpen);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/welcome", { replace: true });
  };

  return (
    <nav className="bg-[#14141B] text-white shadow-md font-[Poppins] border-b border-[#224E61]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left - Brand */}
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Novartis Logo"
              className="w-12 h-12 object-contain"
            />
          </div>

          {/* Center - Nav Links */}
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

          {/* Right - Icons */}
          <div className="hidden md:flex items-center gap-5">
            <FiSearch size={20} className="text-white/80 hover:text-[#00E0FF]" />
            <FaUserCircle size={26} className="text-white/80 hover:text-[#00E0FF]" />
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
        <div className="md:hidden bg-[#1E1E28] border-t border-[#224E61] px-3 pt-3 pb-4 space-y-2">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded text-sm ${
                  isActive
                    ? "bg-[#00E0FF]/20 text-[#00E0FF] font-medium"
                    : "text-white/90 hover:bg-[#00E0FF]/10"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="flex items-center gap-3 pt-2">
            <FaUserCircle size={22} className="text-white/70" />
            <span className="text-sm text-white/80 flex-1 truncate">
              {user?.email || "Admin"}
            </span>
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
