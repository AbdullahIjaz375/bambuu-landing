import React, { useEffect, useState } from "react";
import {
  Chat,
  Channel,
  Window,
  useChannelStateContext,
  MessageList,
  MessageInput,
  Thread,
} from "stream-chat-react";
import { useAuth } from "../context/AuthContext";
import "stream-chat-react/dist/css/v2/index.css";
import { ClipLoader } from "react-spinners";
import { MoreVertical } from "lucide-react";
import { useRef } from "react";
import {
  removeMemberFromStreamChannel,
  deleteStreamChannel,
} from "../services/streamService";
import { LogOut, Trash2 } from "lucide-react";
import Modal from "react-modal";
Modal.setAppElement("#root");

const INIT_TIMEOUT = 10000; // Increased timeout to 10s

// Add custom styles to override Stream Chat default styling
const customStyles = `
  .str-chat__message-textarea-container {
    // border-color: #1a472a !important;
    padding: 0.1rem 0 !important;
    margin: 0.7rem 0.1rem !important;
  }
  
  // .str-chat__send-button {
  //   background-color: #FFBF00 !important;
  // }

  // .str-chat__send-button svg {
  //   fill: #000000 !important;
  // }

  // .str-chat__send-button:disabled {
  //   background-color: #FFBF00 !important;
  //   opacity: 0.7;
  // }

  .str-chat__send-button:disabled svg {
    fill: #000000 !important;
  }

  .str-chat__file-input-label {
    border-radius: 50% !important;
    padding: 2px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .str-chat__file-input-label svg {
    width: 32px !important;
    height: 32px !important;
  }

  // .str-chat__message--me .str-chat__message-text {
  //   background-color: #90EE90 !important;
  //   border: 2px solid #1a472a !important;
  //   border-radius: 12px !important;
  // }

  // .str-chat__message--me .str-chat__message-text-inner {
  //   background: none !important;
  //   color: #1a472a !important;
  //   font-weight: 500 !important;
  // }
`;

const CustomChannelHeader = ({ onChannelLeave }) => {
  const { channel } = useChannelStateContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const dropdownRef = useRef(null);
  const user = JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLeaveChat = async () => {
    try {
      setIsLoading(true);
      const user = JSON.parse(sessionStorage.getItem("user"));

      if (!user || !user.uid) {
        throw new Error("User not found");
      }

      // Store channel ID before any operations
      const currentChannelId = channel.id;

      // Stop watching before any operations
      await channel.stopWatching();

      if (user.userType === "student") {
        await removeMemberFromStreamChannel({
          channelId: currentChannelId,
          userId: user.uid,
          type: channel.type,
        });
      } else if (user.userType === "tutor") {
        await deleteStreamChannel({
          channelId: currentChannelId,
          type: channel.type,
        });
      } else {
        throw new Error("Invalid user type");
      }

      // Update UI state after channel operations
      setShowDropdown(false);

      // Call onChannelLeave after all operations are complete
      if (onChannelLeave) {
        onChannelLeave(currentChannelId);
      }
    } catch (error) {
      console.error("Error leaving chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center px-6 py-4 bg-gray-100 border-b border-gray-200">
        <div className="flex-1 space-y-1">
          <div className="text-xl font-semibold text-[#3D3D3D]">
            {channel?.data?.name || "Untitled Channel"}
          </div>
          <div className="text-sm text-gray-500">
            <p className="text-sm text-gray-500 truncate">
              {channel.data.description
                ? channel.data.description.length > 40
                  ? channel.data.description.slice(0, 40) + "..."
                  : channel.data.description
                : "No description"}
            </p>
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            className="p-2 transition-colors rounded-full hover:bg-gray-200"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isLoading}
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 z-10 w-32 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
              <button
                className="w-full px-4 py-2 text-left text-[#3D3D3D] transition-colors hover:bg-gray-50"
                onClick={() => {
                  setShowConfirmModal(true);
                  setShowDropdown(false);
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center ">Processing...</div>
                ) : user?.userType === "tutor" ? (
                  <div className="flex items-center text-center text-red-500">
                    Delete Chat
                  </div>
                ) : (
                  <div className="flex items-center text-center text-red-500">
                    Leave Chat
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showConfirmModal}
        onRequestClose={() => setShowConfirmModal(false)}
        className="z-50 max-w-sm p-6 mx-auto mt-40 bg-white outline-none rounded-3xl font-urbanist"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        style={{
          overlay: {
            zIndex: 60,
          },
          content: {
            border: "none",
            padding: "24px",
            maxWidth: "420px",
            position: "relative",
            zIndex: 61,
          },
        }}
      >
        <div className="text-center">
          <h2 className="mb-4 text-xl font-semibold">
            {user?.userType === "tutor"
              ? "Are you sure you want to delete this chat?"
              : "Are you sure you want to leave this chat?"}
          </h2>
          <div className="flex flex-row gap-2">
            <button
              className="w-full py-2 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
              onClick={() => setShowConfirmModal(false)}
            >
              No, Cancel
            </button>
            <button
              className="w-full py-2 font-medium text-black bg-[#ff4d4d] rounded-full hover:bg-[#ff3333] border border-[#8b0000]"
              onClick={handleLeaveChat}
              disabled={isLoading}
            >
              {isLoading
                ? "Processing..."
                : user?.userType === "tutor"
                ? "Delete"
                : "Leave"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

const ChatComponent = ({ channelId, type, onChannelLeave }) => {
  const { streamClient, user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add this at the beginning of the ChatComponent
  useEffect(() => {
    if (streamClient?.disconnected) {
      streamClient.connectUser(
        { id: user.uid },
        streamClient.devToken(user.uid)
      );
    }
  }, [streamClient, user]);

  useEffect(() => {
    const initChannel = async () => {
      if (!channelId || !streamClient) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        if (!type) throw new Error("Channel type is required");

        if (streamClient.disconnected) {
          await streamClient.connectUser({ id: user.uid }, user.streamToken);
        }

        const channel = streamClient.channel(type, channelId);
        await channel.watch();
        setChannel(channel);
      } catch (error) {
        console.error("Error loading channel:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    initChannel();

    return () => {
      if (channel) {
        channel.stopWatching().catch(console.error);
      }
    };
  }, [channelId, streamClient, type, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-64">
        <ClipLoader color="#FFB800" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!channel || !streamClient) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-64">
        <div className="text-lg text-gray-600">No channel selected</div>
      </div>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="flex flex-col w-full h-screen max-h-[calc(100vh-125px)] overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <Chat client={streamClient}>
          <Channel channel={channel}>
            <Window>
              <div className="flex flex-col h-full">
                <CustomChannelHeader onChannelLeave={onChannelLeave} />
                <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <MessageList />
                </div>
                <div className="flex-none border-t">
                  <MessageInput
                    focus
                    additionalTextareaProps={{
                      placeholder: "Type your message...",
                    }}
                  />
                </div>
              </div>
            </Window>
            <Thread />
          </Channel>
        </Chat>
      </div>
    </>
  );
};

export default ChatComponent;
