"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Music, Volume2, VolumeX } from 'lucide-react';
import Navbar from "@/components/layout/Navbar";

// Selected placeholder educational Shorts (IDs might be unavailable, but the player will load)
// We use well-known short IDs where possible, or generic placeholders for the demo.
const REELS = [
  {
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    title: "Pythagoras Theorem Math Trick | Fast Calculation Class 7",
    channel: "@MathsTricksHindi",
    likes: "2.4M",
    comments: "14K",
    shares: "56K"
  },
  {
    url: "https://media.w3.org/2010/05/sintel/trailer.mp4",
    title: "Golden Ratio Magic | 5 Khatarnak Math Tricks",
    channel: "@JSTopicStudy",
    likes: "1.8M",
    comments: "8.2K",
    shares: "32K"
  },
  {
    url: "https://media.w3.org/2010/05/bunny/trailer.mp4",
    title: "Mobius Strip Math Geometry Trick | Class 7",
    channel: "@DearSir",
    likes: "5.1M",
    comments: "45K",
    shares: "120K"
  },
  {
    url: "https://media.w3.org/2010/05/video/movie_300.mp4",
    title: "All Calculation Geometry Tricks | Math Class 7",
    channel: "@Adda247",
    likes: "890K",
    comments: "3.4K",
    shares: "18K"
  },
  {
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    title: "Fibonacci Sequence The 5-Second Math Trick!",
    channel: "@MathsTricks",
    likes: "3.2M",
    comments: "21K",
    shares: "80K"
  }
];

export default function VideoFeedPage() {
  const [activeReel, setActiveReel] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === activeReel) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => console.log("Autoplay waiting:", e));
          }
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [activeReel]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPosition = container.scrollTop;
    const windowHeight = container.clientHeight;
    
    // Calculate which reel is currently most visible
    const activeIndex = Math.round(scrollPosition / windowHeight);
    
    if (activeIndex !== activeReel && activeIndex >= 0 && activeIndex < REELS.length) {
      setActiveReel(activeIndex);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <>
      <Navbar />
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="fixed top-[56px] bottom-[48px] md:bottom-0 left-0 right-0 overflow-y-scroll snap-y snap-mandatory bg-black z-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
      <style dangerouslySetInnerHTML={{__html: `
        ::-webkit-scrollbar { display: none; }
      `}} />
      
      {REELS.map((reel, index) => (
        <div key={index} className="h-full w-full snap-start relative flex justify-center bg-black">
          {/* Video Container */}
          <div className="relative w-full max-w-[400px] xl:max-w-[420px] h-full flex flex-col justify-center items-center overflow-hidden md:aspect-[9/16] bg-black md:h-[95%] md:my-auto md:rounded-2xl">
            
            {/* Native Video Player */}
            <video
              ref={(el) => { videoRefs.current[index] = el; }}
              src={reel.url}
              loop
              muted={isMuted}
              playsInline
              onClick={toggleMute}
              className="absolute inset-0 w-full h-full object-cover pointer-events-auto cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.5)]"
            />
            
            {/* Overlay UI - Premium Glassmorphism */}
            <div className="absolute bottom-0 left-0 right-0 p-5 pb-20 md:pb-8 flex justify-between items-end bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-10">
              
              {/* Left Info */}
              <div className="text-white flex-1 pr-12 mb-2 animate-fade-in-up">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 p-[2px] pointer-events-auto cursor-pointer shadow-lg hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-black overflow-hidden border-2 border-transparent">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${reel.channel}`} alt="avatar" />
                    </div>
                  </div>
                  <span className="font-bold text-[16px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wide">{reel.channel}</span>
                  <button className="bg-white/20 hover:bg-white text-white hover:text-black backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold ml-1 pointer-events-auto transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                    Follow
                  </button>
                </div>
                <p className="text-[15px] leading-snug mb-4 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-2">{reel.title}</p>
                <div className="flex items-center gap-2 text-xs bg-black/40 backdrop-blur-md border border-white/10 w-max px-3 py-2 rounded-full shadow-inner">
                  <Music size={14} className="animate-[spin_3s_linear_infinite]" />
                  <span className="font-semibold tracking-wide">Original Audio - {reel.channel}</span>
                </div>
              </div>

              {/* Right Actions - Floating Glass Icons */}
              <div className="flex flex-col items-center gap-4 pointer-events-auto mb-2 animate-fade-in-right">
                <div className="flex flex-col items-center gap-1 cursor-pointer group">
                  <div className="bg-black/30 backdrop-blur-xl border border-white/10 p-3 rounded-full hover:scale-110 hover:bg-black/50 transition-all duration-300 shadow-lg">
                    <Heart size={28} className="text-white group-hover:text-pink-500 transition-colors drop-shadow-md" />
                  </div>
                  <span className="text-white text-xs font-bold drop-shadow-md">{reel.likes}</span>
                </div>
                <div className="flex flex-col items-center gap-1 cursor-pointer group">
                  <div className="bg-black/30 backdrop-blur-xl border border-white/10 p-3 rounded-full hover:scale-110 hover:bg-black/50 transition-all duration-300 shadow-lg">
                    <MessageCircle size={28} className="text-white drop-shadow-md" />
                  </div>
                  <span className="text-white text-xs font-bold drop-shadow-md">{reel.comments}</span>
                </div>
                <div className="flex flex-col items-center gap-1 cursor-pointer group">
                  <div className="bg-black/30 backdrop-blur-xl border border-white/10 p-3 rounded-full hover:scale-110 hover:bg-black/50 transition-all duration-300 shadow-lg">
                    <Share2 size={28} className="text-white drop-shadow-md" />
                  </div>
                  <span className="text-white text-xs font-bold drop-shadow-md">{reel.shares}</span>
                </div>
                <div className="flex flex-col items-center gap-1 cursor-pointer group mt-2">
                  <MoreVertical size={24} className="text-white/80 hover:text-white transition-colors drop-shadow-md" />
                </div>
                <div className="w-11 h-11 rounded-lg overflow-hidden border-2 border-white/60 mt-4 animate-[spin_5s_linear_infinite] shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                   <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${reel.channel}`} alt="audio" className="w-full h-full object-cover scale-150" />
                </div>
              </div>
            </div>
            
            {/* Mute Toggle UI - Premium Floating Icon */}
            <div 
              className="absolute top-6 right-5 bg-black/40 backdrop-blur-xl border border-white/20 p-2.5 rounded-full cursor-pointer pointer-events-auto z-20 hover:bg-black/60 hover:scale-110 transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX size={22} className="text-white drop-shadow-md" /> : <Volume2 size={22} className="text-white drop-shadow-md" />}
            </div>

          </div>
        </div>
      ))}
      </div>
    </>
  );
}
