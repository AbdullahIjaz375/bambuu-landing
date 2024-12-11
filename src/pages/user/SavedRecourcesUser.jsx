import React, { useEffect, useRef, useState } from "react";
import { Search, ArrowLeft, RotateCw, Send, Ellipsis } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import { MoreVertical } from "lucide-react";

const SavedResources = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([
    {
      id: 1,
      name: "File Name",
      author: "Mike Jones",
      type: "pdf",
      favorite: true,
    },
    {
      id: 2,
      name: "File Name",
      author: "Mike Hussy",
      type: "pdf",
      favorite: true,
    },
    {
      id: 3,
      name: "File Name",
      author: "Mike Hussy",
      type: "pdf",
      favorite: true,
    },
    {
      id: 4,
      name: "File Name",
      author: "Mike Jones",
      type: "pdf",
      favorite: false,
    },
    {
      id: 5,
      name: "File Name",
      author: "Mike Jones",
      type: "pdf",
      favorite: false,
    },
    {
      id: 6,
      name: "File Name",
      author: "Mike Jones",
      type: "pdf",
      favorite: false,
    },
    {
      id: 7,
      name: "File Name",
      author: "Mike Jones",
      type: "pdf",
      favorite: false,
    },
    {
      id: 8,
      name: "File Name",
      author: "Mike Jones",
      type: "pdf",
      favorite: false,
    },
    {
      id: 9,
      name: "File Name",
      author: "Mike Jones",
      type: "pdf",
      favorite: false,
    },
  ]);

  const ResourceCard = ({ resource, showOptions = false }) => (
    <div className="relative group">
      <div className="flex items-center p-4 bg-[#f0fdf1] rounded-2xl border border-[#16bc2e]">
        <div className="flex items-center flex-1 gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-[#fffbc5] rounded-3xl">
            <img src="/images/pdf.png" alt="PDF" className="w-6 h-auto" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold">{resource.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-5 h-5 bg-gray-200 rounded-full" />
              <span className="text-sm text-[#3d3d3d]">{resource.author}</span>
            </div>
          </div>
        </div>
        <button className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
      {showOptions && (
        <div className="absolute right-2 top-12 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[160px] z-10">
          <button className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50">
            Add to Favorites
          </button>
          <button className="w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-gray-50">
            Remove Resource
          </button>
        </div>
      )}
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

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user} />
      <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        {" "}
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
            />
          </div>
        </div>
        {resources.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="mb-4 text-xl font-bold">Favorite Resources</h2>
              <div className="grid grid-cols-3 gap-4">
                {resources
                  .filter((r) => r.favorite)
                  .map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-bold">More Resources</h2>
              <div className="grid grid-cols-3 gap-4">
                {resources
                  .filter((r) => !r.favorite)
                  .map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedResources;
