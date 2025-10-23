import functions from "firebase-functions";
import admin from "firebase-admin";

admin.initializeApp();
console.log("🚀 Firebase Admin initialized");

export const createModerator = functions.https.onCall(async (data, context) => {
  console.log("📥 Raw data received:", data);

  try {
    // 🧠 Handle both cases: direct data or wrapped inside "data"
    const payload = data?.data || data;

    // Extract and sanitize fields
    const name = (payload?.name ? String(payload.name).trim() : "");
    const email = (payload?.email ? String(payload.email).trim() : "");
    const password = (payload?.password ? String(payload.password).trim() : "");

    console.log("✅ Parsed data:", { name, email, password });

    // 🔒 Validate required fields
    if (!name || !email || !password) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields (name, email, password)"
      );
    }

    // 👤 Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      displayName: name,
      email,
      password,
      emailVerified: true,
    });

    // 🗄️ Save user info to Firestore
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      name,
      email,
      role: "moderator",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Moderator created: ${userRecord.uid}`);

    return {
      message: "Moderator created successfully",
      uid: userRecord.uid,
    };
  } catch (error) {
    console.error("🔥 Error creating moderator:", error);

    // Handle Firebase Auth errors
    if (error.code && error.code.startsWith("auth/")) {
      throw new functions.https.HttpsError("invalid-argument", error.message);
    }

    // Re-throw HttpsError (like validation errors)
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Fallback for unknown errors
    throw new functions.https.HttpsError(
      "internal",
      error.message || "An unknown error occurred on the server."
    );
  }
});
