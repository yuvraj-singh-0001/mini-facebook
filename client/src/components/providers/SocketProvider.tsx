"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const notificationHandlerRef = useRef<((msg: any) => void) | null>(null);

  useEffect(() => {
    // Only connect if we have a user
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    
    const user = JSON.parse(userStr);
    const userId = user.id || user._id;

    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002');

    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('setup', userId);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Global notification handler - uses a named reference
    const notifHandler = (msg: any) => {
      // Only show toast notification when NOT on the messages page with that sender
      const isMessagesPage = window.location.pathname === '/messages';
      
      // Don't show notification if we're currently chatting with this person
      if (isMessagesPage) return;
      
      toast((t) => (
        <div 
          onClick={() => {
            window.location.href = `/messages?userId=${msg.sender}`;
            toast.dismiss(t.id);
          }} 
          className="cursor-pointer flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-lg">💬</span>
          </div>
          <div>
            <p className="font-bold text-[14px] text-gray-900">New Message</p>
            <p className="text-[13px] text-gray-500 truncate max-w-[180px]">
              {msg.type === 'image' ? '📸 Sent a photo' : msg.content}
            </p>
          </div>
        </div>
      ), {
        duration: 4000,
        position: 'bottom-left',
        style: {
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }
      });
    };
    
    notificationHandlerRef.current = notifHandler;
    socketInstance.on('receive_message', notifHandler);

    setSocket(socketInstance);

    return () => {
      if (notificationHandlerRef.current) {
        socketInstance.off('receive_message', notificationHandlerRef.current);
      }
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      <Toaster />
      {children}
    </SocketContext.Provider>
  );
};
