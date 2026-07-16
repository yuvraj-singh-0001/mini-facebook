"use client";

import React from "react";
import { Users, Bookmark, PlaySquare, Clock, Users2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const [user, setUser] = useState<{name: string, avatar: string} | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser({
        name: `${u.firstName} ${u.lastName}`,
        avatar: u.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
      });
    }
  }, []);

  const sidebarLinks = [
    { 
      icon: <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} className="w-8 h-8 rounded-full object-cover" alt="User" />, 
      title: user?.name || "Yuvraj Singh", 
      href: "/profile" 
    },
    { icon: <Users className="text-blue-500" size={28} />, title: "Mitra", href: "/friends" },
    { icon: <Clock className="text-blue-500" size={28} />, title: "Memories", href: "/memories" },
    { icon: <Bookmark className="text-purple-500" size={28} />, title: "Saved", href: "/saved" },
    { icon: <Users2 className="text-blue-500" size={28} />, title: "Groups", href: "/groups" },
    { icon: <PlaySquare className="text-blue-500" size={28} />, title: "Reels", href: "/video" },
    { icon: <div className="w-8 h-8 rounded-full bg-gray-200  flex items-center justify-center"><ChevronDown size={20} /></div>, title: "See more", href: "#" },
  ];
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const implementedRoutes = ["/profile", "/video", "/", "/friends"];
    if (!implementedRoutes.includes(href)) {
      e.preventDefault();
      alert("coming soon its on working");
    }
  };

  return (
    <div className="hidden xl:block w-[300px] fixed top-[56px] left-0 bottom-0 overflow-y-auto pt-4 px-2 hover-scrollbar">
      <ul className="space-y-1">
        {sidebarLinks.map((link, index) => (
          <li key={index}>
            <Link href={link.href} onClick={(e) => handleLinkClick(e, link.href)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="w-9 h-9 flex items-center justify-center rounded-full overflow-hidden">
                {link.icon}
              </div>
              <span className="font-medium text-[15px]">{link.title}</span>
            </Link>
          </li>
        ))}
      </ul>
      
      <div className="border-t border-gray-300  my-4 mx-2"></div>
      
      <div className="px-2">
        <h3 className="text-gray-500 font-semibold text-lg mb-2">Your Shortcuts</h3>
        <ul className="space-y-1">
          {/* Mock shortcuts */}
          {[1, 2, 3].map((_, idx) => (
            <li key={idx}>
              <div 
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                onClick={() => alert("coming soon its on working")}
              >
                <div className="w-9 h-9 bg-gradient-to-tr from-green-400 to-blue-500 rounded-lg shadow-sm"></div>
                <span className="font-medium text-[15px] text-gray-700 ">Cool Group {idx + 1}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="text-xs text-gray-500 mt-4 p-4 pb-10">
        Privacy · Terms · Advertising · Ad Choices · Cookies · Vaaknow © 2026
      </div>
    </div>
  );
}
