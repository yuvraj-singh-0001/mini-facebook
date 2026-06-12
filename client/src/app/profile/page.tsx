"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Camera, Plus, PenSquare, ChevronDown, MoreHorizontal, Image as ImageIcon, MapPin, Briefcase, GraduationCap, Heart, Clock } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const fullName = user ? `${user.firstName} ${user.lastName}` : "Loading...";
  const avatar = user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default";

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#f0f2f5]  text-fb-text-dark  pt-[56px] pb-10">
      <Navbar />

      {/* Header Section (Cover + Avatar + Info) */}
      <div className="bg-white  shadow-sm w-full">
        <div className="max-w-[1095px] mx-auto w-full">
          
          {/* Cover Photo */}
          <div className="w-full h-[250px] md:h-[348px] bg-gradient-to-b from-gray-300 to-gray-400   rounded-b-lg relative group">
            <button className="absolute bottom-4 right-4 bg-white  hover:bg-gray-100 :bg-gray-600 text-black  px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-2 transition-colors">
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
                  <div className="w-[168px] h-[168px] rounded-full border-4 border-white  bg-white  overflow-hidden">
                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <button className="absolute bottom-2 right-2 w-9 h-9 bg-gray-200 hover:bg-gray-300  :bg-gray-600 rounded-full flex items-center justify-center border border-gray-300  transition-colors">
                    <Camera size={20} className="text-black " />
                  </button>
                </div>
                
                <div className="text-center md:text-left mb-2 md:mb-4">
                  <h1 className="text-[32px] font-bold text-black  leading-tight">{fullName}</h1>
                  <p className="text-[#65676B]  font-semibold text-[15px]">1.2K friends</p>
                  
                  {/* Fake friends avatars */}
                  <div className="flex justify-center md:justify-start mt-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <img 
                        key={i} 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} 
                        className="w-8 h-8 rounded-full border-2 border-white  -ml-2 first:ml-0" 
                        alt="friend" 
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mb-2 md:mb-4">
                <button className="bg-[#1877f2] hover:bg-[#166fe5] text-white px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors">
                  <Plus size={18} />
                  Add to story
                </button>
                <button className="bg-[#e4e6eb] hover:bg-[#d8dadf]  :bg-gray-600 text-black  px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors">
                  <PenSquare size={18} />
                  Edit profile
                </button>
                <button className="bg-[#e4e6eb] hover:bg-[#d8dadf]  :bg-gray-600 text-black  px-3 py-1.5 rounded-md flex items-center transition-colors">
                  <ChevronDown size={18} />
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
              <button className="hidden sm:flex bg-[#e4e6eb] hover:bg-[#d8dadf]  :bg-gray-600 text-black  p-2 rounded-md transition-colors">
                <MoreHorizontal size={20} />
              </button>
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
              <p className="text-[15px] text-black ">Living life to the fullest! 🌟</p>
              <button className="bg-[#e4e6eb] hover:bg-[#d8dadf]  :bg-gray-600 w-full mt-3 py-1.5 rounded-md font-semibold text-[15px] text-black  transition-colors">
                Edit bio
              </button>
            </div>
            
            <div className="flex flex-col gap-3 text-[15px] text-black  mb-4">
              <div className="flex items-center gap-2"><Briefcase size={20} className="text-gray-500" /> Works at Software Engineer</div>
              <div className="flex items-center gap-2"><GraduationCap size={20} className="text-gray-500" /> Studied at University of Tech</div>
              <div className="flex items-center gap-2"><MapPin size={20} className="text-gray-500" /> Lives in New Delhi, India</div>
              <div className="flex items-center gap-2"><Heart size={20} className="text-gray-500" /> Single</div>
              <div className="flex items-center gap-2"><Clock size={20} className="text-gray-500" /> Joined June 2026</div>
            </div>

            <button className="bg-[#e4e6eb] hover:bg-[#d8dadf]  :bg-gray-600 w-full py-1.5 rounded-md font-semibold text-[15px] text-black  transition-colors">
              Edit details
            </button>
            <button className="bg-[#e4e6eb] hover:bg-[#d8dadf]  :bg-gray-600 w-full mt-3 py-1.5 rounded-md font-semibold text-[15px] text-black  transition-colors">
              Add hobbies
            </button>
            <button className="bg-[#e4e6eb] hover:bg-[#d8dadf]  :bg-gray-600 w-full mt-3 py-1.5 rounded-md font-semibold text-[15px] text-black  transition-colors">
              Add features
            </button>
          </div>

          {/* Photos Card */}
          <div className="bg-white  rounded-lg shadow-sm p-4 w-full border border-gray-200 ">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[20px] font-bold text-black ">Photos</h2>
              <button className="text-[#1877f2] hover:bg-blue-50 :bg-gray-800 px-2 py-1 rounded-md text-[15px] transition-colors">See all photos</button>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
              {[1,2,3,4,5,6,7,8,9].map((i) => (
                <div key={i} className="aspect-square bg-gray-200  hover:opacity-90 cursor-pointer">
                  <img src={`https://source.unsplash.com/random/200x200?sig=${i}`} alt="photo" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Right Column (Scrollable Feed) */}
        <div className="w-full lg:w-[60%] flex flex-col gap-4">
          
          {/* Create Post Component */}
          <div className="bg-white  rounded-lg shadow-sm p-4 w-full border border-gray-200 ">
            <div className="flex gap-2 mb-3">
              <img src={avatar} alt="User" className="w-10 h-10 rounded-full" />
              <div className="flex-1 bg-[#f0f2f5] [#3a3b3c] hover:bg-[#e4e6eb] :bg-[#4e4f50] rounded-full px-4 py-2 flex items-center cursor-pointer transition-colors">
                <span className="text-[#65676B] [#b0b3b8] text-[17px]">What's on your mind?</span>
              </div>
            </div>
            <div className="border-t border-[#ced0d4]  mb-3 w-full"></div>
            <div className="flex justify-between">
              <button className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-[#f0f2f5] :bg-[#3a3b3c] rounded-lg transition-colors text-[#65676B] [#b0b3b8] font-semibold">
                <span className="text-red-500"><ImageIcon size={24} /></span>
                <span className="hidden sm:inline">Live video</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-[#f0f2f5] :bg-[#3a3b3c] rounded-lg transition-colors text-[#65676B] [#b0b3b8] font-semibold">
                <span className="text-green-500"><ImageIcon size={24} /></span>
                Photo/video
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-[#f0f2f5] :bg-[#3a3b3c] rounded-lg transition-colors text-[#65676B] [#b0b3b8] font-semibold">
                <span className="text-yellow-500"><ImageIcon size={24} /></span>
                <span className="hidden sm:inline">Life event</span>
              </button>
            </div>
          </div>

          {/* Posts Filter / Manager */}
          <div className="bg-white  rounded-lg shadow-sm p-4 w-full border border-gray-200  flex justify-between items-center">
            <h2 className="text-[20px] font-bold text-black ">Posts</h2>
            <div className="flex gap-2">
              <button className="bg-[#e4e6eb] hover:bg-[#d8dadf]  :bg-gray-600 text-black  px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors">
                Filters
              </button>
              <button className="bg-[#e4e6eb] hover:bg-[#d8dadf]  :bg-gray-600 text-black  px-3 py-1.5 rounded-md font-semibold text-[15px] flex items-center gap-1.5 transition-colors">
                Manage posts
              </button>
            </div>
          </div>

          {/* Fake Post Feed */}
          {[1, 2].map((i) => (
            <div key={i} className="bg-white  rounded-lg shadow-sm p-4 w-full border border-gray-200  mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <img src={avatar} alt="User" className="w-10 h-10 rounded-full" />
                  <div>
                    <h3 className="font-bold text-[15px] text-black  hover:underline cursor-pointer">{fullName}</h3>
                    <p className="text-[13px] text-[#65676B] [#b0b3b8] hover:underline cursor-pointer">
                      {i * 2} hours ago
                    </p>
                  </div>
                </div>
                <button className="w-9 h-9 rounded-full hover:bg-gray-100 :bg-gray-700 flex items-center justify-center text-gray-500 transition-colors">
                  <MoreHorizontal size={20} />
                </button>
              </div>
              <p className="text-[15px] text-black  mb-3">
                {i === 1 ? "Just updated my profile picture! Feeling great today. 🚀" : "Learning how to build amazing clones of Facebook! #coding #webdev"}
              </p>
              {i === 1 && (
                <div className="rounded-lg overflow-hidden border border-gray-200  -mx-4 mb-3">
                  <img src={avatar} alt="Post content" className="w-full" />
                </div>
              )}
              
              <div className="flex justify-between text-[#65676B] [#b0b3b8] text-[15px] pb-3 border-b border-gray-200  mb-1">
                <span>❤️👍 {i * 12 + 5}</span>
                <span>{i * 3} comments · {i} shares</span>
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
