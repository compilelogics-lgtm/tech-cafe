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

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  // ------------------------------------------------------------------
  // 🔹 Fetch existing moderators
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // 🔹 Handle create moderator
  // ------------------------------------------------------------------
  const handleCreateModerator = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
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

  // ------------------------------------------------------------------
  // 🔹 Handle edit moderator
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // 🔹 Handle delete moderator
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // 🔹 Render
  // ------------------------------------------------------------------
  if (loading)
    return <p className="text-center mt-10 text-lg">Loading users...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Moderators</h1>

      {/* ───────────────────────────── CREATE / EDIT MODERATOR ───────────────────────────── */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
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
            className="border p-3 rounded-lg"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border p-3 rounded-lg"
          />
          {!editingUser && (
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="border p-3 rounded-lg"
            />
          )}

          <button
            type="submit"
            disabled={creating}
            className={`${
              creating ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            } text-white p-3 rounded-lg transition`}
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
              className="bg-gray-400 hover:bg-gray-500 text-white p-3 rounded-lg"
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* ───────────────────────────── MODERATOR LIST ───────────────────────────── */}
      <div className="p-6 rounded-xl shadow-md bg-white">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Moderators ({users.length})
        </h2>

        {users.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No moderators found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 text-left text-gray-800">
                  <th className="p-3 border">Name</th>
                  <th className="p-3 border">Email</th>
                  <th className="p-3 border">Role</th>
                  <th className="p-3 border text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="text-gray-800 hover:bg-gray-50">
                    <td className="p-3 border">{u.name}</td>
                    <td className="p-3 border">{u.email}</td>
                    <td className="p-3 border font-semibold">{u.role}</td>
                    <td className="p-3 border text-center space-x-2">
                      <button
                        onClick={() => handleEdit(u)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      >
                        Delete
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
  );
}
