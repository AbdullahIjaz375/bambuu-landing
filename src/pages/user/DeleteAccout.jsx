import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  setDoc,
} from "firebase/firestore";
import { getStorage, ref, listAll, deleteObject } from "firebase/storage";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const DeleteAccount = () => {
  const [selectedReason, setSelectedReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  const feedbackOptions = [
    t("feedback.betterAlternative"),
    t("feedback.technicalIssues"),
    t("feedback.notUsingEnough"),
    t("feedback.pricingHigh"),
    t("feedback.other"),
  ];

  const deleteStudentData = async (userId) => {
    try {
      // Get student document
      const studentDoc = await getDoc(doc(db, "students", userId));
      if (!studentDoc.exists()) {
        throw new Error("Student not found");
      }
      const student = studentDoc.data();

      // Remove from enrolled classes
      for (const classId of student.enrolledClasses) {
        const classDoc = await getDoc(doc(db, "classes", classId));
        if (classDoc.exists()) {
          const classData = classDoc.data();
          const updatedMembers = classData.classMemberIds.filter(
            (id) => id !== userId
          );

          if (classData.classType === "individualPremium") {
            await updateDoc(doc(db, "classes", classId), {
              classMemberIds: [],
              availableSpots: classData.availableSpots + 1,
              selectedRecurrenceType: null,
              recurringSlots: [],
            });
          } else {
            await updateDoc(doc(db, "classes", classId), {
              classMemberIds: updatedMembers,
              availableSpots: classData.availableSpots + 1,
            });
          }
        }
      }

      // Delete admin classes
      for (const classId of student.adminOfClasses) {
        const classRef = doc(db, "classes", classId);
        const classDoc = await getDoc(classRef);

        if (classDoc.exists() && classDoc.data().adminId === userId) {
          // Delete class storage
          const storageRef = ref(storage, `classes/${classId}`);
          const files = await listAll(storageRef);
          await Promise.all(files.items.map((file) => deleteObject(file)));

          // Update member records
          const classData = classDoc.data();
          await Promise.all(
            classData.classMemberIds.map(async (memberId) => {
              const memberRef = doc(db, "students", memberId);
              const memberDoc = await getDoc(memberRef);
              if (memberDoc.exists()) {
                const memberData = memberDoc.data();
                await updateDoc(memberRef, {
                  enrolledClasses: memberData.enrolledClasses.filter(
                    (id) => id !== classId
                  ),
                });
              }
            })
          );

          await deleteDoc(classRef);
        }
      }

      // Remove from groups
      for (const groupId of student.joinedGroups) {
        const groupRef = doc(db, "groups", groupId);
        const groupDoc = await getDoc(groupRef);

        if (groupDoc.exists()) {
          const groupData = groupDoc.data();
          await updateDoc(groupRef, {
            memberIds: groupData.memberIds.filter((id) => id !== userId),
          });
        }
      }

      // Delete admin groups
      for (const groupId of student.adminOfGroups) {
        const groupRef = doc(db, "groups", groupId);
        const groupDoc = await getDoc(groupRef);

        if (groupDoc.exists() && groupDoc.data().groupAdminId === userId) {
          const groupData = groupDoc.data();

          // Delete group classes
          for (const classId of groupData.classIds) {
            await deleteDoc(doc(db, "classes", classId));
            const classStorageRef = ref(storage, `classes/${classId}`);
            const classFiles = await listAll(classStorageRef);
            await Promise.all(
              classFiles.items.map((file) => deleteObject(file))
            );
          }

          // Update member records
          await Promise.all(
            groupData.memberIds.map(async (memberId) => {
              const memberRef = doc(db, "students", memberId);
              const memberDoc = await getDoc(memberRef);
              if (memberDoc.exists()) {
                const memberData = memberDoc.data();
                await updateDoc(memberRef, {
                  joinedGroups: memberData.joinedGroups.filter(
                    (id) => id !== groupId
                  ),
                });
              }
            })
          );

          // Delete group storage
          const groupStorageRef = ref(storage, `groups/${groupId}`);
          const groupFiles = await listAll(groupStorageRef);
          await Promise.all(groupFiles.items.map((file) => deleteObject(file)));

          await deleteDoc(groupRef);
        }
      }

      // Store deletion reason
      await setDoc(doc(db, "delete_reasons", userId), {
        country: user.country,
        email: user.email,
        name: user.name,
        learningLanguage: user.learningLanguage,
        reason: selectedReason,
        deletedAt: new Date(),
      });

      // Delete user data
      await deleteDoc(doc(db, "user_accounts", userId));
      await deleteDoc(doc(db, "user_notifications", userId));
      await deleteDoc(doc(db, "students", userId));

      // Delete user storage
      const userStorageRef = ref(storage, `users/${userId}`);
      const userFiles = await listAll(userStorageRef);
      await Promise.all(userFiles.items.map((file) => deleteObject(file)));

      return true;
    } catch (error) {
      console.error("Error deleting student data:", error);
      throw error;
    }
  };

  const cleanupUserSession = () => {
    // Remove user from context
    setUser(null);

    // Clear session storage
    sessionStorage.removeItem("user");
    sessionStorage.clear();

    // Clear any other stored user data
    localStorage.removeItem("user");
    localStorage.removeItem("userPreferences");
  };

  const handleDeleteAccount = async () => {
    if (!selectedReason) {
      toast.error(t("settings.deleteModal.selectReason"), {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setIsDeleting(true);

    try {
      // Delete all user data first
      await deleteStudentData(user.uid);

      // Delete the user from Firebase Authentication
      await auth.currentUser.delete();

      // Clean up user session and context
      cleanupUserSession();

      // toast.success(t("settings.deleteModal.success"), {
      //   position: "top-right",
      //   autoClose: 2000,
      // });

      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (error) {
      if (error.code === "auth/requires-recent-login") {
        toast.error(t("settings.deleteModal.recentLoginRequired"), {
          position: "top-right",
          autoClose: 5000,
        });
        // Optionally redirect to reauthentication page
        // navigate('/reauth');
      } else {
        toast.error(error.message || t("common.unexpectedError"), {
          position: "top-right",
          autoClose: 5000,
        });
      }
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <div className="flex-shrink-0 w-64 h-full">
        <Sidebar user={user} />
      </div>
      <div className="flex-1 overflow-x-auto min-w-[calc(100%-16rem)] h-full">
        <div className="h-[calc(100vh-1rem)] p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl m-2 overflow-y-auto">
          <div className="flex items-center justify-between pb-4 mb-6 border-b">
            <div className="flex items-center gap-4">
              <button
                className="flex-shrink-0 p-3 transition-colors bg-gray-100 rounded-full hover:bg-gray-200"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-4xl font-semibold whitespace-nowrap">
                {t("settings.deleteAccount")}
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="max-w-xl">
              <div className="flex flex-col items-center">
                <img
                  alt="delete"
                  src="/svgs/delete-user.svg"
                  className="mb-4"
                />
                <h2 className="mb-2 text-2xl font-semibold">
                  {t("settings.deleteModal.title")}
                </h2>
                <p className="mb-6 text-center text-gray-600">
                  {t("settings.deleteModal.description")}
                </p>
              </div>

              <div className="flex flex-col items-start justify-start mb-6 space-y-3">
                {feedbackOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedReason(option)}
                    className={`w-full px-3 py-2 text-left rounded-full transition-colors
                      ${
                        selectedReason === option
                          ? "bg-gray-100 border-2 border-gray-300"
                          : "border border-gray-200 hover:bg-gray-50"
                      }`}
                    disabled={isDeleting}
                  >
                    <span className="text-gray-700">{option}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-row gap-2">
                <button
                  className="w-full py-3 font-medium text-black bg-white border border-black rounded-full hover:bg-gray-100"
                  onClick={() => navigate(-1)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className="w-full py-3 font-medium text-white bg-red-500 rounded-full hover:bg-red-600 disabled:opacity-50"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || !selectedReason}
                >
                  {isDeleting
                    ? t("common.loading")
                    : t("settings.deleteModal.confirm")}
                </button>
              </div>

              <p className="mt-4 text-sm text-center text-gray-500">
                {t("settings.deleteModal.warning")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;
