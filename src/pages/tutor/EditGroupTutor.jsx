import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebaseConfig";

import Sidebar from "../../components/Sidebar";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { ClipLoader } from "react-spinners";

const EditGroupsTutor = () => {
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
      <div className="flex h-[100vh] items-center justify-center">
        <div className="rounded-lg bg-white p-8">
          <ClipLoader color="#FFB800" size={40} />
        </div>
      </div>
    );
  }

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
                  <h1 className="text-4xl font-semibold">Edit Group</h1>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto">
              <div className="flex flex-col space-y-24">
                <div className="flex flex-col">
                  <div className="mb-6">
                    <div
                      className="relative mb-4 flex h-28 w-28 cursor-pointer items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
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
                      ) : currentImageUrl ? (
                        <img
                          src={currentImageUrl}
                          alt="Group"
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <ImagePlus className="h-8 w-8 text-gray-400" />
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

                  <div className="w-1/2 space-y-6">
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
                        {["English", "Spanish", "English-Spanish Exchange"].map(
                          (lang) => (
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
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex justify-between gap-4">
                  <button
                    onClick={() => navigate(-1)}
                    className="rounded-full border border-[#5d5d5d] bg-white px-10 py-3 text-xl font-medium text-[#042f0c]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateGroup}
                    disabled={
                      loading ||
                      !groupName ||
                      !groupDescription ||
                      !learningLanguage
                    }
                    className="rounded-full border border-[#5d5d5d] bg-[#14b82c] px-10 py-3 text-xl font-medium text-[#042f0c] disabled:border-[#b0b0b0] disabled:bg-[#b9f9c2] disabled:text-[#b0b0b0]"
                  >
                    {loading ? "Updating..." : "Update Group"}
                  </button>
                </div>
              </div>
            </div>
          </div>{" "}
        </div>
      </div>
    </div>
  );
};

export default EditGroupsTutor;
