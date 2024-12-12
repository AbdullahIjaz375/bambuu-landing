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
//       adminOfClasses: userData.adminOfClasses || [],
//       adminOfGroups: userData.adminOfGroups || [],
//       country: userData.country || "",
//       currentStreak: userData.currentStreak || 0,
//       email: userData.email,
//       enrolledClasses: userData.enrolledClasses || [],
//       joinedGroups: userData.joinedGroups || [],
//       lastLoggedIn: userData.lastLoggedIn || new Date(),
//       learningLanguage: userData.learningLanguage || "",
//       learningLanguageProficiency:
//         userData.learningLanguageProficiency || "Beginner",
//       name: userData.name || "User",
//       nativeLanguage: userData.nativeLanguage || "",
//       photoUrl: userData.photoUrl || "",
//       savedDocuments: userData.savedDocuments || [],
//       tier: userData.tier || 1,
//       uid: userData.uid,
//     };
//     sessionStorage.setItem("user", JSON.stringify(filteredUser));
//   };

//   // In AuthContext.js
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
//       console.log("Auth state changed:", currentUser?.uid);
//       if (currentUser) {
//         const userRef = doc(db, "students", currentUser.uid);
//         const userDoc = await getDoc(userRef);
//         console.log("Firestore user data:", userDoc.data());

//         if (userDoc.exists()) {
//           const userData = { ...userDoc.data(), uid: currentUser.uid };
//           setUser(userData);
//           saveUserToSessionStorage(userData);
//           console.log("Saved user to session storage");
//         }
//       } else {
//         setUser(null);
//         sessionStorage.removeItem("user");
//         console.log("Removed user from session storage");
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

// // src/context/AuthContext.js
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

//   // Helper function to update user data consistently
//   const updateUserData = (userData) => {
//     if (userData) {
//       setUser(userData);
//       sessionStorage.setItem("user", JSON.stringify(userData));
//       sessionStorage.setItem("userType", userData.userType || "student");
//     } else {
//       setUser(null);
//       sessionStorage.clear();
//     }
//   };

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
//       if (currentUser) {
//         // Check if we already have user data in session storage
//         const storedUser = sessionStorage.getItem("user");
//         if (storedUser) {
//           setUser(JSON.parse(storedUser));
//         } else {
//           try {
//             const userRef = doc(db, "students", currentUser.uid);
//             const userDoc = await getDoc(userRef);

//             if (userDoc.exists()) {
//               const userData = {
//                 ...userDoc.data(),
//                 uid: currentUser.uid,
//                 userType: "student",
//               };
//               updateUserData(userData);
//             }
//           } catch (error) {
//             console.error("Error fetching user data:", error);
//             updateUserData(null);
//           }
//         }
//       } else {
//         updateUserData(null);
//       }
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, loading, updateUserData, setUser }}>
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

  const updateUserData = (userData) => {
    if (userData) {
      setUser(userData);
      sessionStorage.setItem("user", JSON.stringify(userData));
      sessionStorage.setItem("userType", userData.userType);
    } else {
      setUser(null);
      sessionStorage.clear();
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          try {
            // Try fetching tutor data first
            const tutorRef = doc(db, "tutors", currentUser.uid);
            const tutorDoc = await getDoc(tutorRef);

            if (tutorDoc.exists()) {
              const userData = {
                ...tutorDoc.data(),
                uid: currentUser.uid,
                userType: "tutor",
              };
              updateUserData(userData);
            } else {
              // If not a tutor, try fetching student data
              const studentRef = doc(db, "students", currentUser.uid);
              const studentDoc = await getDoc(studentRef);

              if (studentDoc.exists()) {
                const userData = {
                  ...studentDoc.data(),
                  uid: currentUser.uid,
                  userType: "student",
                };
                updateUserData(userData);
              }
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            updateUserData(null);
          }
        }
      } else {
        updateUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, updateUserData, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
