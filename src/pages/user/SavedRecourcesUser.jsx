import React, { useEffect, useRef, useState } from "react";
import { Search, ArrowLeft, RotateCw, Send, Ellipsis } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";

const SavedRecourcesUser = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user} />

      <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        <div className="flex items-center justify-between pb-4 mb-6 border-b">
          <h1 className="text-4xl font-semibold">Saved Resources</h1>
          <button className="p-3 text-xl font-medium text-black bg-gray-100 rounded-full">
            <RotateCw />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavedRecourcesUser;
