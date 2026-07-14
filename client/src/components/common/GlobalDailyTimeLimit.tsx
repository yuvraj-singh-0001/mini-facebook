"use client";

import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { usePathname } from 'next/navigation';

const MAX_APP_SECONDS = 900; // 15 minutes total daily limit
const STORAGE_DATE_KEY = 'vaaknow_app_usage_date';
const STORAGE_SECONDS_KEY = 'vaaknow_app_usage_seconds';

export function GlobalDailyTimeLimit() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [secondsUsed, setSecondsUsed] = useState<number>(0);
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);
  const [minimized, setMinimized] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const isAuthPage = pathname === '/login' || pathname === '/signup';
        const validAuth = Boolean(token && !isAuthPage);
        setIsLoggedIn(validAuth);
        if (!validAuth) {
          setShowLimitModal(false);
        }
      } catch {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [pathname]);

  useEffect(() => {
    if (!isLoggedIn) return;

    // Load stored usage for today
    try {
      const today = new Date().toDateString();
      const savedDate = localStorage.getItem(STORAGE_DATE_KEY);
      const savedSeconds = localStorage.getItem(STORAGE_SECONDS_KEY);

      if (savedDate !== today) {
        localStorage.setItem(STORAGE_DATE_KEY, today);
        localStorage.setItem(STORAGE_SECONDS_KEY, '0');
        setSecondsUsed(0);
      } else if (savedSeconds) {
        const parsed = parseInt(savedSeconds, 10) || 0;
        setSecondsUsed(parsed);
        if (parsed >= MAX_APP_SECONDS) {
          setShowLimitModal(true);
        }
      }
    } catch {}

    const interval = setInterval(() => {
      try {
        const token = localStorage.getItem('token');
        const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/signup';
        if (!token || isAuthPage) {
          setIsLoggedIn(false);
          return;
        }
      } catch {}

      if (document.visibilityState === 'visible') {
        setSecondsUsed((prev) => {
          if (prev >= MAX_APP_SECONDS) {
            setShowLimitModal(true);
            return prev;
          }
          const next = prev + 1;
          try {
            localStorage.setItem(STORAGE_SECONDS_KEY, String(next));
          } catch {}
          if (next >= MAX_APP_SECONDS) {
            setShowLimitModal(true);
          }
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Pause all playing media elements when limit is reached
  useEffect(() => {
    if (showLimitModal) {
      document.querySelectorAll('video, audio').forEach((media) => {
        (media as HTMLMediaElement).pause?.();
      });
    }
  }, [showLimitModal]);

  const resetDailyTimer = () => {
    try {
      localStorage.setItem(STORAGE_SECONDS_KEY, '0');
    } catch {}
    setSecondsUsed(0);
    setShowLimitModal(false);
  };

  if (!isLoggedIn) {
    return null;
  }

  const remainingSeconds = Math.max(0, MAX_APP_SECONDS - secondsUsed);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const percentageUsed = Math.min(100, (secondsUsed / MAX_APP_SECONDS) * 100);

  return (
    <>
      {/* Floating Application-Wide Daily Time Limit HUD */}
      <div className="fixed bottom-5 right-5 z-[9990] flex flex-col items-end gap-1 font-sans pointer-events-auto">
        {minimized ? (
          <button
            onClick={() => setMinimized(false)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full shadow-2xl border backdrop-blur-xl transition-all hover:scale-105 ${
              remainingSeconds <= 60
                ? 'bg-red-950/90 border-red-500 text-red-300 animate-pulse'
                : remainingSeconds <= 300
                ? 'bg-yellow-950/90 border-yellow-500/60 text-yellow-300'
                : 'bg-gray-900/90 border-gray-700/80 text-white hover:border-[#1877f2]'
            }`}
            title="Expand Daily Screen Time Limit Widget"
          >
            <Clock className={`w-4 h-4 ${remainingSeconds <= 60 ? 'text-red-400' : 'text-[#1877f2]'}`} />
            <span className="font-mono text-xs font-bold tracking-wider">
              {formatTimer(remainingSeconds)}
            </span>
            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          </button>
        ) : (
          <div
            className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.5)] border backdrop-blur-xl transition-all duration-300 ${
              remainingSeconds <= 60
                ? 'bg-gradient-to-r from-red-950/95 to-gray-950/95 border-red-500/80'
                : remainingSeconds <= 300
                ? 'bg-gradient-to-r from-yellow-950/95 to-gray-950/95 border-yellow-500/60'
                : 'bg-gray-900/95 border-gray-700/80 hover:border-[#1877f2]/70'
            }`}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-800/80 border border-gray-700/50">
              <Clock
                className={`w-4 h-4 ${
                  remainingSeconds <= 60
                    ? 'text-red-400 animate-pulse'
                    : remainingSeconds <= 300
                    ? 'text-yellow-400'
                    : 'text-[#1877f2]'
                }`}
              />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                  Daily App Limit
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    remainingSeconds <= 60
                      ? 'text-red-400'
                      : remainingSeconds <= 300
                      ? 'text-yellow-300'
                      : 'text-white'
                  }`}
                >
                  {formatTimer(remainingSeconds)} left
                </span>
              </div>

              <div className="w-28 bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    remainingSeconds <= 60
                      ? 'bg-red-500'
                      : remainingSeconds <= 300
                      ? 'bg-yellow-400'
                      : 'bg-[#1877f2]'
                  }`}
                  style={{ width: `${100 - percentageUsed}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 ml-1 border-l border-gray-800 pl-2.5">
              <button
                onClick={resetDailyTimer}
                title="Reset daily limit (Demo / Test)"
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setMinimized(true)}
                title="Minimize screen time widget"
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full-Screen Daily 15-Minute App Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 border border-gray-800 rounded-3xl p-8 text-center shadow-[0_0_80px_rgba(24,119,242,0.2)] flex flex-col items-center gap-5">
            <div className="w-20 h-20 bg-gradient-to-tr from-red-500/20 via-yellow-500/10 to-[#1877f2]/20 rounded-full flex items-center justify-center border border-gray-700/60 shadow-inner">
              <AlertTriangle className="w-10 h-10 text-red-400 animate-bounce" />
            </div>

            <div>
              <span className="inline-block px-3.5 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
                Digital Well-Being Limit
              </span>
              <h2 className="text-2xl font-bold text-white">Daily App Limit Reached</h2>
              <p className="text-gray-400 text-sm mt-2.5 leading-relaxed">
                You have reached your <strong className="text-white">15-minute daily allowance</strong> on Vaaknow. Taking regular breaks helps keep your mind fresh and promotes a balanced digital lifestyle!
              </p>
            </div>

            <div className="w-full bg-gray-800/40 border border-gray-800 rounded-2xl p-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <ShieldCheck className="w-4 h-4 text-[#1877f2]" />
                <span>Screen Time Today:</span>
              </div>
              <span className="font-mono font-bold text-white">15:00 / 15:00</span>
            </div>

            <div className="w-full flex flex-col gap-3 mt-2">
              <div className="w-full bg-[#1877f2]/10 border border-[#1877f2]/30 text-[#1877f2] font-semibold py-3 rounded-xl text-center text-sm">
                Time for a healthy break! See you tomorrow 🌟
              </div>

              <button
                onClick={resetDailyTimer}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 border border-gray-700/50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Daily Limit (+15 Min for Demo / Testing)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
