// src/context/CallContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { StreamChat } from 'stream-chat';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { streamApiKey } from '../config/stream'; // Adjust path as needed

// Create context
const CallContext = createContext();

// Provider component
export const CallProvider = ({ children }) => {
  const [videoClient, setVideoClient] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize clients when user data is available
  useEffect(() => {
    const initializeClients = async () => {
      try {
        setIsLoading(true);
        
        // Get user from session storage or other auth source
        const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
        
        if (!userData || !userData.uid) {
          setError('User data not found. Please log in.');
          setIsLoading(false);
          return;
        }
        
        setUser(userData);
        
        // Initialize Stream Chat client
        const chatClientInstance = StreamChat.getInstance(streamApiKey);
        
        // Generate token (in production, this should come from your backend)
        const token = chatClientInstance.devToken(userData.uid);
        
        // Connect user to chat
        await chatClientInstance.connectUser(
          {
            id: userData.uid,
            name: userData.name || 'User',
            image: userData.photoUrl || '',
          },
          token
        );
        
        setChatClient(chatClientInstance);
        
        // Initialize Stream Video client
        const videoClientInstance = new StreamVideoClient({
          apiKey: streamApiKey,
          user: {
            id: userData.uid,
            name: userData.name || 'User',
            image: userData.photoUrl || '',
          },
          token
        });
        
        setVideoClient(videoClientInstance);
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing clients:', error);
        setError('Failed to initialize communication clients.');
        setIsLoading(false);
      }
    };

    initializeClients();

    // Cleanup function to disconnect clients
    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
      }
      if (videoClient) {
        videoClient.disconnectUser();
      }
    };
  }, []);

  // Function to join a call
  const joinCall = async (callId, callType = 'default', options = {}) => {
    if (!videoClient || !user) {
      setError('Video client not initialized or user not logged in');
      return null;
    }

    try {
      // Get or create call
      const call = videoClient.call(callType, callId);
      
      // Join the call
      await call.join({ create: true, ...options });
      
      // Enable camera and microphone if not disabled in options
      if (!options.disableCamera) {
        await call.camera.enable();
      }
      
      if (!options.disableMicrophone) {
        await call.microphone.enable();
      }
      
      setCurrentCall(call);
      return call;
    } catch (error) {
      console.error('Error joining call:', error);
      setError('Failed to join call. Please try again.');
      return null;
    }
  };

  // Function to create or get a chat channel
  const getOrCreateChannel = async (channelId, channelType = 'messaging', channelData = {}) => {
    if (!chatClient || !user) {
      setError('Chat client not initialized or user not logged in');
      return null;
    }

    try {
      // Create or get channel
      const channel = chatClient.channel(channelType, channelId, {
        members: [user.uid, ...((channelData.members || []).map(m => m.user_id || m))],
        ...channelData
      });
      
      // Watch the channel
      await channel.watch();
      
      setCurrentChannel(channel);
      return channel;
    } catch (error) {
      console.error('Error getting or creating channel:', error);
      setError('Failed to initialize chat channel.');
      return null;
    }
  };

  // Function to leave current call
  const leaveCall = async () => {
    if (currentCall) {
      try {
        await currentCall.leave();
        setCurrentCall(null);
        return true;
      } catch (error) {
        console.error('Error leaving call:', error);
        setError('Failed to leave call properly.');
        return false;
      }
    }
    return true;
  };

  // Value object to be provided to consumers
  const value = {
    videoClient,
    chatClient,
    currentCall,
    currentChannel,
    user,
    isLoading,
    error,
    joinCall,
    leaveCall,
    getOrCreateChannel,
    setCurrentCall,
    setCurrentChannel,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

// Custom hook to use the call context
export const useCallContext = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCallContext must be used within a CallProvider');
  }
  return context;
};

export default CallContext;