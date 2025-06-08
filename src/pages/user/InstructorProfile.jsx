import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ChannelType, fetchChatToken, streamClient } from "../../config/stream";
import { createStreamChannel } from "../../services/streamService";
import { getTutorProfile } from "../../api/examPrepApi";
import { ClipLoader } from "react-spinners";

const InstructorProfile = ({
  selectedInstructor,
  setSelectedInstructor,
  onBookIntroCall,
  onBookClass,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [tutorProfile, setTutorProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (!selectedInstructor) {
      setTutorProfile(null);
      return;
    }
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const res = await getTutorProfile(
          selectedInstructor.id || selectedInstructor.uid,
        );
        setTutorProfile(res.tutor);
      } catch (err) {
        setTutorProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [selectedInstructor]);

  if (!selectedInstructor) return null;

  const sendMessageClicked = async () => {
    if (isCreatingChannel) return;
    setIsCreatingChannel(true);
    try {
      let otherUserName = selectedInstructor.name || "Tutor";
      let otherUserImage = selectedInstructor.photoUrl || "";
      const tutorId = selectedInstructor.id || selectedInstructor.uid;
      const channelId = `${user.uid}${tutorId}`;
      const channelName = otherUserName;
      const memberRoles = [
        { user_id: user.uid, role: "member" },
        { user_id: tutorId, role: "member" },
      ];
      const channelData = {
        id: channelId,
        type: ChannelType.ONE_TO_ONE_CHAT,
        members: [user.uid, tutorId],
        name: channelName,
        image: otherUserImage,
        description: "",
        created_by_id: user.uid,
        member_roles: memberRoles,
      };

      if (streamClient.userID !== user.uid || !streamClient.isConnected) {
        const token = await fetchChatToken(user.uid);
        if (streamClient.userID) {
          await streamClient.disconnectUser();
        }
        await streamClient.connectUser(
          {
            id: user.uid,
            name: user.name || "",
            image: user.photoUrl || "",
            userType: user.userType || "student",
          },
          token,
        );
      }

      const channel = await createStreamChannel(channelData);

      let found = false;
      for (let i = 0; i < 5; i++) {
        const channels = await streamClient.queryChannels(
          { members: { $in: [user.uid] }, id: { $eq: channel.id } },
          { last_message_at: -1 },
          { watch: true, state: true },
        );
        if (channels.length > 0) {
          found = true;
          break;
        }
        await new Promise((res) => setTimeout(res, 500));
      }

      const currentMembers = Object.keys(channel.state?.members || {});
      const missingMembers = [user.uid, tutorId].filter(
        (m) => !currentMembers.includes(m),
      );
      if (missingMembers.length > 0) {
        await channel.addMembers(missingMembers);
      }

      navigate(`/messagesUser/${channel.id}`);
    } catch (error) {
      console.error("Error creating chat channel:", error);
    } finally {
      setIsCreatingChannel(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={!!selectedInstructor}
        onRequestClose={() => setSelectedInstructor(null)}
        className="custom-modal-content fixed left-1/2 top-1/2 flex w-[468px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-[2.5rem] border border-blue-200 bg-white p-0 font-urbanist shadow-xl outline-none"
        overlayClassName="custom-modal-overlay fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center"
        ariaHideApp={false}
      >
        <div className="relative flex w-full items-center justify-between px-6 pb-1 pt-4">
          <span className="text-2xl font-medium text-black">
            Exam Preparation Package
          </span>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F6F6F6] hover:bg-[#ededed]"
            onClick={() => setSelectedInstructor(null)}
          >
            <X className="h-6 w-6 text-[#3D3D3D]" />
          </button>
        </div>
        {/* Main Card */}
        <div className="mx-6 my-6 flex w-[calc(100%-3rem)] flex-1 flex-col items-center rounded-[2rem] bg-[#E6FDE9] px-6 py-5">
          <img
            src={selectedInstructor.photoUrl || "/images/panda.png"}
            alt={selectedInstructor.name}
            className="mb-2 mt-1 h-24 w-24 rounded-full border-4 border-white object-cover shadow"
          />
          <div className="mb-1 text-center text-xl font-semibold">
            {selectedInstructor.name}
          </div>
          <div className="my-2 text-center text-sm text-[#042F0C]">
            {selectedInstructor.bio}
          </div>
          <div className="mb-3 flex w-full justify-between text-sm">
            <div>
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  <img
                    src="/svgs/language.svg"
                    alt="language"
                    className="inline-block"
                  />{" "}
                  Native:
                </span>
                <span>{selectedInstructor.nativeLanguage || "N/A"}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  <img
                    src="/svgs/language.svg"
                    alt="language"
                    className="inline-block"
                  />{" "}
                  Teaching:
                </span>
                <span>{selectedInstructor.teachingLanguage || "N/A"}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1">
                <img
                  src="/svgs/location.svg"
                  alt="location"
                  className="inline-block"
                />
                <span>From: {selectedInstructor.country || "N/A"}</span>
              </div>
              <div className="flex items-center gap-1">
                <img
                  src="/svgs/users.svg"
                  alt="students"
                  className="inline-block"
                />
                <span>
                  Students: {selectedInstructor.tutorStudentIds?.length || 0}
                </span>
              </div>
            </div>
          </div>
          {/* Video Section */}
          <div className="mb-4 flex min-h-[176px] w-full items-center justify-center rounded-2xl border border-dashed bg-white py-4 text-center text-[#D1D1D1]">
            {loadingProfile ? (
              <div className="flex h-[176px] w-full items-center justify-center">
                <ClipLoader color="#14B82C" size={40} />
              </div>
            ) : (
              <div className="aspect-video w-full max-w-[400px] overflow-hidden rounded-2xl">
                <iframe
                  width="100%"
                  height="100%"
                  style={{
                    minHeight: 176,
                    aspectRatio: "16/9",
                    borderRadius: "1rem",
                    border: "none",
                    background: "#000",
                  }}
                  src={(() => {
                    const link = tutorProfile?.videoLink;
                    if (link) {
                      // Convert to embed format
                      let videoId = null;
                      const regExp =
                        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
                      const match = link.match(regExp);
                      videoId = match ? match[1] : null;
                      if (videoId) {
                        return `https://www.youtube.com/embed/${videoId}`;
                      }
                    }
                    return "https://www.youtube.com/embed/W8qJOBrmNkw";
                  })()}
                  title="Instructor Introduction Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </div>
          {/* Buttons */}
          <button
            className="mb-2 w-full rounded-full border border-[#D7D7D7] bg-[#FFFDEB] py-3 text-base font-medium transition hover:bg-[#f7f7e6]"
            onClick={sendMessageClicked}
            disabled={isCreatingChannel}
          >
            {isCreatingChannel ? "Processing" : "Send Message"}
          </button>
        </div>
        <div className="mx-6 my-6 w-[calc(100%-3rem)]">
          <button
            onClick={() => {
              setSelectedInstructor(null);
              onBookIntroCall ? onBookIntroCall() : onBookClass();
            }}
            className="w-full rounded-full border border-[#042F0C] bg-[#14B82C] py-3 text-base font-medium text-black transition hover:bg-[#129e25]"
          >
            {onBookIntroCall
              ? "Book Introductory Call:"
              : "Book Exam Preparation Classes "}
          </button>
        </div>
      </Modal>
    </>
  );
};

export default InstructorProfile;
