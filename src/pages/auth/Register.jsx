import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../utils/firebase"; // ✅ ensure storage is exported
import { useNavigate } from "react-router-dom";

const ALLOWED_DOMAIN = "@gmail.com"; // change if needed

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    email: "",
    phone: "",
    password: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { name, department, email, phone, password } = formData;

      // 🛑 Email domain check
      if (!email.endsWith(ALLOWED_DOMAIN)) {
        setError("Only company emails are allowed.");
        setLoading(false);
        return;
      }

      // 🧩 Create Auth user
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // 📤 Upload profile image (if provided)
      let photoURL = "";
      if (profileImage) {
        const imageRef = ref(storage, `profileImages/${user.uid}.jpg`);
        await uploadBytes(imageRef, profileImage);
        photoURL = await getDownloadURL(imageRef);
      }

      // 🔄 Update Auth profile
      await updateProfile(user, {
        displayName: name,
        photoURL,
      });

      // 📧 Send verification email
      await sendEmailVerification(user);

      // 🗂️ Create Firestore user document
      await setDoc(doc(db, "users", user.uid), {
        name,
        department,
        email,
        phone,
        role: "attendee",
        verified: false,
        totalPoints: 0,
        prizeClaimed: false,
        stationsCompleted: [],
        photoURL, // ✅ save image URL
        createdAt: new Date(),
      });

      alert("Registration successful! Please verify your email before logging in.");
      navigate("/login");
    } catch (err) {
      console.error("❌ Registration error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded mt-10">
      <h2 className="text-2xl font-semibold mb-4">Register</h2>
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="flex flex-col items-center space-y-2">
          {preview && (
            <img
              src={preview}
              alt="Profile preview"
              className="w-24 h-24 rounded-full object-cover border"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="text-sm"
          />
        </div>

        <input
          name="name"
          onChange={handleChange}
          value={formData.name}
          placeholder="Name"
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="department"
          onChange={handleChange}
          value={formData.department}
          placeholder="Department"
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="email"
          type="email"
          onChange={handleChange}
          value={formData.email}
          placeholder="Company Email"
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="phone"
          onChange={handleChange}
          value={formData.phone}
          placeholder="Phone (optional)"
          className="w-full border p-2 rounded"
        />
        <input
          name="password"
          type="password"
          onChange={handleChange}
          value={formData.password}
          placeholder="Password"
          className="w-full border p-2 rounded"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
