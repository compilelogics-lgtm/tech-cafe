import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../utils/firebase";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import group from "./../../assets/group.png";
import novartislogotransparent1 from "./../../assets/novartis-logo-transparent-2-1-register.png";
import novartislogotransparent2 from "./../../assets/novartis-logo-transparent-2-register.png";

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

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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

      if (!email.endsWith(ALLOWED_DOMAIN)) {
        setError("Only company emails are allowed.");
        setLoading(false);
        return;
      }

      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      let photoURL = "";
      if (profileImage) {
        const imageRef = ref(storage, `profileImages/${user.uid}.jpg`);
        await uploadBytes(imageRef, profileImage);
        photoURL = await getDownloadURL(imageRef);
      }

      await updateProfile(user, { displayName: name, photoURL });
      await sendEmailVerification(user);

  // --- Generate QR code containing user's UID ---
  const qrCanvas = document.createElement("canvas");
  const QRCode = await import("qrcode");
  await QRCode.toCanvas(qrCanvas, user.uid);
  const qrBlob = await new Promise((resolve) =>
    qrCanvas.toBlob(resolve, "image/png")
  );

  // --- Upload QR code to Firebase Storage ---
  const qrRef = ref(storage, `userQRCodes/${user.uid}.png`);
  await uploadBytes(qrRef, qrBlob);
  const qrCodeURL = await getDownloadURL(qrRef);

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
        photoURL,
          qrCodeURL,
        createdAt: new Date(),
      });

      alert(
        "Registration successful! Please verify your email before logging in."
      );
      navigate("/login");
    } catch (err) {
      console.error("❌ Registration error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-[linear-gradient(180deg,rgba(10,15,37,1)_0%,rgba(16,32,66,1)_100%)] w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden text-white">
      <img
        className="absolute w-full h-full top-0 left-0 object-cover opacity-60"
        alt="Background pattern"
        src={group}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-[390px] px-[58px] pt-[40px]">
        <h1 className="font-semibold text-white text-[22px] text-center mb-2">
          UNLOCK YOUR PASS!
        </h1>

        <p className="text-[#b4c1d9] text-xs text-center mb-6">
          Fill in your details to join the Tech Café experience.
        </p>
        {/* --- Profile Upload --- */}
        <div className="relative flex flex-col items-center mb-6">
          <div className="relative">
            {preview ? (
              <img
                src={preview}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-[#00b1ff] shadow-[0_0_15px_rgba(0,177,255,0.5)]"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#dee5f12e] flex items-center justify-center border border-[#b4c1d9] text-[#b4c1d9] text-xl font-semibold">
                {formData.name
                  ? formData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "?"}
              </div>
            )}

            {/* Upload button overlay */}
            <label
              htmlFor="profileImage"
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#00b1ff] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#008cd6] transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7h4l2-3h6l2 3h4v13H3V7z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11a3 3 0 110 6 3 3 0 010-6z"
                />
              </svg>
              <input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-xs text-[#b4c1d9] mt-2">
            {preview ? "Change photo" : "Upload profile photo"}
          </p>
        </div>

        {/* --- Registration Form --- */}
        <form
          onSubmit={handleRegister}
          className="flex flex-col w-[274px] gap-[19px]"
        >
          <div>
            <label className="block text-[#e0e0e0] text-[13px] mb-1">
              Full Name
            </label>
            <input
              name="name"
              onChange={handleChange}
              value={formData.name}
              placeholder="e.g., Sara Ahmed"
              className="w-full h-12 bg-[#dee5f12e] rounded-lg px-[17px] text-white placeholder:text-[#b4c1d9] border border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-[#e0e0e0] text-[13px] mb-1">
              Department
            </label>
            <input
              name="department"
              onChange={handleChange}
              value={formData.department}
              placeholder="e.g., R&D"
              className="w-full h-12 bg-[#dee5f12e] rounded-lg px-[17px] text-white placeholder:text-[#b4c1d9]"
              required
            />
          </div>

          <div>
            <label className="block text-[#e0e0e0] text-[13px] mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              onChange={handleChange}
              value={formData.email}
              placeholder="e.g., sara@novartis.com"
              className="w-full h-12 bg-[#dee5f12e] rounded-lg px-[17px] text-white placeholder:text-[#b4c1d9]"
              required
            />
          </div>

          <div>
            <label className="block text-[#e0e0e0] text-[13px] mb-1">
              Phone <span className="text-[#a0a0a0] text-xs">(optional)</span>
            </label>
            <input
              name="phone"
              onChange={handleChange}
              value={formData.phone}
              placeholder="+92 3XXXXXXXXX"
              className="w-full h-12 bg-[#dee5f12e] rounded-lg px-[17px] text-white placeholder:text-[#b4c1d9]"
            />
          </div>

          <div>
            <label className="block text-[#e0e0e0] text-[13px] mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              onChange={handleChange}
              value={formData.password}
              placeholder="Enter password"
              className="w-full h-12 bg-[#dee5f12e] rounded-lg px-[17px] text-white placeholder:text-[#b4c1d9]"
              required
            />
          </div>

          {/* Error */}
          {error && <p className="text-red-400 text-xs">{error}</p>}

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="relative h-[45px] mt-[38px] rounded-lg text-white text-base font-semibold bg-[linear-gradient(90deg,rgba(126,75,254,0.73)_7%,rgba(0,108,255,0.73)_47%,rgba(0,177,255,0.73)_100%)] hover:opacity-90 transition-opacity"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* Sign In Section */}
        <p className="mt-[51px] text-[#b4c1d9] text-xs text-center">
          Already have a pass?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-medium underline hover:text-white transition-colors"
          >
            Sign in
          </button>
        </p>

        {/* Logo */}
        <img
          className="mt-[38px] w-[178px] h-[157px] object-contain"
          alt="Novartis logo"
          src={novartislogotransparent2}
        />
        <img
          className="mt-[-81px] w-[107px] h-[25px] object-contain"
          alt="Novartis text"
          src={novartislogotransparent1}
        />
      </div>
    </main>
  );
}
