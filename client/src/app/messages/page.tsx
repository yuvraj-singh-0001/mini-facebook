"use client";

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';
import { format, isToday, isYesterday } from 'date-fns';
import { 
  Send, Image as ImageIcon, Smile, MoreVertical, 
  Check, CheckCheck, Trash2, Edit2, Ban,
  ArrowLeft, Search as SearchIcon, Video, Phone, X, Plus
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import Navbar from '@/components/layout/Navbar';
import { useSearchParams, useRouter } from 'next/navigation';
import { API_URL } from '@/config/api';
import { getDefaultAvatar } from '@/lib/utils';

// Types
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: string;
  gender?: string;
  blockedUsers?: string[];
}

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  type: 'text' | 'image';
  imageUrl?: string;
  status: 'sent' | 'delivered' | 'seen';
  isDeletedForMe: string[];
  isDeletedForEveryone: boolean;
  isEdited: boolean;
  createdAt: string;
  isProfanityError?: boolean;
  profanityWarning?: string;
  profanityCategories?: string[];
}

interface Conversation {
  friend: User;
  lastMessage: Message | null;
  unreadCount: number;
}


function ChatContent() {
  const { socket, isConnected } = useSocket();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryUserId = searchParams?.get('userId');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeFriend, setActiveFriend] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeFriendRef = useRef<User | null>(null);

  // Keep ref in sync with state so socket callbacks see latest value
  useEffect(() => {
    activeFriendRef.current = activeFriend;
  }, [activeFriend]);

  // Load user
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      if (parsedUser.id && !parsedUser._id) {
        parsedUser._id = parsedUser.id;
      }
      setCurrentUser(parsedUser);
    }
  }, []);

  // Fetch conversations
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/chat/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
          
          // Auto-select based on queryUserId
          if (queryUserId) {
            const existingConv = data.find((c: Conversation) => c.friend._id === queryUserId);
            if (existingConv) {
              setActiveFriend(existingConv.friend);
            } else {
              // Fetch user details if not in conversations yet
              try {
                const userRes = await fetch(`${API_URL}/api/users/${queryUserId}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (userRes.ok) {
                  const userData = await userRes.json();
                  if (userData.user && userData.user.id !== currentUser._id) {
                    const newFriend: User = {
                      _id: userData.user.id,
                      firstName: userData.user.name?.split(' ')[0] || userData.user.firstName || '',
                      lastName: userData.user.name?.split(' ').slice(1).join(' ') || userData.user.lastName || '',
                      avatar: userData.user.avatar || getDefaultAvatar(userData.user.gender),
                      isOnline: false,
                      lastSeen: new Date().toISOString()
                    };
                    setActiveFriend(newFriend);
                  }
                }
              } catch (e) {
                console.error("Failed to fetch user for chat", e);
              }
            }
          } else {
            // If no queryUserId, ensure we show the list (especially on mobile)
            setActiveFriend(null);
          }
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
      }
    };
    
    fetchConversations();
  }, [currentUser, queryUserId]);

  const playSendSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.08);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.08);
    } catch (e) { console.error(e); }
  }, []);

  const playReceiveSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain1.gain.setValueAtTime(0, audioCtx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.15);

      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1108.73, audioCtx.currentTime + 0.1); // C#6
      gain2.gain.setValueAtTime(0, audioCtx.currentTime + 0.1);
      gain2.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc2.start(audioCtx.currentTime + 0.1);
      osc2.stop(audioCtx.currentTime + 0.4);
    } catch (e) { console.error(e); }
  }, []);

  // Fetch messages when friend is selected
  useEffect(() => {
    if (!activeFriend || !currentUser) return;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/chat/messages/${activeFriend._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          
          // Mark as seen
          const unseenIds = data
            .filter((m: Message) => m.sender === activeFriend._id && m.status !== 'seen')
            .map((m: Message) => m._id);
          
          if (unseenIds.length > 0 && socket) {
            socket.emit('message_seen', { 
              messageIds: unseenIds, 
              sender: currentUser._id, 
              receiver: activeFriend._id 
            });
            window.dispatchEvent(new Event('messages_read'));
          }
        }
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };

    fetchMessages();
  }, [activeFriend, currentUser, socket]);

  // Socket Listeners - use useCallback + named refs to avoid removing SocketProvider's listeners
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleReceiveMessage = (msg: Message) => {
      const currentActiveFriend = activeFriendRef.current;
      const senderId = msg.sender;
      
      if (currentActiveFriend && senderId === currentActiveFriend._id) {
        // Incoming message from the friend we're currently chatting with
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        playReceiveSound();
        // Mark as seen after a small delay so sender sees gray ticks first
        setTimeout(() => {
          socket.emit('message_seen', {
            messageIds: [msg._id],
            sender: currentUser._id,
            receiver: currentActiveFriend._id
          });
          window.dispatchEvent(new Event('messages_read'));
        }, 1200);
        // Update sidebar: set lastMessage, keep unread 0, move to top
        setConversations(prev => {
          const updated = prev.map(c => 
            c.friend._id === senderId ? { ...c, lastMessage: msg, unreadCount: 0 } : c
          );
          // Move this conversation to the top
          const idx = updated.findIndex(c => c.friend._id === senderId);
          if (idx > 0) {
            const [conv] = updated.splice(idx, 1);
            updated.unshift(conv);
          }
          return updated;
        });
      } else {
        // Message from a friend we're NOT actively chatting with
        playReceiveSound();
        setConversations(prev => {
          const idx = prev.findIndex(c => c.friend._id === senderId);
          if (idx !== -1) {
            // Friend exists in list — update lastMessage, increment unread, move to top
            const updated = [...prev];
            updated[idx] = { 
              ...updated[idx], 
              lastMessage: msg, 
              unreadCount: updated[idx].unreadCount + 1 
            };
            const [conv] = updated.splice(idx, 1);
            updated.unshift(conv);
            return updated;
          } else {
            // Brand new friend not in list — add to top, then re-fetch for proper data
            const newConv: Conversation = {
              friend: {
                _id: senderId,
                firstName: 'New',
                lastName: 'User',
                avatar: getDefaultAvatar(),
                isOnline: true,
                lastSeen: new Date().toISOString()
              },
              lastMessage: msg,
              unreadCount: 1
            };
            // Fetch proper friend info in the background without replacing list
            const token = localStorage.getItem('token');
            fetch(`${API_URL}/api/chat/conversations`, {
              headers: { Authorization: `Bearer ${token}` }
            }).then(res => res.json()).then((serverConvs: Conversation[]) => {
              // Merge server data — keep our local unread counts & lastMessages that may be newer
              setConversations(localPrev => {
                const merged = [...localPrev];
                for (const sc of serverConvs) {
                  const localIdx = merged.findIndex(c => c.friend._id === sc.friend._id);
                  if (localIdx !== -1) {
                    // Update friend data (name, avatar, online) but keep our local lastMessage if newer
                    merged[localIdx] = {
                      ...merged[localIdx],
                      friend: sc.friend,
                    };
                  } else {
                    merged.push(sc);
                  }
                }
                return merged;
              });
            }).catch(() => {});
            return [newConv, ...prev];
          }
        });
      }
    };

    const handleSeenUpdate = ({ messageIds }: { messageIds: string[] }) => {
      setMessages(prev => prev.map(m => 
        messageIds.includes(m._id) ? { ...m, status: 'seen' as const } : m
      ));
    };

    const handleTypingStart = ({ sender }: { sender: string }) => {
      const currentActiveFriend = activeFriendRef.current;
      if (currentActiveFriend && sender === currentActiveFriend._id) setIsTyping(true);
    };

    const handleTypingStop = ({ sender }: { sender: string }) => {
      const currentActiveFriend = activeFriendRef.current;
      if (currentActiveFriend && sender === currentActiveFriend._id) setIsTyping(false);
    };

    const handleStatusChange = ({ userId, isOnline, lastSeen }: { userId: string; isOnline: boolean; lastSeen: string }) => {
      const currentActiveFriend = activeFriendRef.current;
      if (currentActiveFriend && currentActiveFriend._id === userId) {
        setActiveFriend(prev => prev ? { ...prev, isOnline, lastSeen } : null);
      }
      setConversations(prev => prev.map(c => 
        c.friend._id === userId ? { ...c, friend: { ...c.friend, isOnline, lastSeen } } : c
      ));
    };

    const handleDeleted = ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.map(m => 
        m._id === messageId ? { ...m, isDeletedForEveryone: true } : m
      ));
    };

    const handleEdited = (updatedMsg: Message) => {
      setMessages(prev => prev.map(m => 
        m._id === updatedMsg._id ? updatedMsg : m
      ));
    };

    // Attach named handlers (won't wipe SocketProvider's listeners)
    socket.on('receive_message', handleReceiveMessage);
    socket.on('messages_seen_update', handleSeenUpdate);
    socket.on('typing', handleTypingStart);
    socket.on('stop_typing', handleTypingStop);
    socket.on('user_status_change', handleStatusChange);
    socket.on('message_deleted', handleDeleted);
    socket.on('message_edited', handleEdited);

    return () => {
      // Remove only OUR specific handlers, not all listeners for that event
      socket.off('receive_message', handleReceiveMessage);
      socket.off('messages_seen_update', handleSeenUpdate);
      socket.off('typing', handleTypingStart);
      socket.off('stop_typing', handleTypingStop);
      socket.off('user_status_change', handleStatusChange);
      socket.off('message_deleted', handleDeleted);
      socket.off('message_edited', handleEdited);
    };
  }, [socket, currentUser]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (socket && activeFriend && currentUser) {
      socket.emit('typing', { sender: currentUser._id, receiver: activeFriend._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { sender: currentUser._id, receiver: activeFriend._id });
      }, 2000);
    }
  };

  const handleSend = () => {
    if (!newMessage.trim() && !editingMsgId) return;
    if (!socket || !currentUser || !activeFriend) return;

    if (editingMsgId) {
      socket.emit('edit_message', {
        messageId: editingMsgId,
        content: newMessage,
        receiver: activeFriend._id
      });
      setMessages(prev => prev.map(m => m._id === editingMsgId ? { ...m, content: newMessage, isEdited: true } : m));
      setEditingMsgId(null);
    } else {
      const msgData = {
        sender: currentUser._id,
        receiver: activeFriend._id,
        content: newMessage,
        type: 'text'
      };

      socket.emit('send_message', msgData, (response: any) => {
        if (response.status === 'ok') {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.find(m => m._id === response.message._id)) return prev;
            return [...prev, response.message];
          });
          playSendSound();
          
          setConversations(prev => {
            const idx = prev.findIndex(c => c.friend._id === activeFriend._id);
            if (idx !== -1) {
              // Update lastMessage and move to top
              const updated = [...prev];
              updated[idx] = { ...updated[idx], lastMessage: response.message };
              const [conv] = updated.splice(idx, 1);
              updated.unshift(conv);
              return updated;
            }
            // New conversation — add to top
            return [{
              friend: activeFriend,
              lastMessage: response.message,
              unreadCount: 0
            }, ...prev];
          });
        } else if (response.status === 'profanity_error') {
          const categoryString = response.caughtCategories && response.caughtCategories.length > 0
            ? `[${response.caughtCategories.join(', ')}] `
            : '';
            
          const fakeMsg: Message = {
            _id: Date.now().toString(),
            sender: currentUser._id,
            receiver: activeFriend._id,
            content: msgData.content, // capture the attempted message
            type: 'text',
            status: 'sent',
            isDeletedForMe: [],
            isDeletedForEveryone: false,
            isEdited: false,
            createdAt: new Date().toISOString(),
            isProfanityError: true,
            profanityCategories: response.caughtCategories,
            profanityWarning: response.isDeactivated 
              ? 'Account deactivated for 24 hours.'
              : `Message blocked due to ${categoryString}content. Warning: Repeated offenses lead to a 24-hour ban.`
          };
          setMessages(prev => [...prev, fakeMsg]);
          
          if (response.isDeactivated) {
            setTimeout(() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }, 3000);
          }
        } else {
          console.error("Server error sending message:", response?.error);
        }
      });
    }

    setNewMessage('');
    setShowEmoji(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket || !currentUser || !activeFriend) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      const msgData = {
        sender: currentUser._id,
        receiver: activeFriend._id,
        content: '',
        type: 'image',
        imageUrl: base64Str
      };
      socket.emit('send_message', msgData, (response: any) => {
        if (response.status === 'ok') setMessages(prev => [...prev, response.message]);
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteForMe = (msgId: string) => {
    if (!socket || !currentUser) return;
    socket.emit('delete_for_me', { messageId: msgId, userId: currentUser._id });
    setMessages(prev => prev.filter(m => m._id !== msgId));
  };

  const handleDeleteForEveryone = (msgId: string) => {
    if (!socket || !activeFriend) return;
    socket.emit('delete_for_everyone', { messageId: msgId, receiver: activeFriend._id });
    setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isDeletedForEveryone: true } : m));
  };

  const formatLastSeen = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isToday(date)) return `Active today at ${format(date, 'h:mm a')}`;
    if (isYesterday(date)) return `Active yesterday at ${format(date, 'h:mm a')}`;
    return `Active ${format(date, 'MMM d, h:mm a')}`;
  };

  const formatMsgTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  if (!currentUser) return <div className="h-screen bg-white flex items-center justify-center text-gray-500">Loading...</div>;

  return (
    <div className="flex-1 flex overflow-hidden w-full bg-white max-h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <div className={`w-full md:w-[360px] border-r border-gray-200 flex flex-col bg-white ${activeFriend ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 flex flex-col gap-3 shadow-sm z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-[24px] font-bold text-black tracking-tight">Chats</h1>
            <div className="flex gap-2">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200">
                <MoreVertical size={20} className="text-black" />
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon size={18} className="text-gray-500" />
            </div>
            <input 
              type="text" 
              placeholder="Search Messenger" 
              className="w-full bg-gray-100 text-black text-[15px] rounded-full pl-10 pr-4 py-2 outline-none focus:bg-gray-200 transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto hide-scrollbar pt-1">
          {conversations.length === 0 ? (
            <div className="text-center text-gray-400 mt-10 px-6">
              <p className="text-lg font-semibold mb-1">No chats yet</p>
              <p className="text-sm">Start a conversation with your friends!</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.friend._id}
                onClick={() => {
                  setActiveFriend(conv.friend);
                  // Reset unread count when opening
                  setConversations(prev => prev.map(c => 
                    c.friend._id === conv.friend._id ? { ...c, unreadCount: 0 } : c
                  ));
                }}
                className={`px-2 py-1.5 mx-2 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors
                  ${activeFriend?._id === conv.friend._id ? 'bg-[#ebf5ff]' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <img src={conv.friend.avatar || getDefaultAvatar(conv.friend.gender)} alt="avatar" className="w-[56px] h-[56px] rounded-full object-cover border border-gray-200" />
                  {conv.friend.isOnline && (
                    <div className="absolute bottom-1 right-0 w-3.5 h-3.5 bg-[#31a24c] border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-[15px] truncate ${conv.unreadCount > 0 ? 'font-bold text-black' : 'font-semibold text-gray-900'}`}>
                      {conv.friend.firstName} {conv.friend.lastName}
                    </h3>
                    {conv.lastMessage && (
                      <span className={`text-[12px] whitespace-nowrap pl-2 ${conv.unreadCount > 0 ? 'font-bold text-black' : 'text-gray-500'}`}>
                        {formatMsgTime(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[13px] truncate ${conv.unreadCount > 0 ? 'font-semibold text-black' : 'text-gray-500'}`}>
                      {conv.lastMessage 
                        ? (conv.lastMessage.isDeletedForEveryone 
                            ? 'Message deleted' 
                            : conv.lastMessage.type === 'image' 
                              ? '📷 Photo' 
                              : conv.lastMessage.content)
                        : 'Say hi! 👋'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <div className="min-w-[20px] h-[20px] bg-[#31a24c] text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 flex-shrink-0">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {activeFriend ? (
        <div className="flex-1 flex flex-col h-full relative bg-white">
          {/* Header */}
          <div className="h-[68px] px-4 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 text-blue-600" onClick={() => { setActiveFriend(null); router.push('/messages'); }}>
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div 
                className="relative shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => router.push(`/profile/${activeFriend._id}`)}
              >
                <img src={activeFriend.avatar || getDefaultAvatar(activeFriend.gender)} alt="avatar" className="w-[42px] h-[42px] rounded-full object-cover border border-gray-200" />
                {activeFriend.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#31a24c] border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <h2 
                  className="font-bold text-[16px] text-black leading-tight truncate cursor-pointer hover:underline"
                  onClick={() => router.push(`/profile/${activeFriend._id}`)}
                >
                  {activeFriend.firstName} {activeFriend.lastName}
                </h2>
                <p className="text-[12px] text-gray-500 truncate">
                  {isTyping ? (
                    <span className="text-green-600 font-medium">typing...</span>
                  ) : activeFriend.isOnline ? (
                    <span className="text-green-600">● Online</span>
                  ) : (
                    formatLastSeen(activeFriend.lastSeen)
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-blue-600 transition-colors">
                <Phone size={20} />
              </button>
              <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-blue-600 transition-colors">
                <Video size={22} />
              </button>
              <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-blue-600 transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#f0f2f5]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d1d5db\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
            
            {/* Friend intro card */}
            <div className="flex flex-col items-center justify-center py-6 mb-4">
              <img 
                src={activeFriend.avatar || getDefaultAvatar(activeFriend.gender)} 
                className="w-[80px] h-[80px] rounded-full border-2 border-white shadow-md mb-3 cursor-pointer hover:opacity-90 transition-opacity" 
                onClick={() => router.push(`/profile/${activeFriend._id}`)}
                alt="avatar"
              />
              <h2 
                className="text-[18px] font-bold text-gray-800 cursor-pointer hover:underline"
                onClick={() => router.push(`/profile/${activeFriend._id}`)}
              >
                {activeFriend.firstName} {activeFriend.lastName}
              </h2>
              <p className="text-gray-500 text-[13px]">You're friends on Facebook</p>
              <p className="text-gray-400 text-[12px] mt-1">Say hi to start chatting! 👋</p>
            </div>

            {messages.map((msg, index) => {
              const isMine = msg.sender === currentUser._id;
              const showDate = index === 0 || 
                new Date(messages[index-1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

              if (msg.isDeletedForEveryone) {
                return (
                  <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div className="bg-white/80 text-gray-400 italic px-4 py-2 rounded-xl text-[13px] border border-gray-200">
                      🚫 This message was deleted
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg._id} className="flex flex-col mb-1">
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="bg-white text-gray-500 text-[11px] px-3 py-1.5 rounded-lg font-medium shadow-sm border border-gray-100">
                        {isToday(new Date(msg.createdAt)) 
                          ? 'Today' 
                          : isYesterday(new Date(msg.createdAt))
                            ? 'Yesterday'
                            : format(new Date(msg.createdAt), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} group mb-0.5`}>
                    
                    {!isMine && (
                      <img src={activeFriend.avatar || getDefaultAvatar(activeFriend.gender)} alt="avatar" className="w-[28px] h-[28px] rounded-full object-cover mr-2 self-end mb-4 shrink-0" />
                    )}
                    
                    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%] sm:max-w-[60%]`}>
                      <div className={`relative px-3 py-2 text-[15px] shadow-sm
                        ${msg.isProfanityError 
                          ? 'bg-red-50 text-red-600 rounded-[18px] rounded-br-[4px] border border-red-300 font-medium'
                          : isMine 
                            ? 'bg-[#0084ff] text-white rounded-[18px] rounded-br-[4px]' 
                            : 'bg-white text-gray-900 rounded-[18px] rounded-bl-[4px] border border-gray-100'}`}
                      >
                        {msg.type === 'image' && msg.imageUrl ? (
                          <img src={msg.imageUrl} alt="attached" className="rounded-lg max-w-full max-h-[300px] cursor-pointer hover:opacity-95 transition-opacity" />
                        ) : (
                          <p className="leading-snug break-words whitespace-pre-wrap">{msg.content}</p>
                        )}

                        {/* Action Menu (Hover) */}
                        <div className={`absolute top-1/2 -translate-y-1/2 ${isMine ? '-left-20' : '-right-20'} hidden group-hover:flex items-center gap-1`}>
                          {isMine && msg.type === 'text' && (
                            <button onClick={() => { setEditingMsgId(msg._id); setNewMessage(msg.content); }} className="w-7 h-7 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => handleDeleteForEveryone(msg._id)} className="w-7 h-7 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center text-red-500 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Time + Status */}
                      <div className={`flex items-center gap-1 mt-0.5 px-1 text-[11px] ${isMine ? 'text-gray-500' : 'text-gray-400'}`}>
                        <span>{formatMsgTime(msg.createdAt)}</span>
                        {msg.isEdited && <span className="italic">· edited</span>}
                        {isMine && !msg.isProfanityError && (
                          <span className="flex items-center ml-0.5">
                            {msg.status === 'sent' && <span title="Sent"><Check className="w-3.5 h-3.5 text-gray-400" /></span>}
                            {msg.status === 'delivered' && <span title="Delivered"><CheckCheck className="w-3.5 h-3.5 text-gray-400" /></span>}
                            {msg.status === 'seen' && <span title="Seen"><CheckCheck className="w-3.5 h-3.5 text-blue-500" /></span>}
                          </span>
                        )}
                      </div>
                      
                      {msg.isProfanityError && (
                        <div className="text-red-500 text-[12px] font-bold mt-1 w-full text-right px-1 leading-tight">
                          ⚠️ {msg.profanityWarning}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isTyping && (
              <div className="flex justify-start mb-2">
                <img src={activeFriend.avatar || getDefaultAvatar(activeFriend.gender)} alt="avatar" className="w-[28px] h-[28px] rounded-full object-cover mr-2 self-end mb-1" />
                <div className="bg-white px-4 py-3 rounded-[18px] rounded-bl-[4px] flex gap-1.5 items-center shadow-sm border border-gray-100">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-200 flex flex-col shrink-0 relative z-20">
            {editingMsgId && (
              <div className="bg-blue-50 text-blue-700 p-2 mb-2 rounded-lg flex justify-between items-center text-[13px] border border-blue-200">
                <span>✏️ Editing message...</span>
                <button onClick={() => { setEditingMsgId(null); setNewMessage(''); }} className="text-blue-400 hover:text-blue-600 p-1"><X size={16}/></button>
              </div>
            )}
            <div className="flex items-end gap-2 w-full">
              <div className="flex items-center gap-0.5 shrink-0 pb-1">
                <label className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-blue-600 transition-colors cursor-pointer">
                  <ImageIcon size={22} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              <div className="flex-1 bg-gray-100 rounded-[20px] flex items-center min-h-[40px] px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent outline-none text-[15px] text-black w-full placeholder-gray-400"
                />
                <button 
                  onClick={() => setShowEmoji(!showEmoji)}
                  className="ml-2 text-gray-400 hover:text-blue-500 transition-colors shrink-0 relative"
                >
                  <Smile size={22} />
                  {showEmoji && (
                    <div className="absolute bottom-10 right-0 z-[100] shadow-2xl rounded-xl border border-gray-200">
                      <EmojiPicker onEmojiClick={(e) => setNewMessage(prev => prev + e.emoji)} width={300} height={350} />
                    </div>
                  )}
                </button>
              </div>

              <button 
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all ${
                  newMessage.trim() 
                    ? 'bg-[#0084ff] text-white hover:bg-[#0073e6] shadow-md' 
                    : 'text-gray-300'
                }`}
              >
                <Send size={20} className={newMessage.trim() ? "" : ""} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
              <Send className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-[20px] font-bold text-gray-700">Your Messages</h2>
            <p className="text-gray-400 mt-1 text-[14px]">Send private messages to a friend</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <Navbar />
      <div className="flex-1 flex overflow-hidden mt-[56px]">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-gray-400">Loading chat...</div>}>
          <ChatContent />
        </Suspense>
      </div>
    </div>
  );
}
