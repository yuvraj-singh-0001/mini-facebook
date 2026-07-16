"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Camera, Plus, PenSquare, ChevronDown, MoreHorizontal, Image as ImageIcon, MapPin, Briefcase, GraduationCap, Heart, Clock, Video as VideoIcon, Search, MessageCircle, Film, Filter, Trash2, Pencil, X, Check, LogOut } from "lucide-react";
import EditProfileModal from "@/components/profile/EditProfileModal";
import CreatePostComponent from "@/components/feed/CreatePostComponent";
import PostComponent from "@/components/feed/PostComponent";
import CreateStoryModal from "@/components/feed/CreateStoryModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "@/config/api";
import { getDefaultAvatar } from "@/lib/utils";

const formatViewCount = (count: number = 0) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1).replace('.0', '')}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace('.0', '')}K`;
  return `${count}`;
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // New features state
  const [activeTab, setActiveTab] = useState("Posts");
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isPublicModalOpen, setIsPublicModalOpen] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");

  // Manage Posts state
  const [postFilter, setPostFilter] = useState<'all' | 'post' | 'reel'>('all');
  const [postSearch, setPostSearch] = useState('');
  const [showManage, setShowManage] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Edit inline state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);

  // Logout state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage'));
    router.push('/auth');
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      fetchUserPosts(u.id || u._id);
      fetchFriends(u.id || u._id);
    }
  }, []);

  const fetchFriends = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/friends/list/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUserPosts = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/posts/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPosts((prev: any[]) => prev.filter((p: any) => p._id !== postId));
        setDeleteTarget(null);
        setDeleteStep(1);
      } else {
        alert('Failed to delete post.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting post.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async (postId: string) => {
    setIsSavingEdit(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/posts/${postId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: editContent })
      });
      if (res.ok) {
        setPosts((prev: any[]) => prev.map((p: any) => p._id === postId ? { ...p, content: editContent, editedAt: new Date().toISOString() } : p));
        setEditingPostId(null);
      } else {
        alert('Failed to save.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/auth/profile-picture`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ avatar: base64String })
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          window.dispatchEvent(new Event("storage"));
        }
      } catch (error) {
        console.error(error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTogglePublicMode = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/auth/profile/public-mode`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublicProfile: !user?.isPublicProfile }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setIsPublicModalOpen(false);
        setIsMoreMenuOpen(false);
        window.dispatchEvent(new Event("storage"));
      }
    } catch (error) {
      console.error("Error toggling public mode:", error);
    }
  };

  const fullName = user ? `${user.firstName} ${user.lastName}` : "Loading...";
  const avatar = user?.avatar || getDefaultAvatar(user?.gender);

  const renderTabContent = () => {
    if (activeTab === "About") {
      return (
        <div className="bg-white rounded-xl shadow-sm p-6 w-full border border-gray-200 animate-in fade-in duration-200 mt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-4 mb-6 gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">About</h2>
              <p className="text-xs text-gray-500 mt-0.5">Manage your personal and professional details</p>
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-[#e7f3ff] hover:bg-[#dbedff] text-[#1877f2] font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <PenSquare size={16} /> Edit Profile Details
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Overview & Bio</h3>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-gray-800 font-medium text-base mb-2">
                    {user?.bio || <span className="text-gray-400 italic">No bio written yet. Click 'Edit Profile Details' to add a short bio about yourself.</span>}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Work & Education</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 bg-blue-100 text-[#1877f2] rounded-xl flex items-center justify-center shrink-0 font-bold">💼</div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Workplace</p>
                      <p className="font-bold text-gray-900 text-sm">
                        {user?.workplace ? `Works at ${user.workplace}` : <span className="text-gray-400 italic font-normal">No workplace added</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 bg-blue-100 text-[#1877f2] rounded-xl flex items-center justify-center shrink-0 font-bold">🎓</div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Education</p>
                      <p className="font-bold text-gray-900 text-sm">
                        {user?.education ? `Studied at ${user.education}` : <span className="text-gray-400 italic font-normal">No education added</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Places Lived</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0 font-bold">📍</div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Current City</p>
                      <p className="font-bold text-gray-900 text-sm">
                        {user?.location ? `Lives in ${user.location}` : <span className="text-gray-400 italic font-normal">No current city added</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0 font-bold">🏠</div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Hometown</p>
                      <p className="font-bold text-gray-900 text-sm">
                        {user?.hometown ? `From ${user.hometown}` : <span className="text-gray-400 italic font-normal">No hometown added</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Basic Info & Relationship</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0 font-bold">❤️</div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Relationship Status</p>
                      <p className="font-bold text-gray-900 text-sm capitalize">
                        {user?.relationshipStatus || <span className="text-gray-400 italic font-normal">Not specified</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0 font-bold">🕒</div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Member Since</p>
                      <p className="font-bold text-gray-900 text-sm">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'June 2026'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "Friends") {
      const filteredFriends = friends.filter(f => 
        f.name?.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
        f.firstName?.toLowerCase().includes(friendSearchQuery.toLowerCase())
      );

      return (
        <div className="bg-white rounded-xl shadow-sm p-6 w-full border border-gray-200 animate-in fade-in duration-200 mt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Birdies</h2>
              <p className="text-sm text-gray-500 mt-0.5">{friends.length} {friends.length === 1 ? 'Birdie' : 'Birdies'} total</p>
            </div>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search Birdies..."
                value={friendSearchQuery}
                onChange={(e) => setFriendSearchQuery(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-gray-100 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-[#1877f2]"
              />
              {friendSearchQuery && (
                <button onClick={() => setFriendSearchQuery("")} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs">✕</button>
              )}
            </div>
          </div>

          {filteredFriends.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-base font-semibold">No Birdies found</p>
              <p className="text-xs mt-1">Add Birdies or try searching a different name.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredFriends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all group">
                  <Link href={`/profile/${friend.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <img src={friend.avatar || getDefaultAvatar(friend.gender)} alt={friend.name} className="w-14 h-14 rounded-xl object-cover border border-gray-200 group-hover:scale-105 transition-transform" />
                      {friend.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate group-hover:text-[#1877f2] transition-colors">{friend.name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {friend.isOnline ? <span className="text-green-600 font-medium">● Active Now</span> : 'Offline'}
                      </p>
                    </div>
                  </Link>
                  <Link href={`/messages?userId=${friend.id}`} className="p-2 bg-white hover:bg-[#e7f3ff] text-gray-700 hover:text-[#1877f2] rounded-lg border border-gray-200 transition-colors shadow-sm ml-2">
                    <MessageCircle className="w-5 h-5 text-[#1877f2]" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "Photos") {
      const photoPosts = posts.filter(p => p.image);
      return (
        <div className="bg-white rounded-xl shadow-sm p-6 w-full border border-gray-200 animate-in fade-in duration-200 mt-4">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Photos</h2>
              <p className="text-sm text-gray-500 mt-0.5">{photoPosts.length} photos posted</p>
            </div>
          </div>

          {photoPosts.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-base font-semibold">No photos yet</p>
              <p className="text-xs mt-1">Photos you upload in your posts will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photoPosts.map((post) => (
                <div key={post._id} onClick={() => setActiveTab("Posts")} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 hover:opacity-95 cursor-pointer group relative shadow-sm">
                  <img src={post.image} alt="user photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end p-2 opacity-0 group-hover:opacity-100">
                    <span className="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded backdrop-blur-sm">View Post</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "Videos") {
      const videoPosts = posts.filter(p => p.video || p.videoUrl || p.mediaType === 'video' || p.mediaType === 'reel');
      return (
        <div className="bg-white rounded-xl shadow-sm p-6 w-full border border-gray-200 animate-in fade-in duration-200 mt-4">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Videos & Reels</h2>
              <p className="text-sm text-gray-500 mt-0.5">{videoPosts.length} videos posted</p>
            </div>
          </div>

          {videoPosts.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-2 font-bold text-xl">▶</div>
              <p className="text-base font-semibold">No videos or reels yet</p>
              <p className="text-xs mt-1">Videos and reels you share will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {videoPosts.map((post) => (
                <div key={post._id} onClick={() => setActiveTab("Posts")} className="aspect-video rounded-xl overflow-hidden bg-black border border-gray-200 hover:opacity-95 cursor-pointer group relative shadow-sm flex items-center justify-center">
                  {post.video ? (
                    <video src={post.video} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-white font-semibold">Video Post</div>
                  )}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-[#1877f2] shadow-lg group-hover:scale-110 transition-transform">
                      ▶
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-bold bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm z-10 shadow-sm">
                    <span>▶</span>
                    <span>{formatViewCount(post.viewsCount || 0)} views</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "Check-ins") {
      const locationPosts = posts.filter(p => p.location || p.checkIn);
      return (
        <div className="bg-white rounded-xl shadow-sm p-6 w-full border border-gray-200 animate-in fade-in duration-200 mt-4">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Check-ins & Places Visited</h2>
              <p className="text-sm text-gray-500 mt-0.5">Places and locations tagged in your profile and posts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user?.location && (
              <div className="flex items-center gap-4 p-4 bg-[#f0f7ff] rounded-xl border border-blue-100">
                <div className="w-12 h-12 bg-[#1877f2] text-white rounded-full flex items-center justify-center shadow-sm shrink-0 font-bold text-lg">
                  📍
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1877f2] uppercase tracking-wider">Current City Check-in</span>
                  <h3 className="font-bold text-gray-900 text-lg mt-0.5">{user.location}</h3>
                  <p className="text-xs text-gray-500">Living in {user.location}</p>
                </div>
              </div>
            )}

            {user?.hometown && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-12 h-12 bg-gray-700 text-white rounded-full flex items-center justify-center shadow-sm shrink-0 font-bold text-lg">
                  🏠
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hometown Check-in</span>
                  <h3 className="font-bold text-gray-900 text-lg mt-0.5">{user.hometown}</h3>
                  <p className="text-xs text-gray-500">From {user.hometown}</p>
                </div>
              </div>
            )}

            {locationPosts.map((post) => (
              <div key={post._id} onClick={() => setActiveTab("Posts")} className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 cursor-pointer transition-colors">
                <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm shrink-0 text-lg">
                  📌
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Post Check-in</span>
                  <h3 className="font-bold text-gray-900 text-base">{post.location || post.checkIn}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{post.content || 'Photo checked in'}</p>
                </div>
              </div>
            ))}
          </div>

          {!user?.location && !user?.hometown && locationPosts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-base font-semibold">No check-ins yet</p>
              <p className="text-xs mt-1">When you tag locations in your posts or add your city in About, they will appear here.</p>
            </div>
          )}
        </div>
      );
    }

    // Default "Posts" tab
    return (
      <div className="max-w-[1095px] mx-auto w-full px-4 mt-4 flex flex-col lg:flex-row gap-4 items-start">
        {/* Left Column (Sticky on large screens) */}
        <div className="w-full lg:w-[40%] flex flex-col gap-4 lg:sticky lg:top-[72px]">
          {/* Intro Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 w-full border border-gray-200">
            <h2 className="text-[20px] font-bold mb-4 text-black">Intro</h2>
            <div className="text-center mb-4">
              {user?.bio ? (
                <p className="text-[15px] text-black">{user.bio}</p>
              ) : (
                <p className="text-[15px] text-gray-500 italic">No bio yet</p>
              )}
              <button onClick={() => setIsEditModalOpen(true)} className="bg-[#e4e6eb] hover:bg-[#d8dadf] w-full mt-3 py-1.5 rounded-md font-semibold text-[15px] text-black transition-colors">
                Edit bio
              </button>
            </div>
            
            <div className="flex flex-col gap-3 text-[15px] text-black mb-4">
              {user?.workplace && <div className="flex items-center gap-2"><Briefcase size={20} className="text-gray-500" /> Works at {user.workplace}</div>}
              {user?.education && <div className="flex items-center gap-2"><GraduationCap size={20} className="text-gray-500" /> Studied at {user.education}</div>}
              {user?.location && <div className="flex items-center gap-2"><MapPin size={20} className="text-gray-500" /> Lives in {user.location}</div>}
              {user?.hometown && <div className="flex items-center gap-2"><MapPin size={20} className="text-gray-500" /> From {user.hometown}</div>}
              {user?.relationshipStatus && <div className="flex items-center gap-2"><Heart size={20} className="text-gray-500" /> {user.relationshipStatus}</div>}
              <div className="flex items-center gap-2"><Clock size={20} className="text-gray-500" /> Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'June 2026'}</div>
            </div>

            <button onClick={() => setIsEditModalOpen(true)} className="bg-[#e4e6eb] hover:bg-[#d8dadf] w-full py-1.5 rounded-md font-semibold text-[15px] text-black transition-colors">
              Edit details
            </button>
          </div>

          {/* Photos Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 w-full border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[20px] font-bold text-black">Photos</h2>
              <button onClick={() => setActiveTab("Photos")} className="text-[#1877f2] hover:bg-blue-50 px-2 py-1 rounded-md text-[15px] transition-colors">See all photos</button>
            </div>
            {posts.filter(p => p.image).length === 0 ? (
              <p className="text-gray-500 text-xs italic py-2">No photos posted yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
                {posts.filter(p => p.image).slice(0, 9).map((post) => (
                  <div key={post._id} onClick={() => setActiveTab("Photos")} className="aspect-square bg-gray-100 hover:opacity-90 cursor-pointer overflow-hidden">
                    <img src={post.image} alt="photo" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Scrollable Feed) */}
        <div className="w-full lg:w-[60%] flex flex-col gap-4">
          <CreatePostComponent currentUser={user} onPostCreated={() => fetchUserPosts(user.id || user._id)} />

          {/* ── Manage Posts Header ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
              <h2 className="text-[20px] font-bold text-black">Posts</h2>
              <button
                onClick={() => setShowManage(!showManage)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-[14px] transition-all ${showManage ? 'bg-[#1877f2] text-white' : 'bg-[#e4e6eb] hover:bg-[#d8dadf] text-black'}`}
              >
                <Filter size={15} />
                Manage Posts
              </button>
            </div>

            {/* Filter + Search panel */}
            {showManage && (
              <div className="px-4 py-3 bg-[#f7f8fa] border-b border-gray-200 flex flex-col gap-3">
                {/* Filter tabs */}
                <div className="flex gap-2">
                  {(['all', 'post', 'reel'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setPostFilter(f)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all border ${postFilter === f ? 'bg-[#1877f2] text-white border-[#1877f2]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                    >
                      {f === 'all' && '🗂️ All'}
                      {f === 'post' && <><ImageIcon size={13} /> Photos</>}
                      {f === 'reel' && <><Film size={13} /> Reels / Videos</>}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search in posts..."
                    value={postSearch}
                    onChange={e => setPostSearch(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-[14px] text-black outline-none focus:ring-2 focus:ring-[#1877f2]/30 transition-all"
                  />
                  {postSearch && (
                    <button onClick={() => setPostSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex gap-4 text-[13px] text-gray-500">
                  <span>📝 {posts.filter(p => !p.video && p.mediaType !== 'reel').length} Posts</span>
                  <span>🎬 {posts.filter(p => p.video || p.mediaType === 'reel').length} Reels</span>
                  <span>📅 Total: {posts.length}</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Delete Confirm Modals ── */}
          {deleteTarget && deleteStep === 1 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-[340px] p-6 flex flex-col items-center gap-4 border border-gray-100">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 size={26} className="text-red-500" />
                </div>
                <div className="text-center">
                  <h3 className="text-[17px] font-bold text-gray-900">Delete Post?</h3>
                  <p className="text-sm text-gray-500 mt-1">Are you sure you want to delete this post?</p>
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={() => { setDeleteTarget(null); setDeleteStep(1); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 text-sm">Cancel</button>
                  <button onClick={() => setDeleteStep(2)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 text-sm">Yes, Delete</button>
                </div>
              </div>
            </div>
          )}
          {deleteTarget && deleteStep === 2 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-[360px] p-6 flex flex-col items-center gap-4 border border-red-100">
                <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <Trash2 size={26} className="text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-[17px] font-bold text-gray-900">Permanently Delete?</h3>
                  <p className="text-sm text-gray-500 mt-1">This will be <span className="text-red-500 font-semibold">permanently removed</span> from the database.</p>
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={() => { setDeleteTarget(null); setDeleteStep(1); }} disabled={isDeleting} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 text-sm disabled:opacity-50">Cancel</button>
                  <button onClick={() => handleDeletePost(deleteTarget)} disabled={isDeleting} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    {isDeleting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 size={15} />}
                    {isDeleting ? 'Deleting...' : 'Delete Forever'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Posts List ── */}
          {loadingPosts ? (
            <div className="text-center text-gray-500 py-10">Loading posts...</div>
          ) : (() => {
            const filtered = posts.filter(p => {
              const matchFilter =
                postFilter === 'all' ? true :
                postFilter === 'reel' ? (p.video || p.mediaType === 'reel') :
                (!p.video && p.mediaType !== 'reel');
              const matchSearch = !postSearch || (p.content || '').toLowerCase().includes(postSearch.toLowerCase());
              return matchFilter && matchSearch;
            });

            if (filtered.length === 0) {
              return (
                <div className="text-center text-gray-500 py-10 bg-white rounded-xl shadow-sm border border-gray-200">
                  {postSearch ? `No posts matching "${postSearch}"` : 'No posts yet.'}
                </div>
              );
            }

            return filtered.map((post) => {
              const isEditing = editingPostId === post._id;
              const isReel = post.video || post.mediaType === 'reel';

              return (
                <div key={post._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Post header */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <div className="flex items-center gap-3">
                      <img src={user?.avatar || getDefaultAvatar(user?.gender)} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      <div>
                        <p className="font-semibold text-[14px] text-black">{user?.firstName} {user?.lastName}</p>
                        <div className="flex items-center gap-2 text-[12px] text-gray-500">
                          {/* Date */}
                          <span title={new Date(post.createdAt).toLocaleString()}>
                            📅 {new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' '}·{' '}
                            🕐 {new Date(post.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {post.editedAt && <span className="text-blue-400">· Edited</span>}
                          {/* Type badge */}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isReel ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                            {isReel ? '🎬 Reel' : '📷 Post'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!isEditing && (
                        <>
                          <button
                            onClick={() => { setEditingPostId(post._id); setEditContent(post.content || ''); }}
                            title="Edit post"
                            className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-[#1877f2] transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => { setDeleteTarget(post._id); setDeleteStep(1); }}
                            title="Delete post"
                            className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inline Edit */}
                  {isEditing ? (
                    <div className="px-4 pb-4 flex flex-col gap-3">
                      <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="w-full min-h-[80px] bg-[#f0f2f5] rounded-xl px-4 py-3 text-[15px] text-black resize-none outline-none focus:ring-2 focus:ring-[#1877f2]/30 transition-all"
                        placeholder="Edit your post..."
                        autoFocus
                      />
                      {post.image && <img src={post.image} alt="media" className="rounded-lg max-h-[200px] object-contain bg-gray-100" />}
                      {post.video && <video src={post.video} controls className="rounded-lg max-h-[200px] w-full" />}
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingPostId(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold text-[13px] hover:bg-gray-50">Cancel</button>
                        <button onClick={() => handleSaveEdit(post._id)} disabled={isSavingEdit} className="px-4 py-2 rounded-lg bg-[#1877f2] text-white font-bold text-[13px] hover:bg-[#166fe5] disabled:opacity-50 flex items-center gap-1.5">
                          {isSavingEdit ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={13} />}
                          {isSavingEdit ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 pb-4">
                      {post.content && <p className="text-[15px] text-black mb-3 whitespace-pre-wrap">{post.content}</p>}
                      {post.image && <img src={post.image} alt="post media" loading="lazy" className="rounded-lg w-full max-h-[400px] object-contain bg-gray-100" />}
                      {post.video && <video src={post.video} controls preload="metadata" className="rounded-lg w-full max-h-[400px] object-contain bg-black" />}
                    </div>
                  )}

                  {/* Stats bar */}
                  <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 text-[12px] text-gray-500 bg-gray-50">
                    <span>👍 {post.likesCount || 0} likes</span>
                    <span>💬 {post.commentsCount || 0} comments</span>
                    <span>🔁 {post.sharesCount || 0} shares</span>
                    <span className="ml-auto">👁️ {formatViewCount(post.viewsCount || 0)} views</span>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    );
  };

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#f0f2f5] text-fb-text-dark pt-[104px] md:pt-[56px] pb-10">
      <Navbar />

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[320px] p-6 flex flex-col items-center gap-4 border border-gray-100">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
              <LogOut size={26} className="text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="text-[17px] font-bold text-gray-900">Log Out?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Kya aap <span className="font-semibold text-gray-700">{user?.firstName} {user?.lastName}</span> ke account se logout karna chahte hain?
              </p>
            </div>
            <div className="flex gap-3 w-full mt-1">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <LogOut size={15} />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section (Cover + Avatar + Info) */}
      <div className="bg-white shadow-sm w-full">
        <div className="max-w-[1095px] mx-auto w-full">
          {/* Cover Photo */}
          <div className="w-full h-[250px] md:h-[348px] bg-gradient-to-b from-gray-300 to-gray-400 rounded-b-lg relative group">
            <button className="absolute bottom-4 right-4 bg-white hover:bg-gray-100 text-black px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-2 transition-colors shadow-sm">
              <Camera size={16} />
              <span className="hidden sm:inline">Edit cover photo</span>
            </button>
          </div>

          {/* Profile Info & Avatar */}
          <div className="px-4 md:px-8 pb-4 relative">
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between md:mb-4 -mt-[85px] md:-mt-[30px] relative z-10 gap-4 md:gap-0">
              {/* Avatar and Name */}
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
                <div className="relative">
                  <div className="w-[168px] h-[168px] rounded-full border-4 border-white bg-white overflow-hidden shadow-sm">
                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <label htmlFor="avatar-upload" className="cursor-pointer absolute bottom-2 right-2 w-9 h-9 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center border border-gray-300 transition-colors">
                    <Camera size={20} className="text-black" />
                  </label>
                  <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                
                <div className="text-center md:text-left mb-2 md:mb-4">
                  <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                    <h1 className="text-[32px] font-bold text-black leading-tight">{fullName}</h1>
                    {user?.isPublicProfile && (
                      <span title="Public Profile" className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-r from-[#1877f2] to-[#0052cc] text-white text-base rounded-full shadow-md border border-white/40 cursor-pointer animate-in fade-in zoom-in-95">
                        🌐
                      </span>
                    )}
                  </div>
                  <p onClick={() => setActiveTab("Friends")} className="text-[#65676B] font-semibold text-[15px] hover:underline cursor-pointer mt-0.5">
                    {friends.length} {friends.length === 1 ? 'Birdie' : 'Birdies'}
                  </p>
                  
                  {/* Real friends avatars */}
                  {friends.length > 0 && (
                    <div className="flex justify-center md:justify-start mt-2">
                      {friends.slice(0, 6).map((friend) => (
                        <img 
                          key={friend.id} 
                          src={friend.avatar || getDefaultAvatar(friend.gender)} 
                          className="w-8 h-8 rounded-full border-2 border-white -ml-2 first:ml-0 object-cover" 
                          alt="friend" 
                          title={friend.name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mb-2 md:mb-4 flex-wrap">
                <button
                  onClick={() => setIsStoryModalOpen(true)}
                  className="bg-[#1877f2] hover:bg-[#166fe5] text-white px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus size={18} />
                  Add to story
                </button>
                <button onClick={() => setIsEditModalOpen(true)} className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-black px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors">
                  <PenSquare size={18} />
                  Edit profile
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="bg-red-50 hover:bg-red-100 text-red-500 px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors border border-red-200"
                >
                  <LogOut size={18} />
                  Log Out
                </button>
                <button className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-black px-3 py-1.5 rounded-md flex items-center transition-colors">
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>

            <div className="border-t border-[#ced0d4] mt-4 mb-1 w-full"></div>

            {/* Profile Navigation Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex overflow-x-auto hide-scrollbar">
                {["Posts", "About", "Friends", "Photos", "Videos", "Check-ins"].map((tab) => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-4 font-semibold text-[15px] whitespace-nowrap transition-colors ${activeTab === tab ? 'text-[#1877f2] border-b-[3px] border-[#1877f2]' : 'text-[#65676B] hover:bg-gray-100 rounded-md my-1'}`}
                  >
                    {tab === "Posts" ? "Chirps" : tab === "Friends" ? "Birdies" : tab === "Videos" ? "Reels" : tab}
                  </button>
                ))}
              </div>
              <div className="relative">
                <button 
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} 
                  className="flex bg-[#e4e6eb] hover:bg-[#d8dadf] text-black p-2 rounded-md transition-colors"
                >
                  <MoreHorizontal size={20} />
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setIsPublicModalOpen(true);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors text-sm font-semibold text-gray-800"
                    >
                      <span className="w-8 h-8 rounded-full bg-blue-100 text-[#1877f2] flex items-center justify-center text-base shrink-0">🌐</span>
                      <div>
                        <p>{user?.isPublicProfile ? "Turn off Professional mode" : "Turn on Professional / Public mode"}</p>
                        <p className="text-xs text-gray-500 font-normal">Reach more people across Mini-Facebook</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Render Dynamic Tab Content */}
      <div className="max-w-[1095px] mx-auto w-full px-4">
        {renderTabContent()}
      </div>

      {isEditModalOpen && user && (
        <EditProfileModal
          user={user}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
            window.dispatchEvent(new Event("storage"));
          }}
        />
      )}

      {isStoryModalOpen && (
        <CreateStoryModal
          onClose={() => setIsStoryModalOpen(false)}
          onSuccess={() => {
            setIsStoryModalOpen(false);
          }}
        />
      )}

      {/* Professional / Public Profile Confirmation Modal (English) */}
      {isPublicModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#1877f2] to-[#0052cc] p-6 text-white text-center relative">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md text-3xl">
                🌐
              </div>
              <h2 className="text-xl font-bold">
                {user?.isPublicProfile ? "Turn off Public Profile Mode?" : "Turn on Public Profile Mode?"}
              </h2>
              <p className="text-xs text-blue-100 mt-1">Professional & Responsive Profile Settings</p>
            </div>

            <div className="p-6 space-y-4 text-gray-700 text-sm">
              <p className="font-semibold text-gray-900 text-base leading-snug">
                {user?.isPublicProfile
                  ? "Are you sure you want to switch back to a standard personal account?"
                  : "By turning on Public Profile Mode, you unlock professional tools and wider visibility across Mini-Facebook:"}
              </p>

              {!user?.isPublicProfile && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1877f2] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Reach a Wider Audience</p>
                      <p className="text-xs text-gray-500">Your posts, reels, and videos can be recommended to everyone in public feeds.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1877f2] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Anyone Can Discover You</p>
                      <p className="text-xs text-gray-500">People can view your profile content and follow your public updates seamlessly.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1877f2] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Official Verified Badge Icon</p>
                      <p className="text-xs text-gray-500">A verified '🌐' badge icon will be displayed right next to your name.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsPublicModalOpen(false)}
                className="px-4 py-2 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleTogglePublicMode}
                className="px-5 py-2 rounded-xl font-bold bg-[#1877f2] hover:bg-[#166fe5] text-white shadow-md hover:shadow-lg transition-all text-sm"
              >
                {user?.isPublicProfile ? "Confirm, Turn Off" : "I Agree, Turn on Public Profile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
