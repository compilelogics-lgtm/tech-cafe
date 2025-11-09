import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  getDocs,
} from "firebase/firestore";
import { db, functions} from "../../utils/firebase";
import AdminNavbar from "../../components/ui/AdminNavbar";
import { httpsCallable } from "firebase/functions";
export default function ManageAttendees() {
  const [attendees, setAttendees] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");
  const [scanData, setScanData] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", department: "" });

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("totalPoints", "desc"));
    const unsub = onSnapshot(q, async (snap) => {
      const all = snap.docs
        .map((d, i) => ({ id: d.id, rank: i + 1, ...d.data() }))
        .filter((u) => u.role === "attendee");

      setAttendees(all);
      const data = {};
      for (const att of all) {
        const scansSnap = await getDocs(
          query(collection(db, "scans"), where("userId", "==", att.id))
        );
        data[att.id] = scansSnap.docs.map((s) => s.data());
      }
      setScanData(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

const handleDelete = async (attendee) => {
  if (!attendee.id) return alert("No user ID found.");

  console.log("Deleting UID:", attendee.id); // <-- log for verification

  if (!window.confirm(`Delete ${attendee.name}?`)) return;

  try {
    const deleteUserFn = httpsCallable(functions, "adminDeleteUser");
    const result = await deleteUserFn({ uid: attendee.id });
    console.log("Delete result:", result);

    alert(`${attendee.name} was deleted successfully.`);
    // Remove locally so UI updates immediately
    setAttendees(prev => prev.filter(a => a.id !== attendee.id));
  } catch (err) {
    console.error("Error deleting user:", err);
    alert(`Failed to delete user: ${err.message}`);
  }
};

  const handleResetPoints = async (attendee) => {
    if (window.confirm(`Reset all points for ${attendee.name}?`)) {
      await updateDoc(doc(db, "users", attendee.id), { totalPoints: 0 });
      alert(`${attendee.name}'s points reset.`);
    }
  };

  const openEdit = (a) => {
    setEditing(a);
    setEditForm({
      name: a.name || "",
      email: a.email || "",
      department: a.department || "",
    });
  };

  const saveEdit = async () => {
    if (!editForm.name || !editForm.email) {
      alert("Name and email are required.");
      return;
    }
    const ref = doc(db, "users", editing.id);
    await updateDoc(ref, {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      department: editForm.department.trim(),
    });
    alert(`${editForm.name}'s details updated.`);
    setEditing(null);
  };

  const filtered = attendees.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.rank.toString().includes(search)
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{
          background: `
      linear-gradient(248.32deg, rgba(34, 78, 97, 0.24) 1.53%, rgba(27, 55, 82, 0.85) 48.49%, #0D1B3A 95.44%),
      linear-gradient(115.02deg, rgba(34, 78, 97, 0.64) 20.88%, #0D1B3A 100%)
    `,
        }}>
        Loading attendees...
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
        {/* Header (left aligned like dashboard) */}
        <div className="flex flex-col gap-1">
           <h1 className="text-white text-[28px] sm:text-[32px] font-semibold leading-[42px]">
    Manage Attendees
  </h1>
  <p className="text-white/70 text-[16px] sm:text-[18px] leading-[24px]">
    Admin control — view, edit, reset, or delete attendees
  </p>
        </div>

        {/* Search + summary row (left aligned) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="w-full sm:w-96">
            <input
              type="text"
              placeholder="Search attendee by name, email or rank..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#1E1E28] border border-[#224E61]/70 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00E0FF] transition"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#1E1E28] border border-[#224E61] rounded-lg px-4 py-2 text-sm">
              <div className="text-white/80 text-xs">Total Attendees</div>
              <div className="text-white font-semibold">{attendees.length}</div>
            </div>

            <div className="bg-[#1E1E28] border border-[#224E61] rounded-lg px-4 py-2 text-sm">
              <div className="text-white/80 text-xs">Showing</div>
              <div className="text-white font-semibold">{filtered.length}</div>
            </div>
          </div>
        </div>

        {/* Attendees container (card) */}
        <div
          className="rounded-xl p-6"
          style={{
            background: "rgba(30,30,40,1)",
            border: "1px solid rgba(34,78,97,1)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-2xl font-medium">Attendees</h2>
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-white/50 py-6 italic">
              No attendees found.
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-left text-white/80 border-collapse">
                  <thead className="border-b border-[#224E61] text-[#00E0FF]/70 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 font-medium text-center">Rank</th>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium text-center">Points</th>
                      <th className="px-4 py-3 font-medium text-center">Actions</th>
                      <th className="px-4 py-3 font-medium text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => (
                      <React.Fragment key={a.id}>
                        <tr className="border-t border-[#224E61]/40 hover:bg-[#224E61]/10 transition">
                          <td className="px-4 py-3 text-center text-[#00E0FF] font-semibold">
                            #{a.rank}
                          </td>
                          <td className="px-4 py-3">{a.name}</td>
                          <td className="px-4 py-3 text-white/60">{a.email}</td>
                          <td className="px-4 py-3 text-center font-semibold text-green-400">
                            {a.totalPoints}
                          </td>
                          <td className="px-4 py-3 text-center space-x-2">
                            <button
                              onClick={() => openEdit(a)}
                              className="bg-[#00E0FF] hover:bg-[#00C8E6] text-white px-3 py-1.5 rounded-md text-sm transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleResetPoints(a)}
                              className="bg-yellow-500/80 text-black hover:bg-yellow-500 px-3 py-1.5 rounded-md text-sm transition"
                            >
                              Reset
                            </button>
                            {/* <button
                              onClick={() => handleDelete(a)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm transition"
                            >
                              Delete
                            </button> */}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                              className="bg-white/10 px-3 py-1.5 rounded-md text-sm hover:bg-[#00E0FF]/30 transition"
                            >
                              {expanded === a.id ? "Hide" : "View"}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded row (desktop) */}
                        {expanded === a.id && (
                          <tr className="bg-[#1E1E28] border-t border-[#224E61]/40">
                            <td colSpan="6" className="px-4 py-4">
                              <p className="text-white/80 mb-2 font-semibold">Scanned Stations:</p>
                              {scanData[a.id]?.length > 0 ? (
                                <ul className="list-disc pl-6 space-y-1 text-white/70">
                                  {scanData[a.id].map((s, i) => (
                                    <li key={i}>
                                      <span className="text-white/60">Station ID:</span>{" "}
                                      <span className="text-[#00E0FF]">{s.stationId}</span>{" "}
                                      —{" "}
                                      <span className="font-semibold text-green-400">+{s.pointsEarned} pts</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-white/50 italic">No stations scanned yet.</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden flex flex-col gap-4">
                {filtered.map((a) => (
                  <div
                    key={a.id}
                    className="bg-[#1E1E28] border border-[#224E61]/50 rounded-lg p-4 flex flex-col gap-2 shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-white font-semibold text-base">
                        #{a.rank} {a.name}
                      </h3>
                      <span className="text-[#00E0FF] text-xs bg-[#224E61]/40 px-2 py-[2px] rounded-md">
                        {a.totalPoints} pts
                      </span>
                    </div>

                    <p className="text-white/60 text-sm break-all">{a.email}</p>

                    <div className="flex justify-end flex-wrap gap-2 mt-3">
                      <button
                        onClick={() => openEdit(a)}
                        className="bg-[#00E0FF] hover:bg-[#00C8E6] text-white px-3 py-1.5 rounded-md text-xs transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetPoints(a)}
                        className="bg-yellow-500/80 hover:bg-yellow-500 text-black px-3 py-1.5 rounded-md text-xs transition"
                      >
                        Reset
                      </button>
                      {/* <button
                        onClick={() => handleDelete(a)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs transition"
                      >
                        Delete
                      </button> */}
                      <button
                        onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                        className="bg-white/10 hover:bg-[#00E0FF]/30 text-white px-3 py-1.5 rounded-md text-xs transition"
                      >
                        {expanded === a.id ? "Hide" : "View"}
                      </button>
                    </div>

                    {expanded === a.id && (
                      <div className="mt-3 text-sm border-t border-[#224E61]/40 pt-2">
                        <p className="text-white/80 mb-1 font-semibold">Scanned Stations:</p>
                        {scanData[a.id]?.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1 text-white/70">
                            {scanData[a.id].map((s, i) => (
                              <li key={i}>
                                <span className="text-white/60">Station ID:</span>{" "}
                                <span className="text-[#00E0FF]">{s.stationId}</span>{" "}
                                —{" "}
                                <span className="font-semibold text-green-400">+{s.pointsEarned} pts</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-white/50 italic">No stations scanned yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1E1E28] border border-[#224E61] rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-white">Edit Attendee</h2>

            <label className="block text-sm font-medium mb-1 text-white/80">Name</label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full mb-3 p-2 rounded-lg bg-[#1E1E28] border border-[#224E61]/70 text-white placeholder-white/40 focus:ring-2 focus:ring-[#00E0FF] outline-none"
            />

            <label className="block text-sm font-medium mb-1 text-white/80">Email</label>
            <input
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full mb-3 p-2 rounded-lg bg-[#1E1E28] border border-[#224E61]/70 text-white placeholder-white/40 focus:ring-2 focus:ring-[#00E0FF] outline-none"
            />

            <label className="block text-sm font-medium mb-1 text-white/80">Department</label>
            <input
              value={editForm.department}
              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              className="w-full mb-5 p-2 rounded-lg bg-[#1E1E28] border border-[#224E61]/70 text-white placeholder-white/40 focus:ring-2 focus:ring-[#00E0FF] outline-none"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="px-3 py-1.5 bg-white/10 rounded-md hover:bg-white/20 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-3 py-1.5 bg-[#00E0FF] hover:bg-[#00C8E6] text-white rounded-md transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  </>
);

}
