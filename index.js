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
export const adminDeleteUser = functions.https.onCall(async (data, context) => {
  const { uid } = data; // use data directly

  if (!uid) {
    throw new functions.https.HttpsError("invalid-argument", "UID is required");
  }

  try {
    // Delete Firebase Auth user
    await admin.auth().deleteUser(uid);

    // Delete user doc
    await admin.firestore().collection("users").doc(uid).delete();

    // Delete scans in batches (safe for >500 docs)
    const scansRef = admin.firestore().collection("scans").where("userId", "==", uid);
    let snapshot = await scansRef.get();

    while (!snapshot.empty) {
      const batch = admin.firestore().batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      snapshot = await scansRef.get(); // get next batch
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new functions.https.HttpsError(
      "internal",
      error.message || "Unknown error occurred while deleting user"
    );
  }
});
