"use client";

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Menu, Shield, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Security State
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if they already verified in this session
    const verified = sessionStorage.getItem('admin_verified');
    if (verified === 'true') {
      setIsPinVerified(true);
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setIsChecking(true);
    
    // Simulate network delay for premium feel
    setTimeout(() => {
      if (pin === '7055') {
        setIsPinVerified(true);
        sessionStorage.setItem('admin_verified', 'true');
        sessionStorage.setItem('admin_pin', '7055');
      } else {
        setError(true);
        setPin('');
      }
      setIsChecking(false);
    }, 600);
  };

  // Prevent hydration errors by not rendering until client is ready
  if (!isClient) return null;

  // PIN Entry Screen
  if (!isPinVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-white/10" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 80%)' }}></div>
            <Shield className="w-16 h-16 text-white mx-auto mb-4 relative z-10" />
            <h1 className="text-2xl font-bold text-white relative z-10">Admin Access</h1>
            <p className="text-blue-100 text-sm mt-2 relative z-10">This area is highly restricted.</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter 4-Digit Security PIN</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="password" 
                    maxLength={4}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, ''));
                      setError(false);
                    }}
                    placeholder="••••"
                    className={`w-full pl-12 pr-4 py-4 text-center tracking-[1em] text-2xl font-bold bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${
                      error ? 'border-rose-300 focus:ring-rose-500 bg-rose-50 text-rose-500' : 'border-gray-200 focus:ring-blue-500 focus:bg-white text-gray-900'
                    }`}
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="text-rose-500 text-sm mt-2 text-center animate-in slide-in-from-top-1">
                    Incorrect PIN. Access denied.
                  </p>
                )}
              </div>
              
              <button 
                type="submit" 
                disabled={pin.length !== 4 || isChecking}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {isChecking ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Unlock Panel <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Normal Admin Panel
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      {isMobile && (
        <div className="flex items-center justify-between bg-white border-b border-gray-200 p-4 sticky top-0 z-30">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Admin Panel
          </span>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-gray-100 rounded-lg text-gray-600"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      )}

      <AdminSidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isMobile={isMobile} 
      />
      
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Main Content Area */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out min-h-screen ${
          !isMobile ? (isSidebarOpen ? 'md:ml-64' : 'md:ml-20') : 'ml-0'
        }`}
      >
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
