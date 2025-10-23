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
    return <p className="text-center p-10 text-lg">Loading users...</p>;

  return (
    <>
      <AdminNavbar />
      <div className="min-h-screen bg-gray-100 p-6 pt-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
            🛠 Manage Moderators
          </h1>

          {/* CREATE / EDIT MODERATOR CARD */}
          <div className="bg-white rounded-xl shadow p-6 mb-10">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
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
                className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {!editingUser && (
                <input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}

              <button
                type="submit"
                disabled={creating}
                className={`${
                  creating ? "bg-gray-400" : "bg-gray-800 hover:bg-gray-900"
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
                  className="bg-gray-400 hover:bg-gray-500 text-white p-3 rounded-lg transition"
                >
                  Cancel
                </button>
              )}
            </form>
          </div>

          {/* MODERATOR LIST CARD */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Moderators ({users.length})
            </h2>

            {users.length === 0 ? (
              <p className="text-center text-gray-400 py-4 italic">
                No moderators found.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg">
                <table className="min-w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="px-4 py-3">{u.name}</td>
                        <td className="px-4 py-3 text-gray-600">{u.email}</td>
                        <td className="px-4 py-3 font-semibold">{u.role}</td>
                        <td className="px-4 py-3 text-center space-x-2">
                          <button
                            onClick={() => handleEdit(u)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition"
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
      </div>
    </>
  );
}
