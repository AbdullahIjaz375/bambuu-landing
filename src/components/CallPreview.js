// src/components/EnhancedCallPreview.js
import React, { useState, useEffect, useCallback } from "react";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/v2/index.css";
import "./CallPreview.css";

// Stream Video SDK imports
import {
  StreamVideo,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallParticipantsList,
  useCall
} from "@stream-io/video-react-sdk";

// Stream Chat SDK imports
import {
  Chat,
  Channel as StreamChannel,
  MessageList,
  MessageInput,
  Thread,
  Window,
  ChannelHeader,
  useChannelStateContext,
  useMessageContext,
  MessageSimple,
  useChannelActionContext,
  Attachment,
  ReactionSelector,
  ReactionList
} from "stream-chat-react";

// Icons
import {
  MessageSquare,
  Users,
  X,
  Send,
  Smile,
  Image,
  File,
  PaperclipIcon
} from "lucide-react";

// Custom Message component with enhanced UI
const CustomMessage = (props) => {
  const { message, handleOpenThread } = props;
  const { updateMessage } = useChannelActionContext();
  const [showReactions, setShowReactions] = useState(false);
  
  const toggleReactions = () => {
    setShowReactions(!showReactions);
  };

  const handleReaction = (type) => {
    const userExistingReaction = message.reactions?.find(
      (reaction) => reaction.user_id === props.client.userID && reaction.type === type
    );

    if (userExistingReaction) {
      updateMessage(message.id, {
        reactions: message.reactions.filter(
          (reaction) => !(reaction.user_id === props.client.userID && reaction.type === type)
        )
      });
    } else {
      updateMessage(message.id, {
        reactions: [...(message.reactions || []), { type, user_id: props.client.userID }]
      });
    }
    
    setShowReactions(false);
  };

  return (
    <div className="custom-message-container">
      <MessageSimple 
        {...props}
        additionalMessageInputProps={{
          grow: true,
          InputButtons: () => (
            <div className="message-input-buttons">
              <button className="message-action-button" onClick={toggleReactions}>
                <Smile size={18} />
              </button>
            </div>
          )
        }}
      />
      
      {showReactions && (
        <div className="reactions-selector-container">
          <div className="reactions-selector">
            {["like", "love", "haha", "wow", "sad", "angry"].map((type) => (
              <button 
                key={type}
                className="reaction-button" 
                onClick={() => handleReaction(type)}
              >
                {type === "like" && "👍"}
                {type === "love" && "❤️"}
                {type === "haha" && "😂"}
                {type === "wow" && "😮"}
                {type === "sad" && "😢"}
                {type === "angry" && "😡"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Custom Input for better UX
const CustomMessageInput = (props) => {
  const [message, setMessage] = useState("");
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const { sendMessage } = useChannelActionContext();
  const fileInputRef = React.createRef();
  
  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (message.trim() === "") return;
    
    const messageData = {
      text: message,
    };
    
    sendMessage(messageData);
    setMessage("");
  };
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const messageData = {
      text: message || "",
      attachments: [
        {
          type: "file",
          title: file.name,
          asset_url: URL.createObjectURL(file), // This is temporary - in production, you'd upload to your server first
          file_size: file.size,
          mime_type: file.type,
        }
      ]
    };
    
    sendMessage(messageData);
    setMessage("");
    setIsAttachmentMenuOpen(false);
  };
  
  return (
    <div className="custom-message-input">
      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="message-input-container">
          <button 
            type="button"
            className="attachment-button"
            onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
          >
            <PaperclipIcon size={20} />
          </button>
          
          <input
            className="message-input-field"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            autoFocus
          />
          
          <button 
            type="submit" 
            className="send-button"
            disabled={!message.trim()}
          >
            <Send size={20} />
          </button>
        </div>
        
        {isAttachmentMenuOpen && (
          <div className="attachment-menu">
            <button 
              type="button"
              className="attachment-option"
              onClick={() => {
                fileInputRef.current.click();
              }}
            >
              <File size={16} />
              <span>File</span>
            </button>
            
            <button 
              type="button" 
              className="attachment-option"
              onClick={() => {
                fileInputRef.current.accept = "image/*";
                fileInputRef.current.click();
              }}
            >
              <Image size={16} />
              <span>Image</span>
            </button>
          </div>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </form>
    </div>
  );
};

// Enhanced CustomChannelHeader for better UX
const CustomChannelHeader = () => {
  const { channel } = useChannelStateContext();
  const members = Object.values(channel.state.members);
  const memberCount = members.length;
  
  return (
    <div className="custom-channel-header">
      <div className="channel-header-info">
        <h4 className="channel-name">{channel.data.name || 'Chat'}</h4>
        <span className="member-count">{memberCount} participants</span>
      </div>
    </div>
  );
};

const EnhancedCallPreview = ({ streamVideoClient, currentCall, chatClient, chatChannel }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState(null);

  // Toggle chat panel
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      setIsParticipantsOpen(false);
      // Mark messages as read when opening the chat
      if (chatChannel) {
        chatChannel.markRead();
        setUnreadMessages(0);
      }
    }
  };

  // Toggle participants panel
  const toggleParticipants = () => {
    setIsParticipantsOpen(!isParticipantsOpen);
    if (!isParticipantsOpen) {
      setIsChatOpen(false);
    }
  };

  // Listen for new messages when chat is not open
  useEffect(() => {
    if (!chatChannel || isChatOpen) return;
    
    const handleNewMessage = (event) => {
      // Only increment for messages from other users
      if (event.user.id !== chatClient.userID) {
        setUnreadMessages((prev) => prev + 1);
      }
    };
    
    chatChannel.on('message.new', handleNewMessage);
    
    return () => {
      chatChannel.off('message.new', handleNewMessage);
    };
  }, [chatChannel, isChatOpen, chatClient]);

  // Handle marking messages as read
  useEffect(() => {
    if (chatChannel && isChatOpen) {
      chatChannel.markRead();
      setUnreadMessages(0);
    }
  }, [chatChannel, isChatOpen]);

  return (
    <div className="enhanced-call-preview">
      <Chat client={chatClient}>
        <StreamVideo client={streamVideoClient}>
          <StreamTheme>
            <StreamCall call={currentCall}>
              <div className="call-layout">
                {/* Main Video Area */}
                <div className={`main-video-area ${(isChatOpen || isParticipantsOpen) ? 'with-sidebar' : ''}`}>
                  <SpeakerLayout participantsBarPosition="bottom" />
                  
                  {/* Custom floating controls */}
                  <div className="floating-controls">
                    <button 
                      className={`control-btn ${isChatOpen ? 'active' : ''} ${unreadMessages > 0 ? 'has-notification' : ''}`} 
                      onClick={toggleChat}
                      title="Chat"
                    >
                      <MessageSquare size={20} />
                      {unreadMessages > 0 && (
                        <span className="notification-badge">{unreadMessages}</span>
                      )}
                    </button>
                    
                    <button 
                      className={`control-btn ${isParticipantsOpen ? 'active' : ''}`} 
                      onClick={toggleParticipants}
                      title="Participants"
                    >
                      <Users size={20} />
                    </button>
                  </div>
                  
                  {/* Call Controls at bottom */}
                  <CallControls />
                </div>
                
                {/* Sidebar for Chat or Participants */}
                {(isChatOpen || isParticipantsOpen) && (
                  <div className="call-sidebar">
                    <div className="sidebar-header">
                      <h3>{isChatOpen ? 'Chat' : 'Participants'}</h3>
                      <button 
                        className="close-sidebar" 
                        onClick={isChatOpen ? toggleChat : toggleParticipants}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    
                    {isChatOpen && chatChannel && (
                      <div className="chat-container">
                        <StreamChannel channel={chatChannel}>
                          <Window>
                            <CustomChannelHeader />
                            <MessageList Message={CustomMessage} />
                            <CustomMessageInput />
                          </Window>
                          <Thread />
                        </StreamChannel>
                      </div>
                    )}
                    
                    {isParticipantsOpen && (
                      <div className="participants-container">
                        <CallParticipantsList />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </StreamCall>
          </StreamTheme>
        </StreamVideo>
      </Chat>
    </div>
  );
};

export default EnhancedCallPreview;