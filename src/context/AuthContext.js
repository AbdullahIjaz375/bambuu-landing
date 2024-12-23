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

/////////////////////////////////////////////////     testting///////////////////////////////////////////////
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

//   const updateUserData = (userData) => {
//     if (userData) {
//       setUser(userData);
//       sessionStorage.setItem("user", JSON.stringify(userData));
//       sessionStorage.setItem("userType", userData.userType);
//     } else {
//       setUser(null);
//       sessionStorage.clear();
//     }
//   };

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
//       if (currentUser) {
//         const storedUser = sessionStorage.getItem("user");
//         if (storedUser) {
//           setUser(JSON.parse(storedUser));
//         } else {
//           try {
//             // Try fetching tutor data first
//             const tutorRef = doc(db, "tutors", currentUser.uid);
//             const tutorDoc = await getDoc(tutorRef);

//             if (tutorDoc.exists()) {
//               const userData = {
//                 ...tutorDoc.data(),
//                 uid: currentUser.uid,
//                 userType: "tutor",
//               };
//               updateUserData(userData);
//             } else {
//               // If not a tutor, try fetching student data
//               const studentRef = doc(db, "students", currentUser.uid);
//               const studentDoc = await getDoc(studentRef);

//               if (studentDoc.exists()) {
//                 const userData = {
//                   ...studentDoc.data(),
//                   uid: currentUser.uid,
//                   userType: "student",
//                 };
//                 updateUserData(userData);
//               }
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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// import React, { createContext, useContext, useEffect, useState } from "react";
// import { auth, db } from "../firebaseConfig";
// import { onAuthStateChanged } from "firebase/auth";
// import { doc, getDoc } from "firebase/firestore";
// import { StreamChat } from "stream-chat";

// const AuthContext = createContext();

// // Initialize Stream Client
// const streamApiKey = process.env.REACT_APP_STREAM_API_KEY;
// const streamClient = StreamChat.getInstance(streamApiKey);

// // Add this option to allow dev tokens
// streamClient.tokenProvider = async (userId) => {
//   return streamClient.devToken(userId);
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(() => {
//     const storedUser = sessionStorage.getItem("user");
//     return storedUser ? JSON.parse(storedUser) : null;
//   });
//   const [loading, setLoading] = useState(true);

//   const connectStreamUser = async (userData) => {
//     try {
//       if (!userData?.uid) {
//         console.error("No user ID available");
//         return;
//       }

//       // If already connected with the same user, don't reconnect
//       if (streamClient.userID === userData.uid) {
//         console.log("User already connected to Stream");
//         return;
//       }

//       // Disconnect any existing user first
//       if (streamClient.userID) {
//         await streamClient.disconnectUser();
//       }

//       // Connect the user to Stream
//       await streamClient.connectUser(
//         {
//           id: userData.uid,
//           name: userData.name || "",
//           image: userData.photoUrl || "",
//           userType: userData.userType,
//         },
//         streamClient.devToken(userData.uid)
//       );

//       console.log("Stream user connected successfully");
//     } catch (error) {
//       console.error("Error connecting Stream user:", error);
//       // You might want to add additional error handling here
//     }
//   };

//   const disconnectStreamUser = async () => {
//     try {
//       if (streamClient.userID) {
//         await streamClient.disconnectUser();
//         console.log("Stream user disconnected");
//       }
//     } catch (error) {
//       console.error("Error disconnecting Stream user:", error);
//     }
//   };

//   const updateUserData = async (userData) => {
//     if (userData) {
//       setUser(userData);
//       sessionStorage.setItem("user", JSON.stringify(userData));
//       sessionStorage.setItem("userType", userData.userType);
//       await connectStreamUser(userData);
//     } else {
//       await disconnectStreamUser();
//       setUser(null);
//       sessionStorage.clear();
//     }
//   };

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
//       try {
//         if (currentUser) {
//           const storedUser = sessionStorage.getItem("user");
//           if (storedUser) {
//             const userData = JSON.parse(storedUser);
//             setUser(userData);
//             await connectStreamUser(userData);
//           } else {
//             // Try fetching tutor data first
//             const tutorRef = doc(db, "tutors", currentUser.uid);
//             const tutorDoc = await getDoc(tutorRef);

//             if (tutorDoc.exists()) {
//               const userData = {
//                 ...tutorDoc.data(),
//                 uid: currentUser.uid,
//                 userType: "tutor",
//               };
//               await updateUserData(userData);
//             } else {
//               // If not a tutor, try fetching student data
//               const studentRef = doc(db, "students", currentUser.uid);
//               const studentDoc = await getDoc(studentRef);

//               if (studentDoc.exists()) {
//                 const userData = {
//                   ...studentDoc.data(),
//                   uid: currentUser.uid,
//                   userType: "student",
//                 };
//                 await updateUserData(userData);
//               }
//             }
//           }
//         } else {
//           await updateUserData(null);
//         }
//       } catch (error) {
//         console.error("Error in auth state change:", error);
//         await updateUserData(null);
//       } finally {
//         setLoading(false);
//       }
//     });

//     return () => {
//       unsubscribe();
//       disconnectStreamUser();
//     };
//   }, []);

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         loading,
//         updateUserData,
//         setUser,
//         streamClient,
//       }}
//     >
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
import { StreamChat } from "stream-chat";

const AuthContext = createContext();
const streamClient = StreamChat.getInstance(
  process.env.REACT_APP_STREAM_API_KEY
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  const connectStreamUser = async (userData) => {
    try {
      // For development, using devToken. In production, get from your backend
      const streamToken = streamClient.devToken(userData.uid);

      await streamClient.connectUser(
        {
          id: userData.uid,
          name: userData.name || "",
          image: userData.photoUrl || "",
          // Add any additional user data needed for Stream
          userType: userData.userType, // Include user type for different roles
        },
        streamToken
      );
      console.log("Stream user connected successfully");
    } catch (error) {
      console.error("Error connecting Stream user:", error);
    }
  };

  const disconnectStreamUser = async () => {
    try {
      if (streamClient.userID) {
        await streamClient.disconnectUser();
        console.log("Stream user disconnected");
      }
    } catch (error) {
      console.error("Error disconnecting Stream user:", error);
    }
  };

  const updateUserData = async (userData) => {
    if (userData) {
      setUser(userData);
      sessionStorage.setItem("user", JSON.stringify(userData));
      sessionStorage.setItem("userType", userData.userType);
      await connectStreamUser(userData);
    } else {
      await disconnectStreamUser();
      setUser(null);
      sessionStorage.clear();
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          await connectStreamUser(userData);
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
              await updateUserData(userData);
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
                await updateUserData(userData);
              }
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            await updateUserData(null);
          }
        }
      } else {
        await updateUserData(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      disconnectStreamUser();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        updateUserData,
        setUser,
        streamClient, // Make streamClient available throughout the app
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
