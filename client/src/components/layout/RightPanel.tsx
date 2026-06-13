"use client";

import React, { useState, useEffect } from "react";
import { Search, MoreHorizontal, Video } from "lucide-react";
import Link from "next/link";

export default function RightPanel() {
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;
        const user = JSON.parse(storedUser);
        const token = localStorage.getItem("token");

        const res = await fetch(`http://localhost:5002/api/friends/list/${user.id || user._id}`, {
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
    fetchFriends();
  }, []);

  return (
    <div className="hidden lg:block w-[300px] fixed top-[56px] right-0 bottom-0 overflow-y-auto pt-4 px-2">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-gray-500 font-semibold text-[17px]">Contacts</h3>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors text-gray-500">
            <Video size={18} />
          </div>
          <div className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors text-gray-500">
            <Search size={18} />
          </div>
          <div className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors text-gray-500">
            <MoreHorizontal size={18} />
          </div>
        </div>
      </div>

      <ul className="space-y-1">
        {friends.length === 0 ? (
          <p className="text-center text-sm text-gray-500 mt-4 px-4">You have no friends yet. Add some to see them here!</p>
        ) : (
          friends.map((friend) => (
            <li key={friend.id}>
              <Link href={`/messages?userId=${friend.id}`}>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer relative">
                  <div className="relative">
                    <img src={friend.avatar} alt={friend.name} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                    {/* Hardcoding active status for UI feel */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <span className="font-medium text-[15px] text-gray-900">{friend.name}</span>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
