import React, { useEffect, useState, useRef } from "react";
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";

import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, storage } from "../../firebaseConfig";
import Modal from "react-modal";
import EmptyState from "../../components/EmptyState";
import { ClipLoader } from "react-spinners";

Modal.setAppElement("#root");

const SavedResourcesTutor = () => {
  const { t } = useTranslation();

  const { user, setUser } = useAuth();
  const [resources, setResources] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchTutorResourcesAndStudents = async () => {
      if (!user?.uid) return;

      try {
        // Fetch tutor data including resources and student IDs
        const tutorDoc = await getDoc(doc(db, "tutors", user.uid));
        if (tutorDoc.exists()) {
          const tutorData = tutorDoc.data();
          const savedDocs = tutorData.savedDocuments || [];
          setResources(savedDocs);

          console.log(tutorData);

          // Fetch students based on tutorStudentIds
          const studentIds = tutorData.tutorStudentIds || [];
          const studentsData = [];

          // Batch fetch students
          for (const studentId of studentIds) {
            const studentDoc = await getDoc(doc(db, "students", studentId));
            if (studentDoc.exists()) {
              studentsData.push({
                id: studentDoc.id,
                ...studentDoc.data(),
              });
            }
          }

          setStudents(studentsData);
        }
      } catch (error) {
        console.error("Error fetching tutor resources and students:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorResourcesAndStudents();
  }, [user?.uid]);

  const toggleFavorite = async (document) => {
    if (!user?.uid) return;

    try {
      const tutorRef = doc(db, "tutors", user.uid);
      const updatedDocument = { ...document, isFavorite: !document.isFavorite };

      await updateDoc(tutorRef, {
        savedDocuments: arrayRemove(document),
      });
      await updateDoc(tutorRef, {
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
      const tutorRef = doc(db, "tutors", user.uid);
      await updateDoc(tutorRef, {
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
    } catch (error) {
      console.error("Error deleting resource:", error);
    }
  };

  const assignResource = (resource) => {
    setSelectedResource(resource);
    setIsAssignModalOpen(true);
  };

  const handleAssign = async () => {
    try {
      // Update each selected student's savedDocuments
      for (const studentId of selectedStudents) {
        const studentRef = doc(db, "students", studentId);
        const documentWithTimestamp = {
          ...selectedResource,
          createdAt: serverTimestamp(), // Add new timestamp when assigning
        };

        await updateDoc(studentRef, {
          savedDocuments: arrayUnion(documentWithTimestamp),
        });
      }

      // Close modal and reset state
      setIsAssignModalOpen(false);
      setSelectedStudents([]);
      setStudentSearchQuery("");

      // Optional: Show success message
      toast.success(
        `Resource assigned to ${selectedStudents.length} student${
          selectedStudents.length > 1 ? "s" : ""
        }`
      );
    } catch (error) {
      console.error("Error assigning resource to students:", error);
      toast.error("Failed to assign resource. Please try again.");
    }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };
  const openDeleteModal = (resource, e) => {
    e.stopPropagation();
    setSelectedResource(resource);
    setIsModalOpen(true);
  };
  const handleCardClick = (url) => {
    window.open(url, "_blank");
  };

  //---------------------------------------------uploading---------------------------------------//
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !user?.uid) return;

    setIsUploading(true);
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `${file.name
        .split(".")[0]
        .toLowerCase()
        .replace(/\s+/g, "")}%${timestamp}`;
      const fileType = file.name.split(".").pop().toUpperCase();

      // Upload to Firebase Storage
      const storageRef = ref(
        storage,
        `tutors/${user.uid}/resources/${fileName}`
      );
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Create document object
      const newDocument = {
        docId: fileName,
        documentName: file.name.split(".")[0],
        documentType: fileType,
        documentUrl: downloadURL,
        createdAt: serverTimestamp(), // Use serverTimestamp for new documents
        isFavorite: false,
      };

      // Update Firestore
      const tutorRef = doc(db, "tutors", user.uid);
      await updateDoc(tutorRef, {
        savedDocuments: arrayUnion(newDocument),
      });

      // Update local state
      setResources((prev) => [...prev, newDocument]);

      // Update context and session storage
      const updatedUser = {
        ...user,
        savedDocuments: [...resources, newDocument],
      };
      setUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Resource uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  //-------------------------------------------------------------------------------------------------//

  const filteredStudents = students.filter((student) =>
    student.name?.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  const filteredResources = resources.filter((resource) =>
    resource.documentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ResourceCard = ({ resource }) => (
    <div className="relative cursor-pointer group">
      <div
        className="flex items-center p-2 bg-[#f0fdf1] rounded-2xl border border-[#16bc2e]"
        onClick={() => handleCardClick(resource.documentUrl)}
      >
        <div className="flex items-center flex-1 gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-[#fffbc5] rounded-3xl">
            <img
              src={
                resource.documentType.toLowerCase() === "pdf"
                  ? "/svgs/png-logo.svg"
                  : "/svgs/word-logo.svg"
              }
              alt={resource.documentType}
              className="w-6 h-auto"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{resource.documentName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-md text-[#3d3d3d]">
                Uploaded: {resource.createdAt?.toDate().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Menu shadow="md" width={180} radius="lg" position="bottom-end">
            <Menu.Target>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center w-8 h-8"
              >
                <EllipsisVertical className="text-gray-400" />
              </button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                onClick={(e) => {
                  e.stopPropagation();
                  assignResource(resource);
                }}
                color="green"
                className="font-urbanist"
              >
                {t("saved-resources-tutor.menu.assign")}
              </Menu.Item>

              <Menu.Item
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(resource);
                }}
                className="font-urbanist"
              >
                {resource.isFavorite
                  ? t("saved-resources-tutor.menu.remove-favorite")
                  : t("saved-resources-tutor.menu.add-favorite")}
              </Menu.Item>

              <Menu.Item
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteModal(resource, e);
                }}
                className="font-urbanist"
                color="red"
              >
                {t("saved-resources-tutor.menu.delete")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </div>
    </div>
  );

  const EmptyStateCustom = () => (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <EmptyState
        message={
          searchQuery
            ? t("saved-resources-tutor.empty-state.no-results")
            : t("saved-resources-tutor.empty-state.no-resources")
        }
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
      />
      <button
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="px-3 py-2 text-[#042f0c] text-lg my-2 font-semibold bg-[#E6FDE9] border border-black rounded-full flex items-center"
      >
        {isUploading ? (
          <div className="w-5 h-5 mr-2 border-2 border-white rounded-full animate-spin border-t-transparent" />
        ) : (
          <Plus />
        )}
        {isUploading
          ? t("saved-resources-tutor.buttons.uploading")
          : t("saved-resources-tutor.buttons.add-resource")}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} />
        <div className="flex items-center justify-center flex-1">
          <ClipLoader color="#FFB800" size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <div className="flex-shrink-0 w-64 h-full">
        <Sidebar user={user} />
      </div>

      <div className="flex-1 overflow-x-auto min-w-[calc(100%-16rem)] h-full">
        <div className="h-[calc(100vh-1rem)] p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl m-2 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 pb-4 mb-6 border-b md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-semibold whitespace-nowrap">
                {t("saved-resources-tutor.title")}
              </h1>
            </div>
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
              <input
                type="text"
                placeholder={t("saved-resources-tutor.search.placeholder")}
                className="w-full py-3 pl-12 pr-4 border border-gray-200 rounded-3xl  focus:border-[#14B82C] focus:ring-0 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Content */}
          {filteredResources.length === 0 ? (
            <EmptyStateCustom />
          ) : (
            <div className="space-y-8">
              {/* Favorites Section */}
              <div>
                <h2 className="mb-4 text-2xl font-bold">
                  {t("saved-resources-tutor.sections.favorites")}
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResources
                    .filter((r) => r.isFavorite)
                    .map((resource) => (
                      <ResourceCard key={resource.docId} resource={resource} />
                    ))}
                </div>
              </div>

              {/* More Resources Section */}
              <div>
                <div className="flex flex-col items-start justify-between mb-4 sm:flex-row sm:items-center">
                  <h2 className="mb-2 text-2xl font-bold sm:mb-0">
                    {t("saved-resources-tutor.sections.more")}
                  </h2>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                  />
                  <button
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 text-[#042f0c] text-lg font-semibold bg-[#14b82c] border border-black rounded-full flex items-center w-full sm:w-auto justify-center sm:justify-start"
                  >
                    {isUploading ? (
                      <div className="w-5 h-5 mr-2 border-2 border-white rounded-full animate-spin border-t-transparent" />
                    ) : (
                      <Plus className="mr-2" />
                    )}
                    {isUploading
                      ? t("saved-resources-tutor.buttons.uploading")
                      : t("saved-resources-tutor.buttons.add-resource")}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Modal
        isOpen={isAssignModalOpen}
        onRequestClose={() => setIsAssignModalOpen(false)}
        className="absolute font-urbanist top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 w-96 max-h-[90vh] overflow-hidden"
        overlayClassName="fixed inset-0 bg-black bg-opacity-25"
      >
        <div className="flex items-center justify-between mb-6">
          {t("saved-resources-tutor.assign-modal.title")}
          <button
            onClick={() => setIsAssignModalOpen(false)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            placeholder={t(
              "saved-resources-tutor.assign-modal.search-placeholder"
            )}
            className="w-full py-3 pl-12 pr-4 border border-gray-200 rounded-3xl  focus:border-[#14B82C] focus:ring-0 focus:outline-none"
            value={studentSearchQuery}
            onChange={(e) => setStudentSearchQuery(e.target.value)}
          />
        </div>

        {selectedStudents.length > 0 && (
          <div className="mb-2 text-sm text-gray-600">
            {t("saved-resources-tutor.assign-modal.selected-count", {
              count: selectedStudents.length,
            })}
          </div>
        )}

        <div className="overflow-y-auto max-h-[300px] mb-4 scrollbar-hide">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              onClick={() => toggleStudent(student.id)}
              className={`flex items-center p-3 rounded-xl cursor-pointer mb-2 
                  ${
                    selectedStudents.includes(student.id)
                      ? "bg-[#f0fdf1]"
                      : "hover:bg-gray-50"
                  }`}
            >
              <img
                src={student.photoUrl}
                alt={student.name}
                className="w-8 h-8 mr-3 rounded-full"
              />
              <span className="font-medium">{student.name}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsAssignModalOpen(false)}
            className="flex-1 px-6 py-2 font-medium border border-black rounded-full"
          >
            {t("saved-resources-tutor.assign-modal.buttons.cancel")}
          </button>
          <button
            onClick={handleAssign}
            disabled={selectedStudents.length === 0}
            className={`flex-1 py-2 border border-black px-6 rounded-full font-medium text-black
                ${
                  selectedStudents.length === 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#14b82c] hover:bg-[#129526]"
                }`}
          >
            {t("saved-resources-tutor.assign-modal.buttons.assign")}
          </button>
        </div>
      </Modal>

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
            {t("saved-resources-tutor.delete-modal.title")}
          </h2>
          <p className="mb-6 text-gray-600">
            {" "}
            {t("saved-resources-tutor.delete-modal.subtitle")}
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-8 py-2 border border-black rounded-full hover:bg-gray-50"
            >
              {t("saved-resources-tutor.delete-modal.buttons.cancel")}
            </button>
            <button
              onClick={() => deleteResource(selectedResource)}
              className="px-8 py-2 text-black bg-red-500 border border-black rounded-full hover:bg-red-600"
            >
              {t("saved-resources-tutor.delete-modal.buttons.confirm")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SavedResourcesTutor;
