"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, Check, X, Users as UsersIcon } from "lucide-react";
import { API_URL } from "@/config/api";

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState("friends");
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const [reqRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/friends/requests`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const reqData = await reqRes.json();
      const usersData = await usersRes.json();

      if (reqRes.ok) setRequests(reqData.requests || []);
      if (usersRes.ok) setUsers(usersData.users || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, userId: string, endpoint: string, method: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/friends/${endpoint}/${userId}`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div suppressHydrationWarning className="max-w-[1000px] mx-auto w-full pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[24px] font-bold text-black ">Friends</h1>
      </div>

      <div suppressHydrationWarning className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          suppressHydrationWarning
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 rounded-full font-semibold text-[15px] whitespace-nowrap transition-colors ${activeTab === "requests" ? "bg-[#e7f3ff] text-[#1877f2]" : "bg-gray-200 text-black hover:bg-gray-300"}`}
        >
          Friend Requests ({requests.length})
        </button>
        <button 
          suppressHydrationWarning
          onClick={() => setActiveTab("suggestions")}
          className={`px-4 py-2 rounded-full font-semibold text-[15px] whitespace-nowrap transition-colors ${activeTab === "suggestions" ? "bg-[#e7f3ff] text-[#1877f2]" : "bg-gray-200 text-black hover:bg-gray-300"}`}
        >
          Suggestions
        </button>
        <button 
          suppressHydrationWarning
          onClick={() => setActiveTab("friends")}
          className={`px-4 py-2 rounded-full font-semibold text-[15px] whitespace-nowrap transition-colors ${activeTab === "friends" ? "bg-[#e7f3ff] text-[#1877f2]" : "bg-gray-200 text-black hover:bg-gray-300"}`}
        >
          All Friends
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
          
          {activeTab === "requests" && requests.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-10">No pending friend requests.</div>
          )}

          {activeTab === "requests" && requests.map((req) => (
            <div key={req.requestId} className="bg-white rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-300">
              <Link href={`/profile/${req.requester.id}`} className="block overflow-hidden relative pb-[100%]">
                <img src={req.requester.avatar} alt="User" className="absolute top-0 left-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </Link>
              <div className="p-4 bg-white relative z-10 flex flex-col justify-between">
                <Link href={`/profile/${req.requester.id}`}>
                  <h3 className="font-semibold text-[17px] text-gray-900 hover:underline truncate">{req.requester.name}</h3>
                </Link>
                <div className="flex flex-col gap-2 mt-4">
                  <button onClick={() => handleAction('accept', req.requester.id, 'accept', 'PUT')} className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white py-1.5 rounded-md font-semibold text-[15px] transition-colors">
                    Confirm
                  </button>
                  <Link href={`/profile/${req.requester.id}`} className="w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-900 py-1.5 rounded-md font-semibold text-[15px] transition-colors block">
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {activeTab === "suggestions" && users.filter(u => u.status === 'none' || u.status === 'request_sent').length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-10">No more suggestions.</div>
          )}

          {activeTab === "suggestions" && users.filter(u => u.status === 'none' || u.status === 'request_sent').map((user) => (
            <div key={user.id} className="bg-white rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-300">
              <Link href={`/profile/${user.id}`} className="block overflow-hidden relative pb-[100%]">
                <img src={user.avatar} alt="User" className="absolute top-0 left-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </Link>
              <div className="p-4 bg-white relative z-10 flex flex-col justify-between">
                <Link href={`/profile/${user.id}`}>
                  <h3 className="font-semibold text-[17px] text-gray-900 hover:underline truncate">{user.name}</h3>
                </Link>
                <div className="flex flex-col gap-2 mt-4">
                  {user.status === 'none' ? (
                    <button onClick={() => handleAction('add', user.id, 'request', 'POST')} className="w-full bg-[#e7f3ff] hover:bg-[#dbe7f2] text-[#1877f2] py-1.5 rounded-md font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors">
                      <UserPlus size={18} /> Add Friend
                    </button>
                  ) : (
                    <button onClick={() => handleAction('cancel', user.id, 'cancel', 'DELETE')} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 py-1.5 rounded-md font-semibold text-[15px] transition-colors">
                      Cancel Request
                    </button>
                  )}
                  <Link href={`/profile/${user.id}`} className="w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-900 py-1.5 rounded-md font-semibold text-[15px] transition-colors block">
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {activeTab === "friends" && users.filter(u => u.status === 'friends').length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-10">You have no friends yet.</div>
          )}

          {activeTab === "friends" && users.filter(u => u.status === 'friends').map((user) => (
            <div key={user.id} className="bg-white rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-300">
              <Link href={`/profile/${user.id}`} className="block overflow-hidden relative pb-[100%]">
                <img src={user.avatar} alt="User" className="absolute top-0 left-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </Link>
              <div className="p-4 bg-white relative z-10 flex flex-col justify-between">
                <Link href={`/profile/${user.id}`}>
                  <h3 className="font-semibold text-[17px] text-gray-900 hover:underline truncate">{user.name}</h3>
                </Link>
                <div className="flex flex-col gap-2 mt-4">
                  <button onClick={() => handleAction('unfriend', user.id, 'unfriend', 'DELETE')} className="w-full bg-[#e4e6eb] hover:bg-[#d8dadf] text-gray-900 py-1.5 rounded-md font-semibold text-[15px] transition-colors">
                    Unfriend
                  </button>
                  <Link href={`/profile/${user.id}`} className="w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-900 py-1.5 rounded-md font-semibold text-[15px] transition-colors block">
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}
