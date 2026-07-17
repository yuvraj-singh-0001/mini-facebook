"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Settings, Menu, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile?: boolean;
}

const AdminSidebar = ({ isOpen, setIsOpen, isMobile }: AdminSidebarProps) => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Posts', href: '/admin/posts', icon: FileText },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out flex flex-col ${
        isMobile
          ? (isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64')
          : (isOpen ? 'translate-x-0 w-64' : 'translate-x-0 w-20')
      }`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {(isOpen || isMobile) && (
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Admin Panel
          </span>
        )}
        {!isMobile && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105 mx-auto"
            aria-label="Toggle Sidebar"
          >
            {isOpen ? <ChevronLeft className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
          </button>
        )}
        {isMobile && (
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => isMobile && setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 transform hover:-translate-y-1 group shadow-sm hover:shadow-md ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium ring-1 ring-blue-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
              }`}
            >
              <div className={`${(!isOpen && !isMobile) && 'mx-auto'}`}>
                <Icon
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isActive ? 'scale-110 text-blue-600' : 'text-gray-500 group-hover:scale-110 group-hover:text-blue-500'
                  }`}
                />
              </div>
              {(isOpen || isMobile) && <span>{item.name}</span>}
              {(!isOpen && !isMobile) && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 hover:-translate-y-0.5 ${(!isOpen && !isMobile) && 'justify-center'}`}>
           <Menu className="w-5 h-5" />
           {(isOpen || isMobile) && <span>Back to Main Site</span>}
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
