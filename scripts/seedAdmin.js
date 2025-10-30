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
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
  admin.initializeApp({ projectId: "tech-cafe-event-dev" });
  console.log("🔥 Using Firebase Emulators (127.0.0.1:8080 / 9099)");
} else {
  const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");
  if (!existsSync(serviceAccountPath)) {
    console.error("❌ Missing serviceAccountKey.json");
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

/**
 * Utility: create user if doesn't exist (Auth + Firestore + Claims)
 */
const createUserIfNotExists = async ({
  email,
  password,
  displayName,
  role,
  extra = {},
}) => {
  let user;
  try {
    user = await auth.getUserByEmail(email);
    console.log(`⚠️ ${role} already exists (${email}), skipping creation.`);
  } catch (e) {
    if (e.code === "auth/user-not-found") {
      user = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: true,
      });
      console.log(`✅ Created ${role}: ${email}`);
    } else {
      throw e;
    }
  }

  // Assign role claim
  await auth.setCustomUserClaims(user.uid, { role });

  // Store Firestore user doc
  await db.collection("users").doc(user.uid).set(
    {
      name: displayName,
      email,
      role,
      verified: true, // all verified
      ...extra,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`✅ ${role} Firestore record synced.`);
};

/**
 * Seed main roles and data
 */
const seed = async () => {
  try {
    console.log("🚀 Starting seed...");

    // -----------------------------
    // 1️⃣ Admin
    // -----------------------------
    await createUserIfNotExists({
      email: "admin@gmail.com",
      password: "admin@gmail.com",
      displayName: "TechCafe Admin",
      role: "admin",
    });

    // -----------------------------
    // 2️⃣ Moderator
    // -----------------------------
    await createUserIfNotExists({
      email: "moderator@gmail.com",
      password: "moderator@gmail.com",
      displayName: "TechCafe Moderator",
      role: "moderator",
    });

    // -----------------------------
    // 3️⃣ Attendee
    // -----------------------------
    await createUserIfNotExists({
      email: "attendee@gmail.com",
      password: "attendee@gmail.com",
      displayName: "TechCafe Attendee",
      role: "attendee",
      extra: {
        department: "R&D",
        phone: "+1234567890",
        totalPoints: 0,
        prizeClaimed: false,
        stationsCompleted: [],
      },
    });

    // -----------------------------
    // 4️⃣ Event Stations
    // -----------------------------
    const stations = [
      {
        id: "futuristic-welcome",
        name: "Futuristic Welcome",
        description:
          "Escape the past. Shift your mindset. Control the future. Under the banner ESC + SHIFT + CTRL, discover how AI is transforming work, productivity, and the future of health-tech.",
        points: 10,
        active: true,
      },
      {
        id: "event-passport",
        name: "Event Passport",
        description:
          "Your journey starts here! Scan the code, register, and unlock your Tech Passport to begin the adventure.",
        points: 5,
        active: true,
      },
      {
        id: "ai-challenges",
        name: "AI Challenges",
        description:
          "Think fast. Act smart. Compete in two AI challenge rounds — earn points for speed and accuracy to climb the leaderboard! 🧠⚡",
        points: 20,
        active: true,
      },
      {
        id: "metaverse-xr-corner",
        name: "Metaverse / XR Corner",
        description:
          "Step into the Metaverse! Explore immersive VR games and interactive health-tech experiences.",
        points: 15,
        active: true,
      },
      {
        id: "tech-circles",
        name: "Tech Circles",
        description:
          "Join interactive sessions led by experts on AI in Marketing and Productivity.",
        points: 10,
        active: true,
      },
      {
        id: "prizes-giveaways",
        name: "Prizes & Giveaways",
        description:
          "Collect your giveaways and check if you’re in the Top 10 leaderboard!",
        points: 5,
        active: true,
      },
    ];

    console.log("🚀 Seeding event stations...");
    for (const station of stations) {
      const ref = db.collection("stations").doc(station.id);
      const snap = await ref.get();
      if (!snap.exists) {
        await ref.set({
          ...station,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Seeded station: ${station.name}`);
      } else {
        console.log(`⚠️ Station already exists: ${station.name}`);
      }
    }

    console.log("🎉 All users and stations seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during seeding:", err);
    process.exit(1);
  }
};

seed();


// To run
// this command can be used to run the seed


// $env:FIREBASE_EMULATOR="true"; node scripts/seedAdmin.js