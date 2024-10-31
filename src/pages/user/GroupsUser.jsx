// GroupsUser.js
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext"; // Ensure this path is correct
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore"; // Import Firestore functionsimport { db } from "../../firebaseConfig";
import { Link } from "react-router-dom";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom"; // Import useNavigate

import { Select, Card, Text, Image, Group, Title, Button } from "@mantine/core";
import { db, storage } from "../../firebaseConfig";
import Modal from "react-modal";
import { ClipLoader } from "react-spinners";

Modal.setAppElement("#root");
const GroupsUser = () => {
  const { user, loading, setUser } = useAuth();
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    if (!loading && user) {
      if (user.joinedGroups && user.joinedGroups.length > 0) {
        const fetchGroups = async () => {
          const fetchedGroups = [];

          for (let groupId of user.joinedGroups) {
            const groupRef = doc(db, "groups", groupId);
            const groupDoc = await getDoc(groupRef);

            if (groupDoc.exists()) {
              fetchedGroups.push({ id: groupDoc.id, ...groupDoc.data() });
            }
          }

          setGroups(fetchedGroups);
          setFilteredGroups(fetchedGroups);
          setLoadingGroups(false);
        };

        fetchGroups();
      } else {
        // If joinedGroups is empty, directly stop loading
        setLoadingGroups(false);
      }
    }
  }, [loading, user]);

  const handleFilterChange = (value) => {
    setSelectedType(value);

    // Filter groups based on the selected type
    if (value === "all") {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter((group) => {
        // Ensure case-insensitive comparison
        console.log("Group Type in DB:", group.groupType); // Debugging line
        return group.groupType.toLowerCase() === value.toLowerCase();
      });
      setFilteredGroups(filtered);
    }
  };

  //------------------------------------------adding groups modal--------------------------------------//
  const [step, setStep] = useState(1); // Step for multi-step modal
  const [groupType, setGroupType] = useState(""); // English or Spanish
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [image, setImage] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const onRequestClose = () => {
    setModalOpen(false);
  };

  const onRequestOpen = () => {
    setModalOpen(true);
  };

  const handleImageUpload = async () => {
    if (!image) return null;
    const storageRef = ref(storage, `groups/${groupType}/${image.name}`);
    await uploadBytes(storageRef, image);
    return await getDownloadURL(storageRef);
  };

  const handleCreateGroup = async () => {
    setLoadingModal(true);
    try {
      const imageUrl = await handleImageUpload(); // Upload the image and get the URL

      const newGroup = {
        groupName,
        groupDescription,
        groupType,
        imageUrl,
        memberIds: [user.uid], // First member is the creator
        classIds: [],
        date: "",
        timeOfNextClass: "",
        lastLoggedIn: serverTimestamp(),
      };

      // Add the new group document and get the document ID
      const groupRef = await addDoc(collection(db, "groups"), newGroup);
      const groupId = groupRef.id;

      // Update the current user's document to add the new group ID to joinedGroups array
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        joinedGroups: [...(user.joinedGroups || []), groupId], // Append the new groupId
      });

      const updatedUser = {
        ...user,
        joinedGroups: [...(user.joinedGroups || []), groupId],
      };
      setUser(updatedUser); // Update context
      sessionStorage.setItem("user", JSON.stringify(updatedUser)); // Update session storage

      // Reset form fields and modal state after successful creation
      setStep(1);
      setGroupType("");
      setGroupName("");
      setGroupDescription("");
      setImage(null);
      setLoadingModal(false);
      onRequestClose(); // Close modal on successful creation
    } catch (error) {
      console.error("Error creating group:", error);
      setLoadingModal(false);
    }
  };

  const handleOpenGroup = (groupId) => {
    navigate(`/groupDetailUser/${groupId}`);
  };

  return (
    <>
      <div className="flex flex-col items-center w-full px-4 pt-10 pb-10">
        <Group position="apart" className="w-full max-w-3xl mb-4">
          <Title order={1} className="text-gray-800">
            Your Joined Groups
          </Title>

          <Button
            onClick={onRequestOpen}
            className="flex items-end justify-end"
            variant="filled"
            color="green"
          >
            Add Group
          </Button>

          {/* Mantine Select Filter */}
          <Select
            value={selectedType}
            onChange={handleFilterChange}
            data={[
              { value: "all", label: "All" },
              { value: "spanish", label: "Spanish" },
              { value: "english", label: "English" },
            ]}
            placeholder="Select Group Type"
            className="w-40"
          />
        </Group>

        <div className="flex flex-wrap items-center justify-center gap-6 py-5">
          {loadingGroups ? (
            <div className="flex items-center justify-center min-h-[70vh]">
              <ClipLoader color="#14B82C" size={50} />
            </div>
          ) : filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <Card
                key={group.id}
                shadow="sm"
                padding="lg"
                radius="md"
                className="flex-shrink-0 w-64"
              >
                <Card.Section>
                  <Image
                    src={group.imageUrl}
                    alt={group.groupName}
                    height={160}
                  />
                </Card.Section>
                <Text weight={500} size="lg" mt="md">
                  {group.groupName}
                </Text>
                <Text size="sm" color="dimmed" mt="xs">
                  {group.groupDescription}
                </Text>
                <Button
                  onClick={() => handleOpenGroup(group.id)}
                  className="mt-4 font-bold text-green-600 hover:underline"
                  variant="link"
                >
                  Open
                </Button>
              </Card>
            ))
          ) : (
            <p className="text-gray-500">
              You haven't joined any groups yet. Start by joining or creating a
              group!
            </p>
          )}
        </div>
      </div>
      <Modal
        isOpen={modalOpen}
        onRequestClose={onRequestClose}
        contentLabel="Create New Group"
        className="max-w-lg p-6 mx-auto bg-white rounded-lg shadow-lg outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        {step === 1 && (
          <div className="text-center">
            <h2 className="mb-4 text-lg font-semibold text-gray-700">
              Select Group Type
            </h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setGroupType("English");
                  setStep(2);
                }}
                className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none"
              >
                English
              </button>
              <button
                onClick={() => {
                  setGroupType("Spanish");
                  setStep(2);
                }}
                className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600 focus:outline-none"
              >
                Spanish
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Group Name
              </label>
              <input
                type="text"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-blue-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                placeholder="Enter group description"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-blue-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Group Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none"
              />
            </div>

            <button
              onClick={handleCreateGroup}
              disabled={
                !groupName || !groupDescription || !image || loadingModal
              }
              className={`w-full px-4 py-2 rounded text-white ${
                loadingModal ? "bg-gray-400" : "bg-teal-500 hover:bg-teal-600"
              } focus:outline-none focus:ring focus:ring-teal-200`}
            >
              {loadingModal ? "Creating Group..." : "Create Group"}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default GroupsUser;
