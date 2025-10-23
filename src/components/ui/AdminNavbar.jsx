import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { FiMenu, FiX } from "react-icons/fi";

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
  ];

  const toggleMobileMenu = () => setMobileOpen(!mobileOpen);
  const handleLogout = () => {
    logout(); // clear auth state
    setMobileOpen(false); // close mobile menu if open
    navigate("/welcome", { replace: true }); // redirect to welcome page
  };
  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Brand */}
          <div className="flex-shrink-0 font-bold text-xl">
            Novartis
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-6">
            {links.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`hover:text-gray-300 ${
                  location.pathname === link.path ? "underline font-semibold" : ""
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
            <button onClick={toggleMobileMenu} className="focus:outline-none">
              {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-700 px-2 pt-2 pb-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded hover:bg-gray-600 ${
                location.pathname === link.path ? "bg-gray-600 font-semibold" : ""
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
