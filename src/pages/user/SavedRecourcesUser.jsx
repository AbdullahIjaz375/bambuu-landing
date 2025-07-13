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
import { useTranslation } from "react-i18next";
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
  serverTimestamp,
  Timestamp,
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
  const { t } = useTranslation();
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
      const updatedDocument = {
        ...document,
        isFavorite: !document.isFavorite,
        createdAt: document.createdAt || serverTimestamp(), // Preserve existing timestamp or create new one
      };

      await updateDoc(studentRef, {
        savedDocuments: arrayRemove(document),
      });
      await updateDoc(studentRef, {
        savedDocuments: arrayUnion(updatedDocument),
      });

      // Update local state
      const updatedResources = resources.map((res) =>
        res.docId === document.docId ? updatedDocument : res,
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
        (res) => res.docId !== document.docId,
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

  const ResourceCard = ({
    resource,
    toggleFavorite,
    openDeleteModal,
    handleCardClick,
  }) => (
    <div className="group relative cursor-pointer">
      <div
        className="flex items-center rounded-2xl border border-[#16bc2e] bg-[#f0fdf1] p-3"
        onClick={() => handleCardClick(resource.documentUrl)}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-3xl bg-[#fffbc5]">
            <img
              src={
                resource.documentType.toLowerCase() === "pdf"
                  ? "/svgs/png-logo.svg"
                  : "/svgs/word-logo.svg"
              }
              alt={resource.documentType}
              className="h-auto w-6"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xl font-semibold">
              {resource.documentName}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-md text-[#3d3d3d]">
                Uploaded:{" "}
                {resource.createdAt?.toDate
                  ? resource.createdAt.toDate().toLocaleDateString()
                  : "Date not available"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <Menu shadow="md" width={180} position="bottom-end" radius="lg">
            <Menu.Target>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex h-8 w-8 items-center justify-center"
              >
                <EllipsisVertical className="text-gray-400" />
              </button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                icon={
                  <Heart
                    className={`h-4 w-4 ${
                      resource.isFavorite ? "fill-current text-red-500" : ""
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
                icon={<Trash2 className="h-4 w-4 text-red-500" />}
                onClick={(e) => openDeleteModal(resource, e)}
                className="font-urbanist text-red-500"
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
    resource.documentName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <div className="h-full w-[272px] flex-shrink-0 p-4">
          <Sidebar user={user} />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <ClipLoader color="#14B82C" size={50} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-white">
        <div className="h-full w-[272px] flex-shrink-0 p-4">
          <Sidebar user={user} />
        </div>

        <div className="min-w-[calc(100% - 272px)] h-[calc(100vh-0px)] flex-1 overflow-x-auto p-4 pl-0">
          <div className="h-[calc(100vh-32px)] overflow-y-auto rounded-3xl border border-[#e7e7e7] bg-white p-[16px]">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <h1 className="whitespace-nowrap text-4xl font-semibold">
                  {t("saved-resources.title")}
                </h1>
              </div>
              <div className="relative ml-8 max-w-2xl flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("saved-resources.search.placeholder")}
                  className="w-full rounded-3xl border border-gray-200 py-3 pl-12 pr-4 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Content */}
            {filteredResources.length === 0 ? (
              <div className="flex h-[70vh] flex-col items-center justify-center">
                <EmptyState
                  message={t(
                    searchQuery
                      ? "saved-resources.empty-state.no-results"
                      : "saved-resources.empty-state.no-resources",
                  )}
                />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Favorites Section */}
                <div>
                  <h2 className="mb-4 text-2xl font-bold">
                    {t("saved-resources.sections.favorites")}
                  </h2>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {filteredResources
                      .filter((r) => r.isFavorite)
                      .map((resource) => (
                        <ResourceCard
                          key={resource.docId}
                          resource={resource}
                          toggleFavorite={toggleFavorite}
                          openDeleteModal={openDeleteModal}
                          handleCardClick={handleCardClick}
                        />
                      ))}
                  </div>
                </div>

                {/* More Resources Section */}
                <div>
                  <div className="flex flex-row items-center justify-between">
                    <h2 className="mb-4 text-2xl font-bold">
                      {t("saved-resources.sections.more")}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {filteredResources
                      .filter((r) => !r.isFavorite)
                      .map((resource) => (
                        <ResourceCard
                          key={resource.docId}
                          resource={resource}
                          toggleFavorite={toggleFavorite}
                          openDeleteModal={openDeleteModal}
                          handleCardClick={handleCardClick}
                        />
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Modal */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          className="absolute left-1/2 top-1/2 w-[400px] -translate-x-1/2 -translate-y-1/2 transform rounded-3xl bg-white p-6 font-urbanist shadow-lg"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50"
        >
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <img alt="empty state" src="/images/no_saved.png" />
            </div>
            <h2 className="mb-2 text-xl font-bold">
              {t("saved-resources.delete-modal.title")}
            </h2>
            <p className="mb-6 text-center text-gray-600">
              {t("saved-resources.delete-modal.description")}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border border-black px-8 py-2 transition-colors hover:bg-gray-50"
              >
                {t("saved-resources.delete-modal.cancel")}
              </button>
              <button
                onClick={() => deleteResource(selectedResource)}
                className="rounded-full border border-red-500 bg-red-500 px-8 py-2 text-white transition-colors hover:bg-red-600"
              >
                {t("saved-resources.delete-modal.confirm")}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default SavedResources;
