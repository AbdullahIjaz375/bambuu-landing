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

const TutorDeleteAccount = () => {
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

  const deleteTeacherData = async (userId) => {
    try {
      // Get teacher document
      const teacherDoc = await getDoc(doc(db, "tutors", userId));
      if (!teacherDoc.exists()) {
        throw new Error("Teacher not found");
      }
      const teacher = teacherDoc.data();

      // Delete teacher's classes
      for (const classId of teacher.tutorOfClasses) {
        const classRef = doc(db, "classes", classId);
        const classDoc = await getDoc(classRef);

        if (classDoc.exists()) {
          const classData = classDoc.data();

          // Delete class storage
          const storageRef = ref(storage, `classes/${classId}`);
          const files = await listAll(storageRef);
          await Promise.all(files.items.map((file) => deleteObject(file)));

          // Update enrolled students' records
          await Promise.all(
            classData.classMemberIds.map(async (memberId) => {
              const memberRef = doc(db, "students", memberId);
              const memberDoc = await getDoc(memberRef);
              if (memberDoc.exists()) {
                const memberData = memberDoc.data();
                await updateDoc(memberRef, {
                  enrolledClasses: memberData.enrolledClasses.filter(
                    (id) => id !== classId,
                  ),
                });
              }
            }),
          );

          // Delete the class document
          await deleteDoc(classRef);
        }
      }

      // Delete teacher's groups
      for (const groupId of teacher.tutorOfGroups) {
        const groupRef = doc(db, "groups", groupId);
        const groupDoc = await getDoc(groupRef);

        if (groupDoc.exists()) {
          const groupData = groupDoc.data();

          // Delete all classes in the group
          for (const classId of groupData.classIds) {
            // Delete class document
            await deleteDoc(doc(db, "classes", classId));

            // Delete class storage
            const classStorageRef = ref(storage, `classes/${classId}`);
            const classFiles = await listAll(classStorageRef);
            await Promise.all(
              classFiles.items.map((file) => deleteObject(file)),
            );
          }

          // Update group members' records
          await Promise.all(
            groupData.memberIds.map(async (memberId) => {
              const memberRef = doc(db, "students", memberId);
              const memberDoc = await getDoc(memberRef);
              if (memberDoc.exists()) {
                const memberData = memberDoc.data();
                await updateDoc(memberRef, {
                  joinedGroups: memberData.joinedGroups.filter(
                    (id) => id !== groupId,
                  ),
                });
              }
            }),
          );

          // Delete group storage
          const groupStorageRef = ref(storage, `groups/${groupId}`);
          const groupFiles = await listAll(groupStorageRef);
          await Promise.all(groupFiles.items.map((file) => deleteObject(file)));

          // Delete the group document
          await deleteDoc(groupRef);
        }
      }

      // Store deletion reason
      await setDoc(doc(db, "delete_reasons", userId), {
        country: user.country,
        email: user.email,
        name: user.name,
        teachingLanguage: user.teachingLanguage,
        reason: selectedReason,
        deletedAt: new Date(),
      });

      // Delete user data
      await deleteDoc(doc(db, "user_accounts", userId));
      await deleteDoc(doc(db, "user_notifications", userId));
      await deleteDoc(doc(db, "tutors", userId));

      // Delete user storage from both users and tutors folders
      const userStorageRef = ref(storage, `users/${userId}`);
      const userFiles = await listAll(userStorageRef);
      await Promise.all(userFiles.items.map((file) => deleteObject(file)));

      const tutorStorageRef = ref(storage, `tutors/${userId}`);
      const tutorFiles = await listAll(tutorStorageRef);
      await Promise.all(tutorFiles.items.map((file) => deleteObject(file)));

      return true;
    } catch (error) {
      console.error("Error deleting teacher data:", error);
      throw error;
    }
  };

  // Update the handleDeleteAccount function to use deleteTeacherData
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
      // Delete all teacher data first
      await deleteTeacherData(user.uid);

      // Delete the user from Firebase Authentication
      await auth.currentUser.delete();

      // Clean up user session and context
      cleanupUserSession();

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
      <div className="h-full w-[272px] flex-shrink-0 p-4">
        <Sidebar user={user} />
      </div>
      <div className="min-w-[calc(100% - 272px)] h-[calc(100vh-0px)] flex-1 overflow-x-auto p-4 pl-0">
        <div className="h-[calc(100vh-32px)] overflow-y-auto rounded-3xl border border-[#e7e7e7] bg-white p-[16px]">
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              <button
                className="flex-shrink-0 rounded-full bg-gray-100 p-3 transition-colors hover:bg-gray-200"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="whitespace-nowrap text-4xl font-semibold">
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

              <div className="mb-6 flex flex-col items-start justify-start space-y-3">
                {feedbackOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedReason(option)}
                    className={`w-full rounded-full px-3 py-2 text-left transition-colors ${
                      selectedReason === option
                        ? "border-2 border-gray-300 bg-gray-100"
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
                  className="w-full rounded-full border border-black bg-white py-3 font-medium text-black hover:bg-gray-100"
                  onClick={() => navigate(-1)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className="w-full rounded-full bg-red-500 py-3 font-medium text-white hover:bg-red-600 disabled:opacity-50"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || !selectedReason}
                >
                  {isDeleting ? "Deleting" : t("settings.deleteModal.confirm")}
                </button>
              </div>

              <p className="mt-4 text-center text-sm text-gray-500">
                {t("settings.deleteModal.warning")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorDeleteAccount;
