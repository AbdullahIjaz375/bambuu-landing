// src/components/EnhancedCallPreview.js
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Thread,
  Window,
  useChannelStateContext,
  useMessageContext,
  MessageSimple,
  useChannelActionContext,
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
  PaperclipIcon,
  Moon,
  ChevronRight
} from "lucide-react";

// Animation variants for framer motion
const sidebarVariants = {
  hidden: { x: "100%" },
  visible: { 
    x: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 30 
    }
  },
  exit: { 
    x: "100%",
    transition: { 
      ease: "easeInOut", 
      duration: 0.3 
    }
  }
};

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

const buttonHoverVariants = {
  hover: { 
    scale: 1.05,
    transition: { duration: 0.2 }
  }
};

// Custom Message component with enhanced UI and animations
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
    <div className="custom-message-container dark-theme-message">
      <MessageSimple 
        {...props}
        additionalMessageInputProps={{
          grow: true,
          InputButtons: () => (
            <div className="message-input-buttons">
              <motion.button 
                className="message-action-button"
                onClick={toggleReactions}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Smile size={18} />
              </motion.button>
            </div>
          )
        }}
      />
      
      <AnimatePresence>
        {showReactions && (
          <motion.div 
            className="reactions-selector-container"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeInVariants}
          >
            <motion.div 
              className="reactions-selector"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
            >
              {["like", "love", "haha", "wow", "sad", "angry"].map((type) => (
                <motion.button 
                  key={type}
                  className="reaction-button" 
                  onClick={() => handleReaction(type)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {type === "like" && "👍"}
                  {type === "love" && "❤️"}
                  {type === "haha" && "😂"}
                  {type === "wow" && "😮"}
                  {type === "sad" && "😢"}
                  {type === "angry" && "😡"}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Enhanced Custom Input for better UX with animations
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
    <div className="custom-message-input dark-theme-input">
      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="message-input-container">
          <motion.button 
            type="button"
            className="attachment-button"
            onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <PaperclipIcon size={20} />
          </motion.button>
          
          <input
            className="message-input-field"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            autoFocus
          />
          
          <motion.button 
            type="submit" 
            className="send-button"
            disabled={!message.trim()}
            whileHover={message.trim() ? { scale: 1.1 } : {}}
            whileTap={message.trim() ? { scale: 0.95 } : {}}
          >
            <Send size={20} />
          </motion.button>
        </div>
        
        <AnimatePresence>
          {isAttachmentMenuOpen && (
            <motion.div 
              className="attachment-menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <motion.button 
                type="button"
                className="attachment-option"
                onClick={() => {
                  fileInputRef.current.click();
                }}
                whileHover={{ scale: 1.05, backgroundColor: "#2D3748" }}
              >
                <File size={16} />
                <span>File</span>
              </motion.button>
              
              <motion.button 
                type="button" 
                className="attachment-option"
                onClick={() => {
                  fileInputRef.current.accept = "image/*";
                  fileInputRef.current.click();
                }}
                whileHover={{ scale: 1.05, backgroundColor: "#2D3748" }}
              >
                <Image size={16} />
                <span>Image</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
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

// Enhanced CustomChannelHeader for better UX with dark theme
const CustomChannelHeader = () => {
  const { channel } = useChannelStateContext();
  const members = Object.values(channel.state.members);
  const memberCount = members.length;
  
  return (
    <motion.div 
      className="custom-channel-header dark-theme-header"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="channel-header-info">
        {/* <h4 className="channel-name">{channel.data.name || 'Chat'}</h4> */}
        <span className="member-count">{memberCount} participants</span>
      </div>
     
    </motion.div>
  );
};

const EnhancedCallPreview = ({ streamVideoClient, currentCall, chatClient, chatChannel }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState(null);

  // Toggle chat panel with animation
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

  // Toggle participants panel with animation
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
    <div className="enhanced-call-preview dark-theme">
      <Chat client={chatClient}>
        <StreamVideo client={streamVideoClient}>
          <StreamTheme>
            <StreamCall call={currentCall}>
              <div className="call-layout">
                {/* Main Video Area */}
                <div className={`main-video-area ${(isChatOpen || isParticipantsOpen) ? 'with-sidebar' : ''}`}>
                  <SpeakerLayout participantsBarPosition="bottom" />
                  
                  {/* Custom floating controls with animations */}
                  <div className="floating-controls">
                    <motion.button 
                      className={`control-btn ${isChatOpen ? 'active' : ''} ${unreadMessages > 0 ? 'has-notification' : ''}`} 
                      onClick={toggleChat}
                      title="Chat"
                      whileHover="hover"
                      variants={buttonHoverVariants}
                    >
                      <MessageSquare size={20} />
                      <AnimatePresence>
                        {unreadMessages > 0 && (
                          <motion.span 
                            className="notification-badge"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            {unreadMessages}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                    
                    <motion.button 
                      className={`control-btn ${isParticipantsOpen ? 'active' : ''}`} 
                      onClick={toggleParticipants}
                      title="Participants"
                      whileHover="hover"
                      variants={buttonHoverVariants}
                    >
                      <Users size={20} />
                    </motion.button>
                  </div>
                  
                  {/* Call Controls at bottom */}
                  <CallControls />
                </div>
                
                {/* Sidebar for Chat or Participants with Framer Motion animations */}
                <AnimatePresence>
                  {(isChatOpen || isParticipantsOpen) && (
                    <motion.div 
                      className="call-sidebar dark-theme-sidebar"
                      key="sidebar"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={sidebarVariants}
                    >
                      <div className="sidebar-header dark-theme-sidebar-header">
                        <motion.h3
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          {isChatOpen ? 'Chat' : 'Participants'}
                        </motion.h3>
                        <motion.button 
                          className="close-sidebar"
                          onClick={isChatOpen ? toggleChat : toggleParticipants}
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X size={18} />
                        </motion.button>
                      </div>
                      
                      {isChatOpen && chatChannel && (
                        <motion.div 
                          className="chat-container"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <StreamChannel channel={chatChannel}>
                            <Window>
                              <CustomChannelHeader />
                              <MessageList Message={CustomMessage} />
                              <CustomMessageInput />
                            </Window>
                            <Thread />
                          </StreamChannel>
                        </motion.div>
                      )}
                      
                      {isParticipantsOpen && (
                        <motion.div 
                          className="participants-container dark-theme-participants"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <CallParticipantsList />
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </StreamCall>
          </StreamTheme>
        </StreamVideo>
      </Chat>
    </div>
  );
};

export default EnhancedCallPreview;