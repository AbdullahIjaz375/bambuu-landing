import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";

import Sidebar from "../../components/Sidebar";

const TABS = ["App", "Account", "Notifications"];

const AboutBambuuTutor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-white lg:flex-row">
      <div className="w-full lg:w-64 lg:flex-shrink-0">
        <Sidebar user={user} />
      </div>

      <div className="flex-1 min-w-0 overflow-auto">
        <div className="h-[calc(100vh-1rem)] p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl m-2 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-12 border-b">
            <div className="flex items-center gap-4">
              <button
                className="p-3 bg-gray-100 rounded-full"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-4xl font-semibold">About bammbuu</h1>
            </div>
          </div>{" "}
          <div>
            <h1 className="text-[#3D3D3D] text-xl">
              Learning a new language? Need someone to practice with? bammbuu
              was created by language learners, for language learners. We
              believe that language is best learned through conversation and in
              community. With bammbuu you can connect with native speakers,
              practice conversation in a community, and learn from certified
              language instructors.bammbuu is a safe place to practice. For more
              information visit our{" "}
              <a
                href="https://www.bammbuu.co/"
                class="font-semibold text-green-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                website
              </a>
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutBambuuTutor;
