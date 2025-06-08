import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { StreamChat } from "stream-chat";
import { streamVideoClient, fetchChatToken } from "../config/stream";
import i18n from "../i18n";
import { checkAccess } from "../utils/accessControl";

const AuthContext = createContext();
const streamClient = StreamChat.getInstance(
  process.env.REACT_APP_STREAM_API_KEY,
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
      // Don't attempt to connect if there's no user data
      if (!userData?.uid) {
        return;
      }

      // Check if user is actually authenticated before connecting to Stream
      if (!auth.currentUser) {
        return;
      }

      // Use the helper function for better error handling
      try {
        const { connectStreamUserWithRetry } = await import(
          "../utils/streamConnectionHelper"
        );
        await connectStreamUserWithRetry(
          streamClient,
          streamVideoClient,
          userData,
        );
      } catch (importError) {
        console.warn(
          "Could not import Stream helper, falling back to basic connection",
        );
        // Fallback to basic connection logic
        await connectStreamBasic(userData);
      }
    } catch (error) {
      // This will only catch errors not already caught in the helper
      console.error("Unexpected error connecting Stream user:", error);
    }
  };

  // Fallback basic Stream connection
  const connectStreamBasic = async (userData) => {
    try {
      const chatToken = await fetchChatToken(userData.uid);
      if (streamClient.userID !== userData.uid) {
        if (streamClient.userID) {
          await streamClient.disconnectUser();
        }
        await streamClient.connectUser(
          {
            id: userData.uid,
            name: userData.name || "",
            image: userData.photoUrl || "",
            userType: userData.userType,
          },
          chatToken,
        );
      }
    } catch (error) {
      console.error("Basic Stream connection failed:", error);
    }
  };
  const disconnectStreamUser = async () => {
    try {
      // Disconnect Stream chat client
      try {
        if (streamClient.userID) {
          await streamClient.disconnectUser();
        }
      } catch (chatError) {
        console.error("Error disconnecting Stream chat client:", chatError);
      }

      // Disconnect Stream video client
      try {
        if (streamVideoClient.user?.id) {
          await streamVideoClient.disconnectUser();
        }
      } catch (videoError) {
        console.error("Error disconnecting Stream video client:", videoError);
      }
    } catch (error) {
      console.error("Unexpected error disconnecting Stream services:", error);
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
    try {
      if (userData) {
        // If we have existing user data, fetch the latest from Firebase
        if (userData.uid && userData.userType) {
          try {
            const latestData = await fetchLatestUserData(
              userData.uid,
              userData.userType,
            );
            if (latestData) {
              userData = latestData;
            }
          } catch (fetchError) {
            console.error("Error fetching latest user data:", fetchError);
            // Continue with existing userData if fetch fails
          }
        }

        // Update language when updating user data
        if (userData.languagePreference) {
          i18n.changeLanguage(userData.languagePreference);
        }

        // Update state and session storage
        setUser(userData);
        sessionStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("userType", userData.userType);

        // Connect Stream services but don't let failures affect authentication
        try {
          await connectStreamUser(userData);
        } catch (streamError) {
          console.error(
            "Stream connection error during user update:",
            streamError,
          );
          // Don't block auth flow if Stream connection fails
        }
      } else {
        // User is logging out or null
        const currentLanguage = i18n.language;

        try {
          await disconnectStreamUser();
        } catch (disconnectError) {
          console.error("Error disconnecting Stream user:", disconnectError);
          // Continue with logout process even if Stream disconnect fails
        }

        setUser(null);
        sessionStorage.clear();

        // Update language when updating user data
        i18n.changeLanguage(currentLanguage);
      }
    } catch (error) {
      console.error("Unexpected error in updateUserData:", error);
      // If there was an error updating user data, ensure user state is consistent
      if (!userData) {
        setUser(null);
        sessionStorage.clear();
      }
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
            userData.userType,
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
            return result.hasAccess;
          })(),
          premiumClasses: (() => {
            const result = checkAccess(
              user,
              "premium-class",
              "Individual Premium",
            );
            return result.hasAccess;
          })(),
          canJoinClass: (classType) => {
            const accessCheck = checkAccess(user, "premium-class", classType);
            return accessCheck.hasAccess;
          },
        },
      }
    : null;

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
