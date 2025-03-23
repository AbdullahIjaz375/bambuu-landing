import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { StreamChat } from "stream-chat";
import { streamVideoClient } from "../config/stream";
import i18n from "../i18n";
import { checkAccess } from "../utils/accessControl";

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

  // Initialize language from session storage or user preferences
  useEffect(() => {
    const initializeLanguage = () => {
      const storedUser = sessionStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData?.languagePreference) {
          i18n.changeLanguage(userData.languagePreference);
        }
      }
    };

    initializeLanguage();
  }, []);

  const connectStreamUser = async (userData) => {
    try {
      const streamToken = streamClient.devToken(userData.uid);
      await streamClient.connectUser(
        {
          id: userData.uid,
          name: userData.name || "",
          image: userData.photoUrl || "",
          userType: userData.userType,
        },
        streamToken
      );
      await streamVideoClient.connectUser(
        {
          id: userData.uid,
          name: userData.name || "",
          image: userData.photoUrl || "",
          userType: userData.userType,
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

  const fetchLatestUserData = async (uid, userType) => {
    const collectionName = userType === "tutor" ? "tutors" : "students";
    const userRef = doc(db, collectionName, uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = {
        ...userDoc.data(),
        uid,
        userType,
      };

      // Set language when fetching latest data
      if (userData.languagePreference) {
        i18n.changeLanguage(userData.languagePreference);
      }

      return userData;
    }
    return null;
  };

  const updateUserData = async (userData) => {
    if (userData) {
      // If we have existing user data, fetch the latest from Firebase
      if (userData.uid && userData.userType) {
        const latestData = await fetchLatestUserData(
          userData.uid,
          userData.userType
        );
        if (latestData) {
          userData = latestData;
        }
      }

      // Update language when updating user data
      if (userData.languagePreference) {
        i18n.changeLanguage(userData.languagePreference);
      }

      setUser(userData);
      sessionStorage.setItem("user", JSON.stringify(userData));
      sessionStorage.setItem("userType", userData.userType);
      await connectStreamUser(userData);
    } else {
      const currentLanguage = i18n.language;

      await disconnectStreamUser();
      setUser(null);
      sessionStorage.clear();

      // Update language when updating user data
      i18n.changeLanguage(currentLanguage);
    }
  };

  // Handle page refresh
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user?.uid && user?.userType) {
        const latestData = await fetchLatestUserData(user.uid, user.userType);
        if (latestData && JSON.stringify(latestData) !== JSON.stringify(user)) {
          await updateUserData(latestData);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          // Fetch latest data even for stored user
          const latestData = await fetchLatestUserData(
            userData.uid,
            userData.userType
          );
          if (latestData) {
            await updateUserData(latestData);
          } else {
            await updateUserData(userData);
          }
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

  const userWithAccess = user
    ? {
        ...user,
        access: {
          premiumGroups: (() => {
            const result = checkAccess(user, "premium-group", "Group Premium");
            console.log("🏢 Premium Groups Access:", result);
            return result.hasAccess;
          })(),
          premiumClasses: (() => {
            const result = checkAccess(
              user,
              "premium-class",
              "Individual Premium"
            );
            console.log("👤 Premium Classes Access:", result);
            return result.hasAccess;
          })(),
          canJoinClass: (classType) => {
            console.log("🎯 Checking Specific Class Access:", classType);
            const accessCheck = checkAccess(user, "premium-class", classType);
            console.log("📝 Class Access Result:", accessCheck);
            return accessCheck.hasAccess;
          },
        },
      }
    : null;

  // Add a log when providing the context
  console.log("🔑 User Access State:", {
    hasUser: !!userWithAccess,
    freeAccess: userWithAccess?.freeAccess,
    credits: userWithAccess?.credits,
    subscriptions: userWithAccess?.subscriptions?.length,
  });

  return (
    <AuthContext.Provider
      value={{
        user: userWithAccess,
        loading,
        updateUserData,
        setUser,
        streamClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
