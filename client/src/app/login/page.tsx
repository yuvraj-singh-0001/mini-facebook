"use client";

import React, { useState } from "react";
import Link from "next/link";
import { API_URL } from "@/config/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      let response: Response;
      try {
        response = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailOrPhone: email, password }),
          signal: controller.signal,
        });
      } catch (err: any) {
        // Network error - server not reachable
        if (err?.name === "AbortError") {
          throw new Error("Login timeout ho gaya. Server ya database connection check karo.");
        }
        throw new Error("Unable to connect to server. Please check your internet connection and try again.");
      }

      const data = await response.json();

      if (response.status === 400) {
        // Invalid credentials
        throw new Error("❌ Incorrect email/phone or password. Please try again.");
      } else if (response.status === 403) {
        // Account suspended
        throw new Error(data.message || "⚠️ Your account has been suspended. Please contact support.");
      } else if (response.status === 500) {
        throw new Error("⚠️ Server error. Please try again later.");
      } else if (response.status === 503) {
        throw new Error(data.message || "Server database se connect nahi ho pa raha. Please retry.");
      } else if (!response.ok) {
        throw new Error(data.message || "Something went wrong. Please try again.");
      }

      // Save token and redirect
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#f0f2f5] flex items-center justify-center z-[100] px-4 font-sans">
      <div className="max-w-[980px] w-full flex flex-col md:flex-row items-center justify-between gap-10 pb-20">

        {/* Left Side Branding */}
        <div className="flex-1 text-center md:text-left mb-8 md:mb-0 md:pr-8 flex flex-col items-center md:items-start">
          <img src="/vaaknowlogo.png" alt="Vaaknow Logo" className="h-16 md:h-20 w-auto object-contain mb-4 -ml-2" />
          <p className="text-2xl md:text-[28px] text-[#1c1e21] leading-[34px] font-normal w-full md:w-[500px]">
            A safe, moderated social platform for students (ages 6–16) to connect with Birdies and share clean Chirps &amp; Reels.
          </p>
        </div>

        {/* Right Side Login Form */}
        <div className="w-full max-w-[396px] pt-4">
          <div className="bg-white p-4 pt-5 pb-6 rounded-[8px] shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)] border-none">
            {error && <div className="mb-4 p-3 bg-red-100 text-red-600 text-sm rounded border border-red-200 text-center">{error}</div>}
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                id="login-email"
                type="text"
                placeholder="Email address or phone number"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[52px] px-[16px] py-[14px] text-[17px] border border-[#dddfe2] rounded-[6px] focus:outline-none focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2] bg-white text-[#1c1e21] placeholder-[#90949c]"
                required
              />
              {/* Password with eye icon */}
              <div className="relative flex items-center">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[52px] px-[16px] pr-[48px] py-[14px] text-[17px] border border-[#dddfe2] rounded-[6px] focus:outline-none focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2] bg-white text-[#1c1e21] placeholder-[#90949c]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 text-[#65676b] hover:text-[#1877f2] flex items-center justify-content p-1 rounded-full transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              <button
                id="login-submit"
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
              <Link
                href="/signup"
                className="bg-[#42b72a] hover:bg-[#36a420] text-white font-bold text-[17px] h-[48px] px-4 rounded-[6px] transition-colors inline-flex items-center justify-center"
              >
                Create new account
              </Link>
            </div>
          </div>

          {/* Don't have an account */}
          <div className="text-center mt-5 text-[14px] text-[#65676b]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#1877f2] font-semibold hover:underline">
              Sign up for free
            </Link>
          </div>
        </div>

      </div>

      {/* Mobile-only styles: single screen, no scroll */}
      <style jsx>{`
        @media (max-width: 600px) {
          /* make the outer wrapper scroll-free on mobile */
          .fixed {
            overflow: hidden;
          }
        }

        /* Mobile: stack vertically and compress to fit one screen */
        @media (max-width: 767px) {
          /* The two-col row */
          .flex-col {
            gap: 12px !important;
            padding-bottom: 0 !important;
          }

          /* Heading: use clamp so it never cuts on any phone */
          h1 {
            font-size: clamp(34px, 9vw, 48px) !important;
            margin-left: 0 !important;
            white-space: nowrap;
          }

          /* Subtitle smaller on mobile */
          p.text-2xl {
            font-size: 14px !important;
            line-height: 1.4 !important;
          }

          /* Card padding compact */
          .bg-white {
            padding: 14px 14px 16px !important;
          }

          /* Inputs slightly shorter */
          input[type="text"],
          input[type="password"],
          input[type="email"] {
            height: 44px !important;
            font-size: 15px !important;
          }

          /* Buttons compact */
          .h-\\[48px\\] {
            height: 42px !important;
          }
        }

        /* Extra small (≤ 380px) */
        @media (max-width: 380px) {
          h1 {
            font-size: 30px !important;
          }
          p.text-2xl {
            font-size: 13px !important;
          }
          input[type="text"],
          input[type="password"],
          input[type="email"] {
            height: 40px !important;
            font-size: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
