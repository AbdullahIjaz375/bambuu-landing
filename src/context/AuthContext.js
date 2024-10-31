// import React, { createContext, useContext, useEffect, useState } from "react";
// import { auth, db } from "../firebaseConfig";
// import { onAuthStateChanged } from "firebase/auth";
// import { doc, getDoc } from "firebase/firestore";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(() => {
//     const storedUser = sessionStorage.getItem("user");
//     return storedUser ? JSON.parse(storedUser) : null;
//   });
//   const [loading, setLoading] = useState(true);

//   // Function to store essential user data in session storage
//   const saveUserToSessionStorage = (userData) => {
//     const filteredUser = {
//       uid: userData.uid,
//       email: userData.email,
//       displayName: userData.displayName || userData.name || "User",
//       photoUrl: userData.photoUrl || "", // Use photoUrl from Firestore
//       currentStreak: userData.currentStreak || 0,
//       country: userData.country || "",
//       nickname: userData.nickname || "",
//     };
//     sessionStorage.setItem("user", JSON.stringify(filteredUser));
//   };

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
//       if (currentUser) {
//         // Fetch user data from Firestore
//         const userRef = doc(db, "users", currentUser.uid);
//         const userDoc = await getDoc(userRef);

//         if (userDoc.exists()) {
//           const userData = { ...userDoc.data(), uid: currentUser.uid }; // Add uid manually
//           setUser(userData); // Store full user data in context
//           saveUserToSessionStorage(userData); // Store essential data in session storage
//         }
//       } else {
//         setUser(null);
//         sessionStorage.removeItem("user");
//       }
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, loading, setUser }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   return useContext(AuthContext);
// };

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  // Function to store essential user data in session storage
  const saveUserToSessionStorage = (userData) => {
    const filteredUser = {
      uid: userData.uid,
      email: userData.email,
      name: userData.name || "User",
      photoUrl: userData.photoUrl || "",
      country: userData.country || "",
      currentStreak: userData.currentStreak || 0,
      learningLanguage: userData.learningLanguage || "",
      nativeLanguage: userData.nativeLanguage || "",
      nickname: userData.nickname || "",
      enrolledClasses: userData.enrolledClasses || [],
      joinedGroups: userData.joinedGroups || [],
      lastLoggedIn: userData.lastLoggedIn || null,
      savedDocuments: userData.savedDocuments || [],
      tier: userData.tier || 1,
      accountType: userData.accountType || "",
    };
    sessionStorage.setItem("user", JSON.stringify(filteredUser));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch user data from Firestore
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = { ...userDoc.data(), uid: currentUser.uid };
          setUser(userData); // Store full user data in context
          saveUserToSessionStorage(userData); // Store essential data in session storage
        }
      } else {
        setUser(null);
        sessionStorage.removeItem("user");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
