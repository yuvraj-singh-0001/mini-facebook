"use client";

import React from "react";
import { Search, Home, Users, Bell, MessageCircle, Menu, Grid } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [avatar, setAvatar] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Felix");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.avatar) setAvatar(user.avatar);
    }
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 h-[56px] bg-white dark:bg-fb-dark-panel shadow-sm z-50 px-4 flex items-center justify-between">
      {/* Left section: Logo & Search */}
      <div className="flex items-center gap-2">
        <Link href="/" className="text-fb-blue hover:opacity-90">
          {/* Fake Facebook Logo */}
          <div className="w-10 h-10 bg-fb-blue rounded-full flex items-center justify-center text-white font-bold text-2xl pb-1">
            f
          </div>
        </Link>
        <div className="hidden md:flex items-center bg-gray-100 dark:bg-fb-gray-bg-dark rounded-full px-3 py-2 w-64 ml-2">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search Mini-Facebook"
            className="bg-transparent border-none outline-none ml-2 w-full text-sm placeholder-gray-500 text-fb-text-dark dark:text-fb-text-light"
          />
        </div>
        <div className="md:hidden w-10 h-10 bg-gray-100 dark:bg-fb-gray-bg-dark rounded-full flex items-center justify-center cursor-pointer">
          <Search size={20} className="text-gray-500 dark:text-gray-300" />
        </div>
      </div>

      {/* Center section: Navigation Icons */}
      <div className="hidden md:flex flex-1 justify-center max-w-2xl gap-2">
        <NavItem icon={<Home size={28} />} active tooltip="Home" />
        <NavItem icon={<Users size={28} />} tooltip="Friends" />
        <NavItem icon={<Grid size={28} />} tooltip="Menu" />
      </div>

      {/* Right section: User Actions */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2">
          <ActionButton icon={<Menu size={20} />} />
          <ActionButton icon={<MessageCircle size={20} />} />
          <ActionButton icon={<Bell size={20} />} badge="3" />
        </div>
        <Link href="/profile" className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden cursor-pointer ml-2 hover:opacity-90 transition-opacity block">
          <img
            src={avatar}
            alt="User profile"
            className="w-full h-full object-cover"
          />
        </Link>
      </div>
    </nav>
  );
}

function NavItem({ icon, active, tooltip }: { icon: React.ReactNode; active?: boolean; tooltip: string }) {
  return (
    <div
      className={`px-8 py-2 rounded-lg cursor-pointer flex items-center justify-center transition-colors relative group
        ${active ? "text-fb-blue" : "text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-fb-gray-bg-dark"}
      `}
    >
      {icon}
      {active && (
        <div className="absolute bottom-[-10px] left-0 right-0 h-[3px] bg-fb-blue rounded-t-md"></div>
      )}
      
      {/* Tooltip */}
      <div className="absolute top-12 bg-black text-white text-xs px-3 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
        {tooltip}
      </div>
    </div>
  );
}

function ActionButton({ icon, badge }: { icon: React.ReactNode; badge?: string }) {
  return (
    <div className="w-10 h-10 bg-gray-200 hover:bg-gray-300 dark:bg-fb-gray-bg-dark dark:hover:bg-gray-600 rounded-full flex items-center justify-center cursor-pointer relative transition-colors text-black dark:text-white">
      {icon}
      {badge && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-fb-dark-panel">
          {badge}
        </div>
      )}
    </div>
  );
}
