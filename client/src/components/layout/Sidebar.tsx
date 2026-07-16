"use client";

import React from "react";
import { Users, Bookmark, PlaySquare, Clock, Users2, ChevronDown, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getDefaultAvatar } from '@/lib/utils';

export default function Sidebar() {
  const [user, setUser] = useState<{name: string, avatar: string} | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const u = JSON.parse(storedUser);
      let avatar = u.avatar;
      if (avatar && (avatar.includes('dicebear.com') || avatar === '/default-avatar.svg')) {
        avatar = null; // fall through to getDefaultAvatar
        u.avatar = null;
        localStorage.setItem("user", JSON.stringify(u));
      }
      setUser({
        name: `${u.firstName} ${u.lastName}`,
        avatar: avatar || getDefaultAvatar(u.gender)
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("storage"));
    router.push("/auth");
  };

  const sidebarLinks = [
    { 
      icon: <img src={user?.avatar || getDefaultAvatar()} className="w-8 h-8 rounded-full object-cover" alt="User" />, 
      title: user?.name || "Yuvraj Singh", 
      href: "/profile" 
    },
    { icon: <Users className="text-blue-500" size={28} />, title: "Mitra", href: "/friends" },
    { icon: <Clock className="text-blue-500" size={28} />, title: "Memories", href: "/memories" },
    { icon: <Bookmark className="text-purple-500" size={28} />, title: "Saved", href: "/saved" },
    { icon: <Users2 className="text-blue-500" size={28} />, title: "Groups", href: "/groups" },
    { icon: <PlaySquare className="text-blue-500" size={28} />, title: "Reels", href: "/video" },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const implementedRoutes = ["/profile", "/video", "/", "/friends"];
    if (!implementedRoutes.includes(href)) {
      e.preventDefault();
      alert("coming soon its on working");
    }
  };

  return (
    <>
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

          {/* Logout Button — "See more" ke upar */}
          <li>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer group"
            >
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-red-100 group-hover:bg-red-200 transition-colors">
                <LogOut size={20} className="text-red-500" />
              </div>
              <span className="font-medium text-[15px] text-red-500">Log Out</span>
            </button>
          </li>

          {/* See more */}
          <li>
            <Link href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
              <div className="w-9 h-9 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <ChevronDown size={20} />
                </div>
              </div>
              <span className="font-medium text-[15px]">See more</span>
            </Link>
          </li>
        </ul>
        
        <div className="border-t border-gray-300 my-4 mx-2"></div>
        
        <div className="px-2">
          <h3 className="text-gray-500 font-semibold text-lg mb-2">Your Shortcuts</h3>
          <ul className="space-y-1">
            {[1, 2, 3].map((_, idx) => (
              <li key={idx}>
                <div 
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                  onClick={() => alert("coming soon its on working")}
                >
                  <div className="w-9 h-9 bg-gradient-to-tr from-green-400 to-blue-500 rounded-lg shadow-sm"></div>
                  <span className="font-medium text-[15px] text-gray-700">Cool Group {idx + 1}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="text-xs text-gray-500 mt-4 p-4 pb-10">
          Privacy · Terms · Advertising · Ad Choices · Cookies · Vaaknow © 2026
        </div>
      </div>

      {/* Logout Confirm Modal — overflow ke BAHAR, full viewport par */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[320px] p-6 flex flex-col items-center gap-4 border border-gray-100">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
              <LogOut size={26} className="text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="text-[17px] font-bold text-gray-900">Log Out?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Kya aap <span className="font-semibold text-gray-700">{user?.name}</span> ke account se logout karna chahte hain?
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
    </>
  );
}
