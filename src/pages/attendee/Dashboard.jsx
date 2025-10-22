import React from "react";
import { useAuth } from "../../contexts/AuthContext";

export const Dashboard = () => {
  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow rounded-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Attendee Dashboard</h1>
      <p className="text-gray-600">
        Welcome to your dashboard. You can view your points and past scans here.
      </p>
      {/* You can add state and logic here later to display user-specific data */}
      <button
        onClick={handleLogout}
        className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition duration-200"
      >
        Logout
      </button>
    </div>
  );
};