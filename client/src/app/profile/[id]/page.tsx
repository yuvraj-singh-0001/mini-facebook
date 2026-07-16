"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Camera, Plus, PenSquare, ChevronDown, MoreHorizontal, Image as ImageIcon, MapPin, Briefcase, GraduationCap, Heart, Clock, UserPlus, Check, X, UserMinus, Video as VideoIcon, Search, MessageCircle } from "lucide-react";
import PostComponent from "@/components/feed/PostComponent";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/config/api";
import toast, { Toaster } from "react-hot-toast";
import { getDefaultAvatar } from "@/lib/utils";

const formatViewCount = (count: number = 0) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1).replace('.0', '')}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace('.0', '')}K`;
  return `${count}`;
};

export default function DynamicProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mutualFriends, setMutualFriends] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Tabs state
  const [activeTab, setActiveTab] = useState("Posts");
  const [friendSearchQuery, setFriendSearchQuery] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    if (id) {
      fetchProfile();
      fetchUserPosts();
      fetchUserFriends();
    }
  }, [id]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        if (data.user.status === 'self') {
          router.push('/profile');
          return;
        }
        setUser(data.user);
        
        const mutualRes = await fetch(`${API_URL}/api/friends/mutual/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const mutualData = await mutualRes.json();
        if (mutualRes.ok) setMutualFriends(mutualData.mutualFriends || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFriends = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/friends/list/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFriendsList(data.friends || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/posts/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setPosts(data.posts || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleAction = async (endpoint: string, method: string) => {
    const userName = user?.name || user?.firstName || "User";

    // Optimistic UI — update status immediately
    setUser((prev: any) => {
      if (!prev) return prev;
      let newStatus = prev.status;
      if (endpoint === 'request') newStatus = 'request_sent';
      else if (endpoint === 'cancel') newStatus = 'none';
      else if (endpoint === 'accept') newStatus = 'friends';
      else if (endpoint === 'reject') newStatus = 'none';
      else if (endpoint === 'unfriend') newStatus = 'none';
      return { ...prev, status: newStatus };
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/friends/${endpoint}/${id}`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        if (endpoint === 'request') {
          toast.success(`Friend request sent to ${userName}! 🎉`, {
            style: { background: "#1877f2", color: "#fff", fontWeight: "600", borderRadius: "12px", padding: "12px 18px", fontSize: "14px", boxShadow: "0 4px 20px rgba(24,119,242,0.35)" },
            iconTheme: { primary: "#fff", secondary: "#1877f2" },
            duration: 3000, position: "bottom-center",
          });
        } else if (endpoint === 'accept') {
          toast.success(`You and ${userName} are now friends! 🎊`, {
            style: { background: "#42b72a", color: "#fff", fontWeight: "600", borderRadius: "12px", padding: "12px 18px", fontSize: "14px", boxShadow: "0 4px 20px rgba(66,183,42,0.35)" },
            iconTheme: { primary: "#fff", secondary: "#42b72a" },
            duration: 3000, position: "bottom-center",
          });
        } else if (endpoint === 'cancel') {
          toast(`Request cancelled`, { icon: "✕", style: { background: "#e4e6eb", color: "#050505", fontWeight: "600", borderRadius: "12px", padding: "12px 18px" }, duration: 2000, position: "bottom-center" });
        } else if (endpoint === 'unfriend') {
          toast(`${userName} removed from friends`, { icon: "", style: { background: "#e4e6eb", color: "#050505", fontWeight: "600", borderRadius: "12px", padding: "12px 18px" }, duration: 2000, position: "bottom-center" });
        }
      } else {
        // Rollback on failure
        fetchProfile();
      }
    } catch (error) {
      fetchProfile();
      console.error(error);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#f0f2f5] pt-[56px] flex justify-center items-center"><div className="text-xl font-bold text-gray-500">Loading profile...</div></div>;
  if (!user) return <div className="min-h-screen bg-[#f0f2f5] pt-[56px] flex justify-center items-center"><div className="text-xl font-bold text-gray-500">User not found.</div></div>;

  const fullName = user.name;
  const avatar = user.avatar || getDefaultAvatar(user.gender);

  const renderTabContent = () => {
    if (activeTab === "About") {
      return (
        <div className="bg-white rounded-xl shadow-sm p-6 w-full border border-gray-200 animate-in fade-in duration-200 mt-4">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">About {user.firstName}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Personal and professional details</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Overview & Bio</h3>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-gray-800 font-medium text-base mb-2">
                    {user.bio || <span className="text-gray-400 italic">No bio added yet.</span>}
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
                        {user.workplace ? `Works at ${user.workplace}` : <span className="text-gray-400 italic font-normal">No workplace listed</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 bg-blue-100 text-[#1877f2] rounded-xl flex items-center justify-center shrink-0 font-bold">🎓</div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Education</p>
                      <p className="font-bold text-gray-900 text-sm">
                        {user.education ? `Studied at ${user.education}` : <span className="text-gray-400 italic font-normal">No education listed</span>}
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
                        {user.location ? `Lives in ${user.location}` : <span className="text-gray-400 italic font-normal">No current city listed</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0 font-bold">🏠</div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Hometown</p>
                      <p className="font-bold text-gray-900 text-sm">
                        {user.hometown ? `From ${user.hometown}` : <span className="text-gray-400 italic font-normal">No hometown listed</span>}
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
                        {user.relationshipStatus || <span className="text-gray-400 italic font-normal">Not specified</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0 font-bold">🕒</div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Member Since</p>
                      <p className="font-bold text-gray-900 text-sm">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'June 2026'}
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
      const filteredFriends = friendsList.filter(f => 
        f.name?.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
        f.firstName?.toLowerCase().includes(friendSearchQuery.toLowerCase())
      );

      return (
        <div className="bg-white rounded-xl shadow-sm p-6 w-full border border-gray-200 animate-in fade-in duration-200 mt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.firstName}'s Friends</h2>
              <p className="text-sm text-gray-500 mt-0.5">{friendsList.length} {friendsList.length === 1 ? 'friend' : 'friends'} total</p>
            </div>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search Friends..."
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
              <p className="text-base font-semibold">No friends found</p>
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
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Photos</h2>
            <p className="text-sm text-gray-500 mt-0.5">{photoPosts.length} photos posted</p>
          </div>

          {photoPosts.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-base font-semibold">No photos yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photoPosts.map((post) => (
                <div key={post._id} onClick={() => setActiveTab("Posts")} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 hover:opacity-95 cursor-pointer group relative shadow-sm">
                  <img src={post.image} alt="user photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Videos & Reels</h2>
            <p className="text-sm text-gray-500 mt-0.5">{videoPosts.length} videos posted</p>
          </div>

          {videoPosts.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-2 font-bold text-xl">▶</div>
              <p className="text-base font-semibold">No videos or reels yet</p>
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
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Check-ins & Places Visited</h2>
            <p className="text-sm text-gray-500 mt-0.5">Places and locations tagged by {user.firstName}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.location && (
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

            {user.hometown && (
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

          {!user.location && !user.hometown && locationPosts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-base font-semibold">No check-ins yet</p>
            </div>
          )}
        </div>
      );
    }

    // Default "Posts" tab
    return (
      <div className="max-w-[1095px] mx-auto w-full px-4 mt-4 flex flex-col lg:flex-row gap-4 items-start">
        <div className="w-full lg:w-[40%] flex flex-col gap-4 lg:sticky lg:top-[72px]">
          <div className="bg-white rounded-lg shadow-sm p-4 w-full border border-gray-200">
            <h2 className="text-[20px] font-bold mb-4 text-black">Intro</h2>
            <div className="text-center mb-4">
              {user.bio ? (
                <p className="text-[15px] text-black">{user.bio}</p>
              ) : (
                <p className="text-[15px] text-gray-500 italic">No bio yet</p>
              )}
            </div>
            
            <div className="flex flex-col gap-3 text-[15px] text-black mb-4">
              {user.workplace && <div className="flex items-center gap-2"><Briefcase size={20} className="text-gray-500" /> Works at {user.workplace}</div>}
              {user.education && <div className="flex items-center gap-2"><GraduationCap size={20} className="text-gray-500" /> Studied at {user.education}</div>}
              {user.location && <div className="flex items-center gap-2"><MapPin size={20} className="text-gray-500" /> Lives in {user.location}</div>}
              {user.hometown && <div className="flex items-center gap-2"><MapPin size={20} className="text-gray-500" /> From {user.hometown}</div>}
              {user.relationshipStatus && <div className="flex items-center gap-2"><Heart size={20} className="text-gray-500" /> {user.relationshipStatus}</div>}
              <div className="flex items-center gap-2"><Clock size={20} className="text-gray-500" /> Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 w-full border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[20px] font-bold text-black">Mutual Friends</h2>
              <button onClick={() => setActiveTab("Friends")} className="text-[#1877f2] hover:bg-blue-50 px-2 py-1 rounded-md text-[15px] transition-colors">See all</button>
            </div>
            {mutualFriends.length === 0 ? (
              <p className="text-gray-500 text-sm">No mutual friends yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 rounded-lg">
                {mutualFriends.map((mf) => (
                  <div key={mf.id} className="flex flex-col gap-1 cursor-pointer group">
                    <img src={mf.avatar || getDefaultAvatar(mf.gender)} alt="friend" className="w-full aspect-square object-cover rounded-lg group-hover:opacity-90" />
                    <span className="text-[13px] font-semibold text-black truncate">{mf.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[60%] flex flex-col gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 w-full border border-gray-200 flex justify-between items-center">
            <h2 className="text-[20px] font-bold text-black">Posts</h2>
            <div className="flex gap-2">
              <button className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-black px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors">
                Filters
              </button>
            </div>
          </div>

          {loadingPosts ? (
            <div className="text-center text-gray-500 py-10">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-sm border border-gray-200">
              No posts yet.
            </div>
          ) : (
            posts.map((post) => (
              <PostComponent key={post._id} post={post} currentUser={currentUser} isProfileView={true} />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#f0f2f5] text-fb-text-dark pt-[104px] md:pt-[56px] pb-10">
      <Toaster />
      <Navbar />

      <div className="bg-white shadow-sm w-full">
        <div className="max-w-[1095px] mx-auto w-full">
          <div className="w-full h-[250px] md:h-[348px] bg-gradient-to-b from-gray-300 to-gray-400 rounded-b-lg relative group">
          </div>

          <div className="px-4 md:px-8 pb-4 relative">
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between md:mb-4 -mt-[85px] md:-mt-[30px] relative z-10 gap-4 md:gap-0">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
                <div className="relative">
                  <div className="w-[168px] h-[168px] rounded-full border-4 border-white bg-white overflow-hidden shadow-sm">
                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                  </div>
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
                    {mutualFriends.length} mutual Birdies
                  </p>
                  
                  {mutualFriends.length > 0 && (
                    <div className="flex justify-center md:justify-start mt-2">
                      {mutualFriends.slice(0, 6).map((mf) => (
                        <img 
                          key={mf.id} 
                          src={mf.avatar || getDefaultAvatar(mf.gender)} 
                          className="w-8 h-8 rounded-full border-2 border-white -ml-2 first:ml-0 object-cover" 
                          alt="friend" 
                          title={mf.name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-2 mb-2 md:mb-4">
                {user.status === 'none' && (
                  <button onClick={() => handleAction('request', 'POST')} className="bg-[#1877f2] hover:bg-[#166fe5] text-white px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors shadow-sm">
                    <UserPlus size={18} />
                    Add Friend
                  </button>
                )}
                {user.status === 'request_sent' && (
                  <button onClick={() => handleAction('cancel', 'DELETE')} className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-black px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors">
                    <X size={18} />
                    Cancel Request
                  </button>
                )}
                {user.status === 'request_received' && (
                  <>
                    <button onClick={() => handleAction('accept', 'PUT')} className="bg-[#1877f2] hover:bg-[#166fe5] text-white px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors shadow-sm">
                      <Check size={18} />
                      Accept
                    </button>
                    <button onClick={() => handleAction('reject', 'DELETE')} className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-black px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors">
                      <X size={18} />
                      Reject
                    </button>
                  </>
                )}
                {user.status === 'friends' && (
                  <button onClick={() => handleAction('unfriend', 'DELETE')} className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-black px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors">
                    <UserMinus size={18} />
                    Unfriend
                  </button>
                )}
                <button onClick={() => router.push(`/messages?userId=${id}`)} className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-black px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors">
                  <img src={getDefaultAvatar()} className="w-5 h-5" alt="msg" />
                  Message
                </button>
              </div>
            </div>

            <div className="border-t border-[#ced0d4] mt-4 mb-1 w-full"></div>

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
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-[1095px] mx-auto w-full px-4">
        {renderTabContent()}
      </div>
    </div>
  );
}
