import React, { useEffect, useState } from "react";
import AdminNavbar from "../../components/ui/AdminNavbar";
import { db } from "../../utils/firebase";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";

const AdminNotifications = () => {
  const [sendTo, setSendTo] = useState("all");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);

  // Fetch notification history
  const fetchHistory = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "notifications"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHistory(data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Send Notification
  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      await addDoc(collection(db, "notifications"), {
        title,
        message,
        sendTo,
        email: sendTo === "individual" ? email : "All",
        createdAt: serverTimestamp(),
      });

      toast.success("Notification sent successfully!");
      setTitle("");
      setMessage("");
      setEmail("");
      fetchHistory();
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Error sending notification");
    }
  };

  return (
    <>
          <AdminNavbar />
    <div
      className="min-h-screen text-gray-100 pt-24 px-6 pb-10"
      style={{
        background: `
          linear-gradient(248.32deg, rgba(34, 78, 97, 0.24) 1.53%, rgba(27, 55, 82, 0.85) 48.49%, #0D1B3A 95.44%),
          linear-gradient(115.02deg, rgba(34, 78, 97, 0.64) 20.88%, #0D1B3A 100%)
        `,
      }}
    >


      <h1 className="text-3xl font-semibold mb-8 text-white">Admin Notifications</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Notification Form */}
        <div
          className="rounded-2xl p-6 shadow-md border border-white/10 backdrop-blur-sm"
          style={{
            background: "rgba(30, 30, 40, 1)",
            border: "1px solid rgba(34, 78, 97, 1)",
          }}
        >
          <h2 className="text-xl font-semibold mb-4 text-white">Send Notification</h2>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 rounded-lg bg-[rgba(40,40,55,1)] border border-white/10 text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22d3ee]"
                placeholder="Enter title"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="4"
                className="w-full p-3 rounded-lg bg-[rgba(40,40,55,1)] border border-white/10 text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22d3ee]"
                placeholder="Enter your message"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">Send To</label>
              <div className="flex items-center gap-6 text-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sendTo"
                    value="all"
                    checked={sendTo === "all"}
                    onChange={() => setSendTo("all")}
                    className="accent-[#22d3ee] w-4 h-4"
                  />
                  <span>All Attendees</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sendTo"
                    value="individual"
                    checked={sendTo === "individual"}
                    onChange={() => setSendTo("individual")}
                    className="accent-[#22d3ee] w-4 h-4"
                  />
                  <span>Individual Attendee</span>
                </label>
              </div>
            </div>

            {sendTo === "individual" && (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">
                  Attendee Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[rgba(40,40,55,1)] border border-white/10 text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22d3ee]"
                  placeholder="Enter attendee email"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#22d3ee] hover:bg-[#0ea5e9] transition-all py-3 rounded-lg font-semibold text-white shadow-md"
            >
              Send Notification
            </button>
          </form>
        </div>

        {/* Right: Notification History */}
        <div
          className="rounded-2xl p-6 shadow-md border border-white/10 backdrop-blur-sm"
          style={{
            background: "rgba(30, 30, 40, 1)",
            border: "1px solid rgba(34, 78, 97, 1)",
          }}
        >
          <h2 className="text-xl font-semibold mb-4 text-white">Notification History</h2>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <p className="text-gray-400">No notifications sent yet.</p>
            ) : (
              history.map((notif) => (
                <div
                  key={notif.id}
                  className="rounded-xl p-4 border border-white/10 bg-[rgba(40,40,55,1)] hover:bg-[rgba(45,45,65,1)] transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-[#22d3ee]">
                      {notif.title}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {notif.createdAt?.seconds
                        ? new Date(notif.createdAt.seconds * 1000).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                  <p className="text-gray-300 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Sent to:{" "}
                    <span className="text-gray-300">
                      {notif.sendTo === "all" ? "All Attendees" : notif.email}
                    </span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminNotifications;
