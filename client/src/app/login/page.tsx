"use client";

import React, { useState } from "react";
import Link from "next/link";
import { API_URL } from "@/config/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // Save token and redirect
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#f0f2f5] flex items-center justify-center z-[100] px-4 font-sans">
      <div className="max-w-[980px] w-full flex flex-col md:flex-row items-center justify-between gap-10 pb-20">
        
        {/* Left Side Branding */}
        <div className="flex-1 text-center md:text-left mb-8 md:mb-0 md:pr-8">
          <h1 className="text-5xl md:text-[60px] font-bold text-[#1877f2] mb-4 tracking-tight -ml-2">Vaaknow</h1>
          <p className="text-2xl md:text-[28px] text-[#1c1e21] leading-[34px] font-normal w-full md:w-[500px]">
            A safe, moderated social platform for students (ages 6–16) to connect with Birdies and share clean Chirps & Reels.
          </p>
        </div>

        {/* Right Side Login Form */}
        <div className="w-full max-w-[396px] pt-4">
          <div className="bg-white p-4 pt-5 pb-6 rounded-[8px] shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)] border-none">
            {error && <div className="mb-4 p-3 bg-red-100 text-red-600 text-sm rounded border border-red-200 text-center">{error}</div>}
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input 
                type="text" 
                placeholder="Email address or phone number" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[52px] px-[16px] py-[14px] text-[17px] border border-[#dddfe2] rounded-[6px] focus:outline-none focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2] bg-white text-[#1c1e21] placeholder-[#90949c]"
                required
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[52px] px-[16px] py-[14px] text-[17px] border border-[#dddfe2] rounded-[6px] focus:outline-none focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2] bg-white text-[#1c1e21] placeholder-[#90949c]"
                required
              />
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-50 text-white font-bold text-[20px] h-[48px] rounded-[6px] transition-colors mt-2"
              >
                {loading ? "Logging In..." : "Log In"}
              </button>
            </form>

            <div className="text-center mt-4 mb-5">
              <a href="#" className="text-[#1877f2] text-[14px] hover:underline font-medium">Forgotten password?</a>
            </div>

            <div className="border-t border-[#dadde1] mx-4 mb-6"></div>

            <div className="text-center pb-2">
              <Link href="/signup" className="bg-[#42b72a] hover:bg-[#36a420] text-white font-bold text-[17px] h-[48px] px-4 rounded-[6px] transition-colors inline-flex items-center justify-center">
                Create new account
              </Link>
            </div>
          </div>
          <div className="text-center mt-7 text-[14px] text-[#1c1e21]">
            <a href="#" className="font-bold hover:underline">Create a Page</a> for a celebrity, brand or business.
          </div>
        </div>

      </div>
    </div>
  );
}
