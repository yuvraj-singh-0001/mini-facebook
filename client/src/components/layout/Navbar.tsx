"use client";

import React, { useEffect, useState, useRef } from "react";
import { Search, Home, Users, Bell, MessageCircle, Menu, Grid, PlaySquare } from "lucide-react";
import Link from "next/link";
import { useSocket } from '@/components/providers/SocketProvider';
import { usePathname } from 'next/navigation';
import { API_URL } from '@/config/api';

// Helper for dynamic Facebook-like relative time
const formatFacebookTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds || 1} seconds ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (diffInDays <= 10) {
    return `${diffInDays} days ago`;
  }

  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

export default function Navbar() {
  const [avatar, setAvatar] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Felix");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.avatar) setAvatar(user.avatar);
      // Delay non-critical navbar API calls — run AFTER feed & stories finish
      // Run sequentially so they don't compete with each other
      const timer = setTimeout(async () => {
        await fetchNotifications();
        await fetchFriendRequests();
        await fetchUnreadMessages();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchUnreadMessages();
    socket.on('receive_message', handleUpdate);
    socket.on('messages_seen_update', handleUpdate);
    window.addEventListener('messages_read', handleUpdate);
    
    return () => {
      socket.off('receive_message', handleUpdate);
      socket.off('messages_seen_update', handleUpdate);
      window.removeEventListener('messages_read', handleUpdate);
    };
  }, [socket]);

  const fetchUnreadMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/chat/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUnreadMessagesCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      // Ignore transient network errors during server restarts
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/friends/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.requests) {
          setFriendRequestsCount(data.requests.length);
        }
      }
    } catch (error) {
      // Ignore transient network errors during server restarts
    }
  };

  const handleNotificationsClick = async () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (!isNotificationsOpen && unreadCount > 0) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_URL}/api/notifications/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(0);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleClearNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/notifications/clear`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_URL}/api/users?search=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setSearchResults(data.users || []);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setIsMobileSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderSearchResults = () => (
    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[420px] overflow-y-auto w-full mt-1">
      <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1 flex items-center justify-between">
        <span>Search Results</span>
        {searchResults.length > 0 && <span className="text-gray-400 font-normal">{searchResults.length} matches</span>}
      </div>

      {isSearching ? (
        <div className="flex items-center justify-center py-8 text-gray-500 text-sm gap-2">
          <div className="w-5 h-5 border-2 border-[#1877f2] border-t-transparent rounded-full animate-spin"></div>
          <span>Searching for "{searchQuery}"...</span>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="py-8 text-center px-4">
          <p className="text-gray-900 font-semibold text-sm">No users found</p>
          <p className="text-gray-500 text-xs mt-1">We couldn't find anyone matching "{searchQuery}"</p>
        </div>
      ) : (
        searchResults.map((user) => (
          <Link
            key={user.id}
            href={`/profile/${user.id}`}
            onClick={() => {
              setIsSearchOpen(false);
              setIsMobileSearchOpen(false);
              setSearchQuery("");
            }}
            className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-100 transition-colors cursor-pointer group rounded-lg mx-1"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <img
                  src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 group-hover:scale-105 transition-transform"
                />
                {user.status === "friends" && user.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#1877f2] transition-colors">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.status === "friends"
                    ? (user.isOnline ? "Birdie • Active Now" : (user.lastSeen ? `Birdie • Active ${formatFacebookTime(user.lastSeen)}` : "Birdie"))
                    : user.status === "request_sent" ? "Request Sent"
                    : user.status === "request_received" ? "Request Received"
                    : "Vaaknow User"}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#1877f2] bg-[#e7f3ff] px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              View Profile
            </span>
          </Link>
        ))
      )}
    </div>
  );
// ty
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 flex flex-col">
      <div className="h-[56px] px-4 flex items-center justify-between">
        {/* Left section: Logo & Search */}
        <div className="flex items-center gap-2">
          {/* Mobile Text Logo */}
          <Link href="/" onClick={(e) => { if (window.location.pathname === '/') { window.scrollTo({ top: 0, behavior: 'smooth' }); } }} className="md:hidden text-[#1877f2] font-bold text-[28px] tracking-tight">
            Vaaknow
          </Link>
          
          {/* Desktop 'V' Logo */}
          <Link href="/" onClick={(e) => { if (window.location.pathname === '/') { window.scrollTo({ top: 0, behavior: 'smooth' }); } }} className="hidden md:flex text-fb-blue hover:opacity-90">
            <div className="w-10 h-10 bg-[#1877f2] rounded-full flex items-center justify-center text-white font-extrabold text-2xl pb-0.5 shadow-md">
              V
            </div>
          </Link>
          
          <div ref={searchRef} className="relative ml-2">
            <div className="hidden md:flex items-center bg-gray-100 hover:bg-gray-200/80 rounded-full px-3 py-2 w-64 lg:w-80 transition-colors">
              <Search size={18} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search Vaaknow"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim() || searchResults.length > 0) {
                    setIsSearchOpen(true);
                  }
                }}
                className="bg-transparent border-none outline-none ml-2 w-full text-sm placeholder-gray-500 text-black font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }} 
                  className="text-gray-400 hover:text-gray-600 ml-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Desktop Search Results Dropdown */}
            {isSearchOpen && searchQuery.trim() && (
              <div className="hidden md:block absolute left-0 top-12 w-[340px] lg:w-[380px]">
                {renderSearchResults()}
              </div>
            )}
          </div>
        </div>

        {/* Center section: Navigation Icons Desktop */}
        <div className="hidden md:flex flex-1 justify-center max-w-2xl gap-2">
          <NavItem href="/" onClick={() => { if (pathname === '/') { window.scrollTo({ top: 0, behavior: 'smooth' }); } }} icon={<Home size={28} />} active={pathname === '/'} tooltip="Home" />
          <NavItem href="/video" icon={<PlaySquare size={28} />} active={pathname === '/video'} tooltip="Video" />
          <NavItem href="/friends" icon={<Users size={28} />} active={pathname === '/friends'} tooltip="Friends" badge={friendRequestsCount > 0 ? friendRequestsCount : undefined} />
          <NavItem href="#" icon={<Grid size={28} />} active={pathname === '/menu'} tooltip="Menu" />
        </div>

        {/* Right section: User Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Right Icons */}
          <div className="md:hidden flex items-center gap-2">
            <div 
              onClick={() => {
                setIsMobileSearchOpen(!isMobileSearchOpen);
                if (!isMobileSearchOpen) setIsSearchOpen(true);
              }}
              className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center cursor-pointer text-black transition-colors"
            >
              <Search size={20} />
            </div>
            <Link href="/messages" className="relative w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer text-black hover:bg-gray-200">
              <MessageCircle size={20} />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Right Icons */}
          <div className="hidden md:flex sm:items-center gap-2">
            <ActionButton icon={<Menu size={20} />} />
            <Link href="/messages">
              <ActionButton icon={<MessageCircle size={20} />} badge={unreadMessagesCount > 0 ? (unreadMessagesCount > 9 ? '9+' : unreadMessagesCount.toString()) : undefined} />
            </Link>
            
            {/* Notifications Section */}
            <div className="relative">
              <div onClick={handleNotificationsClick} className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center cursor-pointer transition-colors text-black relative">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              
              {isNotificationsOpen && (
                <div className="absolute right-0 top-12 w-[360px] bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-black">Notifications ({notifications.length})</h2>
                    {notifications.length > 0 && (
                      <button 
                        onClick={handleClearNotifications}
                        className="text-sm text-blue-600 hover:underline font-semibold"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto pr-2 flex flex-col gap-2">
                    {notifications.length === 0 ? (
                      <p className="text-center text-gray-500 my-4">No notifications yet.</p>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif._id} className="flex items-start gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                          <img src={notif.sender.avatar} className="w-12 h-12 rounded-full object-cover" alt="Sender" />
                          <div>
                            <p className="text-[15px] text-black">
                              {notif.message}
                            </p>
                            <p className="text-[13px] text-blue-600 font-semibold mt-1">
                              {formatFacebookTime(notif.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link href="/profile" className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden cursor-pointer ml-1 hover:opacity-90 transition-opacity block">
              <img src={avatar} alt="User profile" className="w-full h-full object-cover" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Search Dropdown Bar */}
      {isMobileSearchOpen && (
        <div ref={searchRef} className="md:hidden bg-white border-t border-gray-200 p-3 shadow-lg relative z-50 animate-in slide-in-from-top-2">
          <div className="flex items-center bg-gray-100 rounded-full px-3 py-2 w-full">
            <Search size={18} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search users by name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              autoFocus
              className="bg-transparent border-none outline-none ml-2 w-full text-sm placeholder-gray-500 text-black font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }} 
                className="text-gray-400 hover:text-gray-600 ml-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Mobile Search Results */}
          {searchQuery.trim() && (
            <div className="mt-2">
              {renderSearchResults()}
            </div>
          )}
        </div>
      )}

      {/* Mobile Tab Bar */}
      <div className="md:hidden h-[48px] border-t border-gray-200 flex items-center justify-between px-1 w-full bg-white">
        <NavItemMobile href="/" onClick={() => { if (pathname === '/') { window.scrollTo({ top: 0, behavior: 'smooth' }); } }} icon={<Home size={26} />} active={pathname === '/'} />
        <NavItemMobile href="/video" icon={<PlaySquare size={26} />} active={pathname === '/video'} />
        <NavItemMobile href="/friends" icon={<Users size={26} />} active={pathname === '/friends'} badge={friendRequestsCount > 0 ? friendRequestsCount : undefined} />
        <NavItemMobile href="#" icon={<Bell size={26} />} active={pathname === '/notifications'} badge={unreadCount > 0 ? unreadCount : undefined} />
        <NavItemMobile href="/profile" icon={<Menu size={26} />} active={pathname === '/profile'} />
      </div>
    </nav>
  );
}

function NavItem({ icon, active, tooltip, href, onClick, badge }: { icon: React.ReactNode; active?: boolean; tooltip: string; href?: string; onClick?: () => void; badge?: number }) {
  const content = (
    <div
      onClick={onClick}
      className={`px-8 py-2 rounded-lg cursor-pointer flex items-center justify-center transition-colors relative group
        ${active ? "text-fb-blue" : "text-gray-500 hover:bg-gray-100"}
      `}
    >
      <div className="relative">
        {icon}
        {badge ? (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
            {badge}
          </span>
        ) : null}
      </div>
      {active && (
        <div className="absolute bottom-[-10px] left-0 right-0 h-[3px] bg-fb-blue rounded-t-md"></div>
      )}
      
      {/* Tooltip */}
      <div className="hidden md:block absolute top-12 bg-black text-white text-xs px-3 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
        {tooltip}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} onClick={(e) => { if (onClick) { onClick(); } }}>{content}</Link>;
  }
  return content;
}

function ActionButton({ icon, badge }: { icon: React.ReactNode; badge?: string }) {
  return (
    <div className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center cursor-pointer relative transition-colors text-black ">
      {icon}
      {badge && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white ">
          {badge}
        </div>
      )}
    </div>
  );
}

function NavItemMobile({ icon, active, href, onClick, badge }: { icon: React.ReactNode; active?: boolean; href?: string; onClick?: () => void; badge?: number }) {
  const content = (
    <div
      onClick={onClick}
      className={`flex-1 flex items-center justify-center py-2.5 transition-colors relative
        ${active ? "text-[#1877f2]" : "text-gray-500"}
      `}
    >
      <div className="relative">
        {icon}
        {badge ? (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1 py-0 rounded-full border border-white">
            {badge}
          </span>
        ) : null}
      </div>
      {active && (
        <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-[#1877f2] rounded-t-md"></div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="flex-1" onClick={(e) => { if (onClick) { onClick(); } }}>{content}</Link>;
  }
  return content;
}
