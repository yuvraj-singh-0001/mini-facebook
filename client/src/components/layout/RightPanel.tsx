"use client";

import React from "react";
import { Search, MoreHorizontal, Video } from "lucide-react";

export default function RightPanel() {
  const friends = [
    { name: "John Doe", active: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John" },
    { name: "Jane Smith", active: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane" },
    { name: "Mike Johnson", active: false, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike" },
    { name: "Emily Davis", active: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily" },
    { name: "Chris Wilson", active: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chris" },
  ];

  return (
    <div className="hidden lg:block w-[300px] fixed top-[56px] right-0 bottom-0 overflow-y-auto pt-4 px-2">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-gray-500 font-semibold text-[17px]">Contacts</h3>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full hover:bg-gray-200 :bg-fb-gray-bg-dark flex items-center justify-center cursor-pointer transition-colors text-gray-500">
            <Video size={18} />
          </div>
          <div className="w-8 h-8 rounded-full hover:bg-gray-200 :bg-fb-gray-bg-dark flex items-center justify-center cursor-pointer transition-colors text-gray-500">
            <Search size={18} />
          </div>
          <div className="w-8 h-8 rounded-full hover:bg-gray-200 :bg-fb-gray-bg-dark flex items-center justify-center cursor-pointer transition-colors text-gray-500">
            <MoreHorizontal size={18} />
          </div>
        </div>
      </div>

      <ul className="space-y-1">
        {friends.map((friend, index) => (
          <li key={index}>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 :bg-fb-gray-bg-dark transition-colors cursor-pointer relative">
              <div className="relative">
                <img src={friend.avatar} alt={friend.name} className="w-9 h-9 rounded-full bg-gray-300" />
                {friend.active && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white "></div>
                )}
              </div>
              <span className="font-medium text-[15px]">{friend.name}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
