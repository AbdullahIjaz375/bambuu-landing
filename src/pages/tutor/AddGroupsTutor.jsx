import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebaseConfig";
import { createStreamChannel } from "../../services/streamService";
import { ChannelType } from "../../config/stream";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Sidebar from "../../components/Sidebar";
import { ArrowLeft, ImagePlus } from "lucide-react";

const AddGroupsTutor = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form state
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [image, setImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [learningLanguage, setLearningLanguage] = useState("");
  const [languageLevel, setLanguageLevel] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setSelectedImage(URL.createObjectURL(file));
  };

  const handleImageUpload = async (groupId) => {
    if (!image) return null;
    const storageRef = ref(storage, `groups/${groupId}/${image.name}`);
    await uploadBytes(storageRef, image);
    return await getDownloadURL(storageRef);
  };

  const handleCreateGroup = async () => {
    setLoading(true);

    try {
      // Create new group object

      // Add group to Firestore
      const groupRef = await addDoc(collection(db, "groups"), {});
      const groupId = groupRef.id;

      // Upload and update image if exists
      const imageUrl = await handleImageUpload(groupId);

      // Create GetStream channel first before completing group creation
      try {
        // Create member roles mapping for GetStream
        const memberRoles = [
          {
            user_id: user.uid,
            role: "Moderator", // Group creator gets Moderator role
          },
        ];

        const channelData = {
          id: groupId,
          type: ChannelType.PREMIUM_GROUP,
          members: [user.uid],
          name: groupName,
          image: imageUrl,
          description: groupDescription,
          created_by_id: user.uid, // Important for GetStream
          member_roles: memberRoles,
        };
        await createStreamChannel(channelData);
      } catch (streamError) {
        console.error("Error creating stream channel:", streamError);
        // Delete the group if channel creation fails
        await deleteDoc(doc(db, "groups", groupId));
        throw streamError;
      }

      const newGroup = {
        id: groupId,
        groupName,
        groupDescription,
        groupLearningLanguage: learningLanguage,
        groupAdminId: user.uid,
        groupAdminName: user.name || "Anonymous",
        groupAdminImageUrl: user.photoUrl || null,
        memberIds: [],
        classIds: [],
        createdAt: new Date().toISOString(),
        isPremium: true,
        imageUrl,
      };

      await updateDoc(doc(db, "groups", groupId), newGroup);

      // Update user document in Firestore
      const userRef = doc(db, "tutors", user.uid);
      await updateDoc(userRef, {
        // Add group to both arrays
        tutorOfGroups: [...(user.tutorOfGroups || []), groupId],
      });

      // Update local user state and session storage
      const updatedUser = {
        ...user,
        tutorOfGroups: [...(user.tutorOfGroups || []), groupId],
      };
      setUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));

      // Navigate after successful creation
      setTimeout(() => {
        navigate("/groupsTutor");
      }, 1000);
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user} />

      <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        <div className="flex items-center justify-between pb-4 mb-6 border-b">
          <div className="flex items-center gap-4">
            <button
              className="p-3 bg-gray-100 rounded-full"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size="30" />
            </button>
            <h1 className="text-4xl font-semibold">Create a New Group</h1>
          </div>
        </div>

        <div className="flex flex-col space-y-24">
          <div className="flex flex-col ">
            <div className="mb-6">
              <div
                className="relative flex items-center justify-center mb-4 bg-gray-100 rounded-full cursor-pointer w-28 h-28 hover:bg-gray-200"
                onClick={() => document.getElementById("groupImage").click()}
              >
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt="Group"
                    className="object-cover w-full h-full rounded-full"
                  />
                ) : (
                  <ImagePlus className="w-8 h-8 text-gray-400" />
                )}
                <input
                  id="groupImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="w-1/2 space-y-6">
              <div>
                <label className="block text-[#3d3d3d] mb-1 text-md font-semibold">
                  Group Name
                </label>
                <input
                  type="text"
                  placeholder="Group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-blue-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 text-[#3d3d3d]  text-md font-semibold">
                  Group Description
                </label>
                <textarea
                  placeholder="Enter short description of group. (max 200 letter)"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  rows="4"
                  className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-blue-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 text-[#3d3d3d] text-md font-semibold">
                  Learning Language
                </label>
                <div className="flex flex-wrap gap-2">
                  {["English", "Spanish", "English-Spanish Exchange"].map(
                    (lang) => (
                      <button
                        key={lang}
                        onClick={() => setLearningLanguage(lang)}
                        className={`px-4 py-2 text-md rounded-full ${
                          learningLanguage === lang
                            ? "bg-[#e6fde9] text-black"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {lang}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* <div>
                <label className="block mb-1 text-[#3d3d3d] text-md font-semibold">
                  Language Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Beginner", "Intermediate", "Advanced"].map((level) => (
                    <button
                      key={level}
                      onClick={() => setLanguageLevel(level)}
                      className={`px-4 py-2 text-md rounded-full ${
                        languageLevel === level
                          ? "bg-[#e6fde9] text-black"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div> */}
            </div>
          </div>
          <div className="flex justify-between gap-4 mt-8">
            <button
              onClick={() => navigate("/groupsUser")}
              className="px-10 py-3 text-[#042f0c] text-xl font-medium bg-white border border-[#5d5d5d] rounded-full"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={
                loading ||
                !groupName ||
                !groupDescription ||
                !learningLanguage ||
                !selectedImage
              }
              className="px-10 py-3 text-[#042f0c] text-xl font-medium bg-[#14b82c] border border-[#5d5d5d] disabled:bg-[#b9f9c2] disabled:text-[#b0b0b0] disabled:border-[#b0b0b0] rounded-full"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddGroupsTutor;
