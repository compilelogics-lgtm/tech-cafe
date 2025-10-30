import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../../utils/firebase";
import { toast } from "react-hot-toast";
import AdminNavbar from "../../components/ui/AdminNavbar";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const fetchModerators = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("role", "==", "moderator"));
      const snap = await getDocs(q);
      const moderators = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(moderators);
    } catch (err) {
      console.error("❌ Failed to fetch moderators:", err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerators();
  }, []);

  const handleCreateModerator = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        emailVerified: true,
      };

      if (!payload.name || !payload.email || !payload.password) {
        toast.error("All fields are required");
        setCreating(false);
        return;
      }

      const createModeratorFn = httpsCallable(functions, "createModerator");
      const res = await createModeratorFn(payload);
      toast.success(res.data?.message || "Moderator created successfully");

      setForm({ name: "", email: "", password: "" });
      await fetchModerators();
    } catch (error) {
      console.error("🔥 Error creating moderator:", error);
      toast.error(error.message || "Failed to create moderator");
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: "" });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const userRef = doc(db, "users", editingUser.id);
      await updateDoc(userRef, {
        name: form.name,
        email: form.email,
      });
      toast.success("Moderator updated successfully");
      setEditingUser(null);
      setForm({ name: "", email: "", password: "" });
      await fetchModerators();
    } catch (error) {
      console.error("❌ Error updating moderator:", error);
      toast.error("Failed to update moderator");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this moderator?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      toast.success("Moderator deleted successfully");
      await fetchModerators();
    } catch (error) {
      console.error("❌ Error deleting moderator:", error);
      toast.error("Failed to delete moderator");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{
          background: `
      linear-gradient(248.32deg, rgba(34, 78, 97, 0.24) 1.53%, rgba(27, 55, 82, 0.85) 48.49%, #0D1B3A 95.44%),
      linear-gradient(115.02deg, rgba(34, 78, 97, 0.64) 20.88%, #0D1B3A 100%)
    `,
        }}>
        Loading users...
      </div>
    );
return (
  <>
    <AdminNavbar />

    <main
      className="min-h-screen w-full p-6 pt-20 flex flex-col gap-6"
      style={{
        background: `
        linear-gradient(248.32deg, rgba(34, 78, 97, 0.24) 1.53%, rgba(27, 55, 82, 0.85) 48.49%, #0D1B3A 95.44%),
        linear-gradient(115.02deg, rgba(34, 78, 97, 0.64) 20.88%, #0D1B3A 100%)
      `,
      }}
    >
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-6">
       {/* Header */}
<div className="flex flex-col gap-1">
  <h1 className="text-white text-[28px] sm:text-[32px] font-semibold leading-[42px]">
    Manage Moderators
  </h1>
  <p className="text-white/70 text-[16px] sm:text-[18px] leading-[24px]">
    Add, edit, or remove moderators from the system
  </p>
</div>


        {/* CREATE / EDIT MODERATOR */}
        <div
          className="rounded-xl p-6 flex flex-col gap-4"
          style={{
            background: "rgba(30,30,40,1)",
            border: "1px solid rgba(34,78,97,1)",
          }}
        >
          <h2 className="text-white text-2xl font-medium mb-2">
            {editingUser ? "Edit Moderator" : "Create Moderator"}
          </h2>

          <form
            onSubmit={editingUser ? handleUpdate : handleCreateModerator}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-[#1E1E28] border border-[#224E61] text-white placeholder-gray-400 px-4 py-3 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00E0FF]"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-[#1E1E28] border border-[#224E61] text-white placeholder-gray-400 px-4 py-3 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00E0FF]"
            />
            {!editingUser && (
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="bg-[#1E1E28] border border-[#224E61] text-white placeholder-gray-400 px-4 py-3 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00E0FF]"
              />
            )}

            <button
              type="submit"
              disabled={creating}
              className={`${
                creating ? "bg-[#224E61]/60" : "bg-[#00E0FF] hover:bg-[#00C8E6]"
              } text-white font-semibold py-3 rounded-md transition duration-200`}
            >
              {editingUser
                ? "Update Moderator"
                : creating
                ? "Creating..."
                : "Create Moderator"}
            </button>

            {editingUser && (
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setForm({ name: "", email: "", password: "" });
                }}
                className="bg-[#1E1E28] border border-[#224E61] text-white py-3 rounded-md hover:bg-[#224E61]/40 transition duration-200"
              >
                Cancel
              </button>
            )}
          </form>
        </div>

       {/* MODERATOR LIST */}
<div
  className="rounded-xl p-6"
  style={{
    background: "rgba(30,30,40,1)",
    border: "1px solid rgba(34,78,97,1)",
  }}
>
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-white text-2xl font-medium">
      Moderators ({users.length})
    </h2>
  </div>

  {users.length === 0 ? (
    <p className="text-center text-white/50 py-6 italic">
      No moderators found.
    </p>
  ) : (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
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
                <td className="px-4 py-3 text-center space-x-2">
                  <button
                    onClick={() => handleEdit(u)}
                    className="bg-[#00E0FF] hover:bg-[#00C8E6] text-white px-3 py-1.5 rounded-md text-sm transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden flex flex-col gap-4">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-[#1E1E28] border border-[#224E61]/50 rounded-lg p-4 flex flex-col gap-2 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-white font-semibold text-base">{u.name}</h3>
              <span className="text-[#00E0FF] text-xs bg-[#224E61]/40 px-2 py-[2px] rounded-md">
                {u.role}
              </span>
            </div>
            <p className="text-white/60 text-sm break-all">{u.email}</p>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => handleEdit(u)}
                className="bg-[#00E0FF] hover:bg-[#00C8E6] text-white px-3 py-1.5 rounded-md text-xs transition"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(u.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )}
</div>

      </div>
    </main>
  </>
);

}
