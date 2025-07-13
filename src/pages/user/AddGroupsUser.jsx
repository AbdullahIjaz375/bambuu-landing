import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft } from "lucide-react";
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
import Sidebar from "../../components/Sidebar";

const AddGroupsUser = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form state
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [image, setImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [learningLanguage, setLearningLanguage] = useState("");

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
      // Create new group in Firestore first
      const groupRef = await addDoc(collection(db, "groups"), {});
      const groupId = groupRef.id;

      // Upload and get image URL if exists
      const imageUrl = await handleImageUpload(groupId);

      try {
        const memberRoles = [
          {
            user_id: user.uid,
            role: "Moderator",
          },
        ];

        const channelData = {
          id: groupId,
          type: ChannelType.STANDARD_GROUP,
          members: [user.uid],
          name: groupName,
          image: imageUrl,
          description: groupDescription,
          created_by_id: user.uid,
          member_roles: memberRoles,
        };
        await createStreamChannel(channelData);
      } catch (streamError) {
        console.error("Error creating stream channel:", streamError);
        // Delete the group if channel creation fails
        await deleteDoc(doc(db, "groups", groupId));
        throw streamError;
      }

      // Create new group object with all data
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
        createdAt: new Date(),
        isPremium: false,
        imageUrl,
      };

      // Update the group document with all data
      await updateDoc(doc(db, "groups", groupId), newGroup);

      // Update user document in Firestore
      const userRef = doc(db, "students", user.uid);
      await updateDoc(userRef, {
        adminOfGroups: [...(user.adminOfGroups || []), groupId],
        joinedGroups: [...(user.joinedGroups || []), groupId],
      });

      // Update local user state and session storage
      const updatedUser = {
        ...user,
        adminOfGroups: [...(user.adminOfGroups || []), groupId],
        joinedGroups: [...(user.joinedGroups || []), groupId],
      };
      setUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));

      // Navigate after successful creation
      setTimeout(() => {
        navigate("/groupsUser");
      }, 1000);
    } catch (error) {
      console.error("Error creating group:", error);
      setLoading(false);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <div className="h-full w-[272px] flex-shrink-0 p-4">
        <Sidebar user={user} />
      </div>
      <div className="min-w-[calc(100% - 272px)] h-[calc(100vh-0px)] flex-1 overflow-x-auto p-4 pl-0">
        <div className="h-[calc(100vh-32px)] overflow-y-auto rounded-3xl border border-[#e7e7e7] bg-white p-[16px]">
          <div className="flex h-full flex-col">
            {/* Fixed Header Section */}
            <div className="sticky top-0 z-10 bg-white">
              <div className="mb-6 flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                  <button
                    className="rounded-full bg-gray-100 p-3"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft size="30" />
                  </button>
                  <h1 className="text-4xl font-semibold">Create a New Group</h1>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto">
              <div className="max-w-3xl pl-2">
                <div className="mb-6">
                  <div
                    className="relative mb-4 flex h-28 w-28 cursor-pointer items-center justify-center rounded-full border hover:bg-gray-100"
                    onClick={() =>
                      document.getElementById("groupImage").click()
                    }
                  >
                    {selectedImage ? (
                      <img
                        src={selectedImage}
                        alt="Group"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <img src="/svgs/gallery-import.svg" className="h-8 w-8" />
                    )}
                    <div className="absolute bottom-1 right-0 rounded-full bg-black p-1 shadow-lg">
                      <img src="/svgs/camera.svg" />
                    </div>
                    <input
                      id="groupImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="mb-1 block text-lg font-semibold text-[#3d3d3d]">
                      Group Name
                    </label>
                    <input
                      type="text"
                      placeholder="Group name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full rounded-3xl border border-gray-300 p-3 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-lg font-semibold text-[#3d3d3d]">
                      Group Description
                    </label>
                    <textarea
                      placeholder="Enter short description of group. (max 200 letter)"
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      rows="4"
                      maxLength={200}
                      className="w-full resize-none rounded-3xl border border-gray-300 p-3 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-lg font-semibold text-[#3d3d3d]">
                      Learning Language
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["English", "Spanish", "English-Spanish"].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setLearningLanguage(lang)}
                          className={`text-md rounded-full px-4 py-2 ${
                            learningLanguage === lang
                              ? "border border-[#042F0C] bg-[#14B82C] text-black"
                              : "border bg-white text-gray-600"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex justify-between">
                <button
                  onClick={() => navigate("/groupsUser")}
                  className="rounded-full border border-[#5d5d5d] bg-white px-10 py-3 text-xl font-medium text-[#042f0c]"
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
                  className="rounded-full border border-[#5d5d5d] bg-[#14b82c] px-10 py-3 text-xl font-medium text-[#042f0c] disabled:border-[#b0b0b0] disabled:bg-[#b9f9c2] disabled:text-[#b0b0b0]"
                >
                  {loading ? "Creating..." : "Create Group"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddGroupsUser;
