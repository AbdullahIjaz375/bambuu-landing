import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft } from "lucide-react";
import Sidebar from "../../components/Sidebar";

const AboutBambuuUser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      <div className="h-full w-[272px] flex-shrink-0 p-4">
        <Sidebar user={user} />
      </div>

      <div className="min-w-[calc(100% - 272px)] h-[calc(100vh-0px)] flex-1 overflow-x-auto p-4 pl-0">
        <div className="h-[calc(100vh-32px)] overflow-y-auto rounded-3xl border border-[#e7e7e7] bg-white p-[16px]">
          {/* Header */}
          <div className="mb-12 flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              <button
                className="rounded-full bg-gray-100 p-3"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="text-4xl font-semibold">About bammbuu</h1>
            </div>
          </div>{" "}
          <div>
            <h1 className="text-xl text-[#3D3D3D]">
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

export default AboutBambuuUser;
