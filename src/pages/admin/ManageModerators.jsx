import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../../utils/firebase";
import { toast } from "react-hot-toast";
import AdminNavbar from "../../components/ui/AdminNavbar";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Fetch all users except admins
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const allUsers = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.role !== "admin"); // exclude admin
      setUsers(allUsers);
    } catch (err) {
      console.error("❌ Failed to fetch users:", err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Toggle role between attendee and moderator
const handleToggleRole = async (user) => {
  const newRole = user.role === "attendee" ? "moderator" : "attendee";
  if (!window.confirm(`Change role of ${user.name} to "${newRole}"?`)) return;

  setUpdatingId(user.id);
  try {
    // Only update Firestore role
    const userRef = doc(db, "users", user.id);
    await updateDoc(userRef, { role: newRole });

    toast.success(`Role updated to "${newRole}"`);
    await fetchUsers();
  } catch (error) {
    console.error("❌ Error toggling role:", error);
    toast.error("Failed to update role");
  } finally {
    setUpdatingId(null);
  }
};


  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading users...
      </div>
    );

  return (
    <>
      <AdminNavbar />
      <main className="min-h-screen w-full p-6 pt-20 flex flex-col gap-6 bg-[#0D1B3A]">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-white text-[28px] sm:text-[32px] font-semibold leading-[42px]">
              Manage Users
            </h1>
            <p className="text-white/70 text-[16px] sm:text-[18px] leading-[24px]">
              Toggle user roles between attendee and moderator
            </p>
          </div>

          {/* Users Table */}
          <div className="rounded-xl p-6 bg-[#1E1E28] border border-[#224E61]">
            <h2 className="text-white text-2xl font-medium mb-4">
              Users ({users.length})
            </h2>

            {users.length === 0 ? (
              <p className="text-center text-white/50 py-6 italic">
                No users found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-white/80 border-collapse">
                  <thead className="border-b border-[#224E61] text-[#00E0FF]/70 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-t border-[#224E61]/40 hover:bg-[#224E61]/10 transition"
                      >
                        <td className="px-4 py-3">{u.name}</td>
                        <td className="px-4 py-3 text-white/60">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className="text-[#00E0FF] font-semibold bg-[#224E61]/40 px-2 py-[2px] rounded-md text-sm">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleRole(u)}
                            disabled={updatingId === u.id}
                            className={`px-3 py-1.5 rounded-md text-sm text-white ${
                              u.role === "moderator"
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-gray-500 hover:bg-gray-600"
                            } transition`}
                          >
                            {updatingId === u.id ? "Updating..." : u.role === "moderator" ? "Moderator" : "Attendee"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
