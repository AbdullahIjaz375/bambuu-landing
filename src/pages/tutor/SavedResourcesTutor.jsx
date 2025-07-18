import { useEffect, useState, useRef } from "react";
import { Search, Plus, EllipsisVertical, X } from "lucide-react";
import { Menu } from "@mantine/core";
import { useAuth } from "../../context/AuthContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ToastContainer, toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from "firebase/firestore";
import { db, storage } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import Modal from "react-modal";
import Sidebar from "../../components/Sidebar";
import EmptyState from "../../components/EmptyState";
import "react-toastify/dist/ReactToastify.css";

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
      const tutorRef = doc(db, "tutors", user.uid);
      await updateDoc(tutorRef, {
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
          createdAt: Timestamp.now(), // Use Timestamp.now() instead of serverTimestamp()
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
        }`,
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
        : [...prev, studentId],
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
        `tutors/${user.uid}/resources/${fileName}`,
      );
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Create document object - use regular Timestamp instead of serverTimestamp
      const newDocument = {
        docId: fileName,
        documentName: file.name.split(".")[0],
        documentType: fileType,
        documentUrl: downloadURL,
        createdAt: Timestamp.now(), // Use Timestamp.now() instead of serverTimestamp()
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
    student.name?.toLowerCase().includes(studentSearchQuery.toLowerCase()),
  );

  const filteredResources = resources.filter((resource) =>
    resource.documentName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const ResourceCard = ({ resource }) => (
    <div className="group relative cursor-pointer">
      <div
        className="flex items-center rounded-2xl border border-[#16bc2e] bg-[#f0fdf1] p-2"
        onClick={() => handleCardClick(resource.documentUrl)}
      >
        <div className="flex flex-1 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-[#fffbc5]">
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
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{resource.documentName}</h3>
            <div className="mt-1 flex items-center gap-2">
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
                className="flex h-8 w-8 items-center justify-center"
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
    <div className="flex h-[70vh] flex-col items-center justify-center">
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
        className="my-2 flex items-center rounded-full border border-black bg-[#E6FDE9] px-3 py-2 text-lg font-semibold text-[#042f0c]"
      >
        {isUploading ? (
          <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
        <div className="h-full w-[272px] flex-shrink-0 p-4">
          <Sidebar user={user} />
        </div>
        <div className="flex flex-1 items-center justify-center">
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
          {/* Header */}
          <div className="mb-6 flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <h1 className="whitespace-nowrap text-4xl font-semibold">
                {t("saved-resources-tutor.title")}
              </h1>
            </div>
            <div className="relative max-w-2xl flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t("saved-resources-tutor.search.placeholder")}
                className="w-full rounded-3xl border border-gray-200 py-3 pl-12 pr-4 focus:border-[#14B82C] focus:outline-none focus:ring-0"
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
                <div className="mb-4 flex flex-col items-start justify-between sm:flex-row sm:items-center">
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
                    className="flex w-full items-center justify-center rounded-full border border-black bg-[#14b82c] px-3 py-2 text-lg font-semibold text-[#042f0c] sm:w-auto sm:justify-start"
                  >
                    {isUploading ? (
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
        className="absolute left-1/2 top-1/2 max-h-[90vh] w-96 -translate-x-1/2 -translate-y-1/2 transform overflow-hidden rounded-3xl bg-white p-6 font-urbanist"
        overlayClassName="fixed inset-0 bg-black bg-opacity-25"
      >
        <div className="mb-6 flex items-center justify-between">
          {t("saved-resources-tutor.assign-modal.title")}
          <button
            onClick={() => setIsAssignModalOpen(false)}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t(
              "saved-resources-tutor.assign-modal.search-placeholder",
            )}
            className="w-full rounded-3xl border border-gray-200 py-3 pl-12 pr-4 focus:border-[#14B82C] focus:outline-none focus:ring-0"
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

        <div className="scrollbar-hide mb-4 max-h-[300px] overflow-y-auto">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              onClick={() => toggleStudent(student.id)}
              className={`mb-2 flex cursor-pointer items-center rounded-xl p-3 ${
                selectedStudents.includes(student.id)
                  ? "bg-[#f0fdf1]"
                  : "hover:bg-gray-50"
              }`}
            >
              <img
                src={student.photoUrl}
                alt={student.name}
                className="mr-3 h-8 w-8 rounded-full"
              />
              <span className="font-medium">{student.name}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsAssignModalOpen(false)}
            className="flex-1 rounded-full border border-black px-6 py-2 font-medium"
          >
            {t("saved-resources-tutor.assign-modal.buttons.cancel")}
          </button>
          <button
            onClick={handleAssign}
            disabled={selectedStudents.length === 0}
            className={`flex-1 rounded-full border border-black px-6 py-2 font-medium text-black ${
              selectedStudents.length === 0
                ? "cursor-not-allowed bg-gray-300"
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
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-3xl bg-white p-6 font-urbanist shadow-lg"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <div className="flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
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
              className="rounded-full border border-black px-8 py-2 hover:bg-gray-50"
            >
              {t("saved-resources-tutor.delete-modal.buttons.cancel")}
            </button>
            <button
              onClick={() => deleteResource(selectedResource)}
              className="rounded-full border border-black bg-red-500 px-8 py-2 text-black hover:bg-red-600"
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
