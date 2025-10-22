import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isEmulator =
  process.env.FIREBASE_EMULATOR === "true" ||
  process.env.FIRESTORE_EMULATOR_HOST ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (isEmulator) {
  // ✅ Use IPv4 and skip credentials
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

  admin.initializeApp({ projectId: "tech-cafe-event-dev" });
  console.log("🔥 Using Firebase Emulators (127.0.0.1:8080 / 9099)");
} else {
  const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");
  if (!existsSync(serviceAccountPath)) {
    console.error("❌ Missing serviceAccountKey.json.");
    process.exit(1);
  }
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
  console.log("✅ Connected to Firebase production project.");
}

const auth = admin.auth();
const db = admin.firestore();

const seed = async () => {
  try {
    const email = "admin@gmail.com";
    const password = "Admin@123";

    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log("⚠️ Admin already exists, skipping creation.");
    } catch (e) {
      if (e.code === "auth/user-not-found") {
        user = await auth.createUser({
          email,
          password,
          displayName: "TechCafe Admin",
          emailVerified: true,
        });
        console.log("✅ Admin user created.");
      } else throw e;
    }

    await db.collection("users").doc(user.uid).set(
      {
        name: "TechCafe Admin",
        email,
        role: "admin",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log("✅ Admin Firestore record seeded successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding admin:", err);
    process.exit(1);
  }
};

seed();

// To run
// this command can be used to run the seed


// $env:FIREBASE_EMULATOR="true"; node scripts/seedAdmin.js   