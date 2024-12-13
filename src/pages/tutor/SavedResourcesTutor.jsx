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

Modal.setAppElement("#root");

const SavedResourcesTutor = () => {
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
        await updateDoc(studentRef, {
          savedDocuments: arrayUnion(selectedResource),
        });
      }

      // Close modal and reset state
      setIsAssignModalOpen(false);
      setSelectedStudents([]);
      setStudentSearchQuery("");

      // Optional: Show success message
      alert("Resource assigned successfully!");
    } catch (error) {
      console.error("Error assigning resource to students:", error);
      alert("Error assigning resource. Please try again.");
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

  const filteredStudents = students.filter((student) =>
    student.name?.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  const filteredResources = resources.filter((resource) =>
    resource.documentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                onClick={(e) => {
                  e.stopPropagation();
                  assignResource(resource);
                }}
                color="green"
                className="font-urbanist"
              >
                Assign Resource
              </Menu.Item>

              <Menu.Item
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
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteModal(resource, e);
                }}
                className="font-urbanist"
                color="red"
              >
                Delete Resource
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <div className="flex items-center justify-center w-16 h-16 mb-4 bg-yellow-100 rounded-full">
        <img alt="bambuu" src="/images/no_saved.png" />
      </div>
      <p className="text-gray-600">You've not saved any resources yet!</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} />
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#16bc2e] border-t-transparent"></div>
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
            <h1 className="text-4xl font-semibold">Resources</h1>
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
          <EmptyState />
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
                <button
                  disabled={loading}
                  className="px-3 py-2 text-[#042f0c] text-lg font-semibold bg-[#14b82c] border border-black rounded-full flex items-center"
                >
                  <Plus /> Add Resource
                </button>
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

        <Modal
          isOpen={isAssignModalOpen}
          onRequestClose={() => setIsAssignModalOpen(false)}
          className="absolute font-urbanist top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 w-96 max-h-[90vh] overflow-hidden"
          overlayClassName="fixed inset-0 bg-black bg-opacity-25"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Assign Resource</h2>
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
              placeholder="Search student by name"
              className="w-full py-3 pl-10 pr-4 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
            />
          </div>

          {selectedStudents.length > 0 && (
            <div className="mb-2 text-sm text-gray-600">
              {selectedStudents.length} Selected Students
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
                  src="/api/placeholder/32/32"
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
              Cancel
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
              Assign
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
              Are you sure you want to delete this resource?
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
                Yes, Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default SavedResourcesTutor;
