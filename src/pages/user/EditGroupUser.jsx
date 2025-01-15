import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebaseConfig";

import Sidebar from "../../components/Sidebar";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { ClipLoader } from "react-spinners";

const EditGroupsUser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Form state
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [image, setImage] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [learningLanguage, setLearningLanguage] = useState("");

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (groupSnap.exists()) {
          const groupData = groupSnap.data();
          setGroupName(groupData.groupName);
          setGroupDescription(groupData.groupDescription);
          setLearningLanguage(groupData.groupLearningLanguage);
          setCurrentImageUrl(groupData.imageUrl);

          // Verify if user is admin
          if (groupData.groupAdminId !== user.uid) {
            navigate(-1, { replace: true });
          }
        } else {
          navigate(-1, { replace: true });
        }
      } catch (error) {
        console.error("Error fetching group:", error);
        navigate(-1, { replace: true });
      } finally {
        setInitialLoad(false);
      }
    };

    if (groupId) {
      fetchGroupData();
    }
  }, [groupId, navigate, user.uid]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setSelectedImage(URL.createObjectURL(file));
  };

  const handleImageUpload = async () => {
    if (!image) return currentImageUrl;
    const storageRef = ref(storage, `groups/${groupId}/${image.name}`);
    await uploadBytes(storageRef, image);
    return await getDownloadURL(storageRef);
  };

  const handleUpdateGroup = async () => {
    setLoading(true);

    try {
      const imageUrl = await handleImageUpload();

      const groupRef = doc(db, "groups", groupId);
      const updateData = {
        groupName,
        groupDescription,
        groupLearningLanguage: learningLanguage,
      };

      if (imageUrl) {
        updateData.imageUrl = imageUrl;
      }

      await updateDoc(groupRef, updateData);

      // Navigate after successful update
      navigate(-1, { replace: true });
    } catch (error) {
      console.error("Error updating group:", error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center h-[100vh] ">
        <div className="p-8 bg-white rounded-lg">
          <ClipLoader color="#FFB800" size={40} />
        </div>
      </div>
    );
  }

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
            <h1 className="text-4xl font-semibold">Edit Group</h1>
          </div>
        </div>

        <div className="flex flex-col space-y-24">
          <div className="flex flex-col">
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
                ) : currentImageUrl ? (
                  <img
                    src={currentImageUrl}
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
                <label className="block mb-1 text-[#3d3d3d] text-md font-semibold">
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
              onClick={handleUpdateGroup}
              disabled={
                loading || !groupName || !groupDescription || !learningLanguage
              }
              className="px-10 py-3 text-[#042f0c] text-xl font-medium bg-[#14b82c] border border-[#5d5d5d] disabled:bg-[#b9f9c2] disabled:text-[#b0b0b0] disabled:border-[#b0b0b0] rounded-full"
            >
              {loading ? "Updating..." : "Update Group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditGroupsUser;
