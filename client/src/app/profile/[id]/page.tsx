"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Camera, Plus, PenSquare, ChevronDown, MoreHorizontal, Image as ImageIcon, MapPin, Briefcase, GraduationCap, Heart, Clock, UserPlus, Check, X, UserMinus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function DynamicProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mutualFriends, setMutualFriends] = useState<any[]>([]);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5002/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        if (data.user.status === 'self') {
          router.push('/profile');
          return;
        }
        setUser(data.user);
        
        // Fetch mutual friends if not self
        const mutualRes = await fetch(`http://localhost:5002/api/friends/mutual/${id}`, {
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

  const handleAction = async (endpoint: string, method: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5002/api/friends/${endpoint}/${id}`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProfile(); // Refresh status
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#f0f2f5]  pt-[56px] flex justify-center items-center"><div className="text-xl">Loading...</div></div>;
  if (!user) return <div className="min-h-screen bg-[#f0f2f5]  pt-[56px] flex justify-center items-center"><div className="text-xl">User not found.</div></div>;

  const fullName = user.name;
  const avatar = user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default";

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#f0f2f5]  text-fb-text-dark  pt-[56px] pb-10">
      <Navbar />

      {/* Header Section (Cover + Avatar + Info) */}
      <div className="bg-white  shadow-sm w-full">
        <div className="max-w-[1095px] mx-auto w-full">
          
          {/* Cover Photo */}
          <div className="w-full h-[250px] md:h-[348px] bg-gradient-to-b from-gray-300 to-gray-400   rounded-b-lg relative group">
          </div>

          {/* Profile Info & Avatar */}
          <div className="px-4 md:px-8 pb-4 relative">
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between md:mb-4 -mt-[85px] md:-mt-[30px] relative z-10 gap-4 md:gap-0">
              
              {/* Avatar and Name */}
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
                <div className="relative">
                  <div className="w-[168px] h-[168px] rounded-full border-4 border-white  bg-white  overflow-hidden">
                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                </div>
                
                <div className="text-center md:text-left mb-2 md:mb-4">
                  <h1 className="text-[32px] font-bold text-black  leading-tight">{fullName}</h1>
                  <p className="text-[#65676B]  font-semibold text-[15px] hover:underline cursor-pointer">
                    {mutualFriends.length} mutual friends
                  </p>
                  
                  {/* Mutual friends avatars */}
                  {mutualFriends.length > 0 && (
                    <div className="flex justify-center md:justify-start mt-2">
                      {mutualFriends.slice(0, 6).map((mf) => (
                        <img 
                          key={mf.id} 
                          src={mf.avatar} 
                          className="w-8 h-8 rounded-full border-2 border-white  -ml-2 first:ml-0" 
                          alt="friend" 
                          title={mf.name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons based on status */}
              <div className="flex flex-wrap justify-center items-center gap-2 mb-2 md:mb-4">
                {user.status === 'none' && (
                  <button onClick={() => handleAction('request', 'POST')} className="bg-[#1877f2] hover:bg-[#166fe5] text-white px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors">
                    <UserPlus size={18} />
                    Add Friend
                  </button>
                )}
                {user.status === 'request_sent' && (
                  <button onClick={() => handleAction('cancel', 'DELETE')} className="bg-[#e4e6eb] hover:bg-[#d8dadf]  :bg-gray-600 text-black  px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors">
                    <X size={18} />
                    Cancel Request
                  </button>
                )}
                {user.status === 'request_received' && (
                  <>
                    <button onClick={() => handleAction('accept', 'PUT')} className="bg-[#1877f2] hover:bg-[#166fe5] text-white px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors">
                      <Check size={18} />
                      Accept
                    </button>
                    <button onClick={() => handleAction('reject', 'DELETE')} className="bg-[#e4e6eb] hover:bg-[#d8dadf]  :bg-gray-600 text-black  px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors">
                      <X size={18} />
                      Reject
                    </button>
                  </>
                )}
                {user.status === 'friends' && (
                  <button onClick={() => handleAction('unfriend', 'DELETE')} className="bg-[#e4e6eb] hover:bg-[#d8dadf]  :bg-gray-600 text-black  px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors">
                    <UserMinus size={18} />
                    Unfriend
                  </button>
                )}
                <button className="bg-[#e4e6eb] hover:bg-[#d8dadf]  :bg-gray-600 text-black  px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=messenger" className="w-5 h-5" alt="msg" />
                  Message
                </button>
              </div>
            </div>

            <div className="border-t border-[#ced0d4]  mt-4 mb-1 w-full"></div>

            {/* Profile Navigation Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex overflow-x-auto hide-scrollbar">
                {["Posts", "About", "Friends", "Photos", "Videos", "Check-ins"].map((tab, idx) => (
                  <button 
                    key={tab} 
                    className={`px-4 py-4 font-semibold text-[15px] whitespace-nowrap ${idx === 0 ? 'text-[#1877f2] border-b-[3px] border-[#1877f2]' : 'text-[#65676B]  hover:bg-gray-100 :bg-gray-800 rounded-md my-1'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Body Section (2-Column Content) */}
      <div className="max-w-[1095px] mx-auto w-full px-4 mt-4 flex flex-col lg:flex-row gap-4 items-start">
        
        {/* Left Column (Sticky on large screens) */}
        <div className="w-full lg:w-[40%] flex flex-col gap-4 lg:sticky lg:top-[72px]">
          
          {/* Intro Card */}
          <div className="bg-white  rounded-lg shadow-sm p-4 w-full border border-gray-200 ">
            <h2 className="text-[20px] font-bold mb-4 text-black ">Intro</h2>
            <div className="text-center mb-4">
              <p className="text-[15px] text-black ">Just exploring Mini-Facebook!</p>
            </div>
            
            <div className="flex flex-col gap-3 text-[15px] text-black  mb-4">
              <div className="flex items-center gap-2"><Briefcase size={20} className="text-gray-500" /> Works at Tech Inc.</div>
              <div className="flex items-center gap-2"><MapPin size={20} className="text-gray-500" /> Lives in World</div>
              <div className="flex items-center gap-2"><Clock size={20} className="text-gray-500" /> Joined June 2026</div>
            </div>
          </div>

          {/* Mutual Friends Card */}
          <div className="bg-white  rounded-lg shadow-sm p-4 w-full border border-gray-200 ">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[20px] font-bold text-black ">Mutual Friends</h2>
              <button className="text-[#1877f2] hover:bg-blue-50 :bg-gray-800 px-2 py-1 rounded-md text-[15px] transition-colors">See all</button>
            </div>
            {mutualFriends.length === 0 ? (
              <p className="text-gray-500 text-sm">No mutual friends yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 rounded-lg">
                {mutualFriends.map((mf) => (
                  <div key={mf.id} className="flex flex-col gap-1 cursor-pointer group">
                    <img src={mf.avatar} alt="friend" className="w-full aspect-square object-cover rounded-lg group-hover:opacity-90" />
                    <span className="text-[13px] font-semibold text-black  truncate">{mf.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>

        {/* Right Column (Scrollable Feed) */}
        <div className="w-full lg:w-[60%] flex flex-col gap-4">
          
          {/* Fake Post Feed */}
          {[1].map((i) => (
            <div key={i} className="bg-white  rounded-lg shadow-sm p-4 w-full border border-gray-200  mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <img src={avatar} alt="User" className="w-10 h-10 rounded-full" />
                  <div>
                    <h3 className="font-bold text-[15px] text-black  hover:underline cursor-pointer">{fullName}</h3>
                    <p className="text-[13px] text-[#65676B] [#b0b3b8] hover:underline cursor-pointer">
                      Yesterday at 10:00 AM
                    </p>
                  </div>
                </div>
                <button className="w-9 h-9 rounded-full hover:bg-gray-100 :bg-gray-700 flex items-center justify-center text-gray-500 transition-colors">
                  <MoreHorizontal size={20} />
                </button>
              </div>
              <p className="text-[15px] text-black  mb-3">
                Hello world! This is {fullName}'s timeline.
              </p>
              
              <div className="flex justify-between text-[#65676B] [#b0b3b8] text-[15px] pb-3 border-b border-gray-200  mb-1">
                <span>❤️👍 42</span>
                <span>5 comments · 1 share</span>
              </div>
              
              <div className="flex justify-between pt-1">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 :bg-gray-700 rounded-md font-semibold text-[#65676B] [#b0b3b8] transition-colors">
                  Like
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 :bg-gray-700 rounded-md font-semibold text-[#65676B] [#b0b3b8] transition-colors">
                  Comment
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 :bg-gray-700 rounded-md font-semibold text-[#65676B] [#b0b3b8] transition-colors">
                  Share
                </button>
              </div>
            </div>
          ))}

        </div>
      </div>

    </div>
  );
}
