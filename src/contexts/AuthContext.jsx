import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../utils/firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAndMergeUserData = async (authUser) => {
    if (!authUser) return null;

    try {
      const userDocRef = doc(db, "users", authUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        return { ...authUser, ...docSnap.data() };
      }

      // Create user doc if not exists
      await setDoc(
        userDocRef,
        {
          email: authUser.email,
          name: authUser.displayName || authUser.email.split("@")[0],
          role: "attendee",
          totalPoints: 0,
          createdAt: new Date(),
        },
        { merge: true }
      );

      // Refetch after creation to ensure up-to-date role
      const newSnap = await getDoc(userDocRef);
      return { ...authUser, ...newSnap.data() };
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
      return authUser;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const fullUser = await fetchAndMergeUserData(firebaseUser);
        setUser(fullUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
