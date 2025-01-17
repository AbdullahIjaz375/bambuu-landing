import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  EllipsisVertical,
  Heart,
  Trash2,
  Share2,
  X,
} from "lucide-react";
import { Menu } from "@mantine/core";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Modal from "react-modal";
import { ClipLoader } from "react-spinners";
import EmptyState from "../../components/EmptyState";

Modal.setAppElement("#root");

const SavedResources = () => {
  const { user, setUser } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);

  // Fetch saved resources from user data
  useEffect(() => {
    const fetchResources = async () => {
      try {
        if (user?.uid) {
          const userRef = doc(db, "students", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.savedDocuments) {
              setResources(userData.savedDocuments);
            }
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching resources:", error);
        // toast.error("Failed to load resources");
        setLoading(false);
      }
    };

    fetchResources();
  }, [user?.uid]);

  const toggleFavorite = async (document) => {
    if (!user?.uid) return;

    try {
      const studentRef = doc(db, "students", user.uid);
      const updatedDocument = { ...document, isFavorite: !document.isFavorite };

      await updateDoc(studentRef, {
        savedDocuments: arrayRemove(document),
      });
      await updateDoc(studentRef, {
        savedDocuments: arrayUnion(updatedDocument),
      });

      // Update local state
      const updatedResources = resources.map((res) =>
        res.docId === document.docId ? updatedDocument : res
      );
      setResources(updatedResources);

      // Update context and session storage
      const updatedUser = {
        ...user,
        savedDocuments: updatedResources,
      };
      setUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Error updating favorite status:", error);
    }
  };

  const deleteResource = async (document) => {
    if (!user?.uid) return;

    try {
      const studentRef = doc(db, "students", user.uid);
      await updateDoc(studentRef, {
        savedDocuments: arrayRemove(document),
      });

      // Update local state
      const updatedResources = resources.filter(
        (res) => res.docId !== document.docId
      );
      setResources(updatedResources);

      // Update context and session storage
      const updatedUser = {
        ...user,
        savedDocuments: updatedResources,
      };
      setUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));

      // Close modal after successful deletion
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error deleting resource:", error);
    }
  };

  const handleCardClick = (url) => {
    window.open(url, "_blank");
  };

  const openDeleteModal = (resource, e) => {
    e.stopPropagation();
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  const ResourceCard = ({ resource }) => (
    <div className="relative group cursor-pointer transition-transform hover:scale-[1.02]">
      <div
        className="flex items-center p-4 bg-[#f0fdf1] rounded-2xl border border-[#16bc2e]"
        onClick={() => handleCardClick(resource.documentUrl)}
      >
        <div className="flex items-center flex-1 gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-[#fffbc5] rounded-3xl">
            <img
              src={
                resource.documentType.toLowerCase() === "pdf"
                  ? "/images/pdf.png"
                  : "/images/document.png"
              }
              alt={resource.documentType}
              className="w-6 h-auto"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{resource.documentName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-md text-[#3d3d3d]">
                {resource.createdAt?.toDate().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Menu shadow="md" width={160} position="bottom-end">
            <Menu.Target>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100"
              >
                <EllipsisVertical />
              </button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                icon={
                  <Heart
                    className={`w-4 h-4 ${
                      resource.isFavorite ? "text-red-500 fill-current" : ""
                    }`}
                  />
                }
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(resource);
                }}
                className="font-urbanist"
              >
                {resource.isFavorite
                  ? "Remove from favorites"
                  : "Add to favorites"}
              </Menu.Item>

              <Menu.Item
                icon={<Trash2 className="w-4 h-4 text-red-500" />}
                onClick={(e) => openDeleteModal(resource, e)}
                className="text-red-500 font-urbanist"
              >
                Remove Resource
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </div>
    </div>
  );

  const filteredResources = resources.filter((resource) =>
    resource.documentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} />
        <div className="flex items-center justify-center flex-1">
          <ClipLoader color="#14B82C" size={50} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} />
        <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
          <div className="flex items-center justify-between pb-4 mb-6 border-b">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-semibold">Saved Resources</h1>
            </div>
            <div className="relative flex-1 max-w-2xl ml-8">
              <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
              <input
                type="text"
                placeholder="Search resource by name"
                className="w-full py-3 pl-12 pr-4 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredResources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[70vh]">
              <EmptyState
                message={
                  searchQuery ? "No results found." : "No resources yet."
                }
              />
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h2 className="mb-4 text-2xl font-bold">Favorite Resources</h2>
                <div className="grid grid-cols-3 gap-4">
                  {filteredResources
                    .filter((r) => r.isFavorite)
                    .map((resource) => (
                      <ResourceCard key={resource.docId} resource={resource} />
                    ))}
                </div>
              </div>

              <div>
                <div className="flex flex-row items-center justify-between">
                  <h2 className="mb-4 text-2xl font-bold">More Resources</h2>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {filteredResources
                    .filter((r) => !r.isFavorite)
                    .map((resource) => (
                      <ResourceCard key={resource.docId} resource={resource} />
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="absolute p-6 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg rounded-3xl top-1/2 left-1/2 font-urbanist"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center w-16 h-16 mb-4 bg-yellow-100 rounded-full">
            <img alt="empty state" src="/images/no_saved.png" />
          </div>

          <h2 className="mb-2 text-xl font-bold">
            Are you sure you want to remove this resource?
          </h2>
          <p className="mb-6 text-gray-600">This is irreversible action!</p>

          <div className="flex gap-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-8 py-2 border border-black rounded-full hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteResource(selectedResource)}
              className="px-8 py-2 text-black bg-red-500 border border-black rounded-full hover:bg-red-600"
            >
              Yes, Remove
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SavedResources;
