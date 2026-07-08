"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Music, Volume2, VolumeX, X, Send } from 'lucide-react';
import Navbar from "@/components/layout/Navbar";

// Only user uploaded Reels will be displayed


const REELS_CACHE_KEY = 'fb_reels_cache';

function formatReels(rawReels: any[]) {
  return rawReels.map((r: any) => ({
    _id: r._id,
    url: r.video || r.image || "https://www.w3schools.com/html/mov_bbb.mp4",
    title: r.content || "Facebook Reel 🎬",
    channel: r.user ? `${r.user.firstName} ${r.user.lastName}` : "@User",
    avatar: r.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.user?._id || 'default'}`,
    likes: r.likesCount || 0,
    hasLiked: r.hasLiked || false,
    comments: r.commentsCount || 0,
    shares: r.sharesCount || 0,
    viewsCount: r.viewsCount || 0,
    isReal: true
  }));
}

export default function VideoFeedPage() {
  const [activeReel, setActiveReel] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Comment panel state
  const [commentOpen, setCommentOpen] = useState<string | null>(null); // reel _id or null
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show cached reels instantly
    try {
      const cached = localStorage.getItem(REELS_CACHE_KEY);
      if (cached) {
        const cachedReels = JSON.parse(cached);
        if (cachedReels.length > 0) {
          setReels(cachedReels);
          setLoading(false);
        }
      }
    } catch {}

    // Fetch fresh reels in background
    const fetchReels = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5002/api/posts/reels', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.reels && data.reels.length > 0) {
            const formatted = formatReels(data.reels);
            setReels(formatted);
            // Cache for next visit (without video blob data, just URLs)
            try {
              localStorage.setItem(REELS_CACHE_KEY, JSON.stringify(formatted.slice(0, 15)));
            } catch {}
          } else {
            setReels([]);
          }
        }
      } catch (error) {
        console.error("Failed to load global reels:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, []);

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
  }, [activeReel, reels]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPosition = container.scrollTop;
    const windowHeight = container.clientHeight;
    
    // Calculate which reel is currently most visible
    const activeIndex = Math.round(scrollPosition / windowHeight);
    
    if (activeIndex !== activeReel && activeIndex >= 0 && activeIndex < reels.length) {
      setActiveReel(activeIndex);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // --- Like function ---
  const toggleLike = async (reelId: string) => {
    const token = localStorage.getItem('token');
    // Optimistic update
    setReels(prev => prev.map(r => {
      if (r._id === reelId) {
        return {
          ...r,
          hasLiked: !r.hasLiked,
          likes: r.hasLiked ? Math.max(0, r.likes - 1) : r.likes + 1
        };
      }
      return r;
    }));
    try {
      await fetch(`http://localhost:5002/api/posts/${reelId}/like`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to toggle like:', err);
      // Revert on error
      setReels(prev => prev.map(r => {
        if (r._id === reelId) {
          return {
            ...r,
            hasLiked: !r.hasLiked,
            likes: r.hasLiked ? Math.max(0, r.likes - 1) : r.likes + 1
          };
        }
        return r;
      }));
    }
  };

  // --- Comment functions ---
  const openComments = async (reelId: string) => {
    setCommentOpen(reelId);
    setCommentsList([]);
    setCommentLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5002/api/posts/${reelId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCommentsList(data.comments || data || []);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setCommentLoading(false);
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    }
  };

  const postComment = async () => {
    if (!commentText.trim() || !commentOpen) return;
    setPostingComment(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5002/api/posts/${commentOpen}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentText.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setCommentsList(prev => [...prev, data.comment || data]);
        setCommentText('');
        // Update comment count in reels
        setReels(prev => prev.map(r => r._id === commentOpen ? { ...r, comments: (r.comments || 0) + 1 } : r));
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setPostingComment(false);
    }
  };

  const closeComments = () => {
    setCommentOpen(null);
    setCommentsList([]);
    setCommentText('');
  };

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}w`;
  };

  return (
    <>
      <Navbar />
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="fixed top-[56px] bottom-0 left-0 right-0 overflow-y-scroll snap-y snap-mandatory bg-black z-40"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
      <style dangerouslySetInnerHTML={{__html: `
        ::-webkit-scrollbar { display: none; }
      `}} />
      
      {loading ? (
        <div className="h-full w-full flex items-center justify-center bg-black text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#1877f2] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-semibold">Loading Facebook Reels...</p>
          </div>
        </div>
      ) : reels.length === 0 ? (
        <div className="h-full w-full flex items-center justify-center bg-black text-white p-4">
          <div className="flex flex-col items-center gap-4 max-w-md text-center p-8 bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-800 shadow-2xl">
            <div className="w-16 h-16 bg-[#1877f2]/20 rounded-full flex items-center justify-center text-[#1877f2] text-3xl">
              🎬
            </div>
            <h2 className="text-xl font-bold text-white">No Reels Yet</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              There are currently no Reels uploaded by users. Be the first to share a Reel or Video on Facebook!
            </p>
            <a 
              href="/" 
              className="bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold px-6 py-2.5 rounded-full transition-all shadow-lg hover:scale-105 inline-block mt-2"
            >
              Upload First Reel 🚀
            </a>
          </div>
        </div>
      ) : (
        reels.map((reel, index) => (
          <div key={reel._id || index} className="h-full w-full snap-start snap-always relative flex justify-center items-center bg-black">
            {/* 9:16 Video Container — Instagram Reels / YouTube Shorts exact proportions */}
            <div className="relative w-full h-full md:w-auto md:h-[calc(100vh-80px)] md:max-h-[900px] md:aspect-[9/16] flex flex-col justify-center items-center overflow-hidden bg-black md:my-auto md:rounded-2xl md:border md:border-gray-800 md:shadow-[0_0_40px_rgba(0,0,0,0.9)]">
              
              {/* Ambient Blurred Background for non-9:16 videos */}
              <video 
                src={index === activeReel ? reel.url : undefined}
                preload="none"
                muted
                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none" 
              />
              
              {/* Main Native Video Player */}
              <video
                ref={(el) => { videoRefs.current[index] = el; }}
                src={Math.abs(index - activeReel) <= 2 ? reel.url : undefined}
                loop
                muted={isMuted}
                playsInline
                preload={index === activeReel ? "auto" : Math.abs(index - activeReel) <= 1 ? "metadata" : "none"}
                onClick={toggleMute}
                className="relative z-[5] w-full h-full object-cover pointer-events-auto cursor-pointer"
              />
              
              {/* Top Gradient Protection for Top Bar */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-20" />

              {/* Top Mute / Sound Badge (Clean, Never overlaps with Actions) */}
              <div 
                className="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full cursor-pointer pointer-events-auto transition-all duration-300 shadow-lg group hover:scale-105"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <>
                    <VolumeX size={16} className="text-white group-hover:text-red-400 transition-colors" />
                    <span className="text-white text-xs font-semibold tracking-wide">Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={16} className="text-white group-hover:text-green-400 transition-colors" />
                    <span className="text-white text-xs font-semibold tracking-wide">Sound On</span>
                  </>
                )}
              </div>

              {/* Bottom Gradient Overlay for readability */}
              <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-10" />
              
              {/* Bottom Left User Info & Caption (Stacked cleanly like Instagram) */}
              <div className="absolute left-3 sm:left-4 bottom-4 right-14 sm:right-20 z-20 flex flex-col items-start text-white pointer-events-auto">
                
                {/* Row 1: Avatar, Name, Follow */}
                <div className="flex items-center gap-2.5 mb-1.5 w-full">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-white/80 flex-shrink-0 shadow-md bg-gray-800">
                    <img 
                      src={reel.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reel.channel}`} 
                      alt="avatar" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <span className="font-bold text-[14px] sm:text-[15px] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] tracking-wide truncate max-w-[130px] sm:max-w-[170px]">
                    {reel.channel}
                  </span>
                  <button className="bg-transparent hover:bg-white/20 text-white border border-white/80 backdrop-blur-md px-3 py-1 rounded-md text-[11px] sm:text-xs font-bold transition-all shadow-sm flex-shrink-0">
                    Follow
                  </button>
                </div>



                {/* Row 3: Caption */}
                <p className="text-[13px] sm:text-[14px] text-white/95 leading-snug sm:leading-normal mb-2.5 font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-2 pr-2 w-full">
                  {reel.title}
                </p>

                {/* Row 4: Audio Track */}
                <div className="flex items-center gap-2 text-[11px] sm:text-[12px] text-white/90 bg-white/15 hover:bg-white/25 backdrop-blur-md px-3 py-1.5 rounded-full w-max max-w-[200px] sm:max-w-[230px] shadow-sm border border-white/10 transition-colors cursor-pointer truncate">
                  <Music size={13} className="animate-[spin_4s_linear_infinite] flex-shrink-0 text-pink-400" />
                  <span className="truncate font-medium">Original Audio • {reel.channel}</span>
                </div>
              </div>

              {/* Bottom Right Actions Bar (Vertical Column, perfectly positioned) */}
              <div className="absolute right-2 sm:right-3 bottom-5 z-20 flex flex-col items-center gap-3.5 pointer-events-auto pb-1">
                
                {/* Like Button */}
                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => reel._id && toggleLike(reel._id)}>
                  <div className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 transition-all transform group-active:scale-75">
                    <Heart 
                      size={26} 
                      className={`transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${reel.hasLiked ? 'text-red-500 fill-red-500' : 'text-white group-hover:text-pink-500'}`} 
                    />
                  </div>
                  <span className={`text-[11px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] -mt-1 ${reel.hasLiked ? 'text-red-500' : 'text-white'}`}>{reel.likes}</span>
                </div>

                {/* Comment Button */}
                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => reel._id && openComments(reel._id)}>
                  <div className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 transition-all transform group-active:scale-75">
                    <MessageCircle size={26} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                  </div>
                  <span className="text-white text-[11px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] -mt-1">{reel.comments}</span>
                </div>

                {/* Share Button */}
                <div className="flex flex-col items-center gap-1 cursor-pointer group">
                  <div className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 transition-all transform group-active:scale-75">
                    <Share2 size={26} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                  </div>
                  <span className="text-white text-[11px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] -mt-1">{reel.shares}</span>
                </div>



                {/* More Options */}
                <div className="flex flex-col items-center cursor-pointer group py-1">
                  <MoreVertical size={22} className="text-white/90 hover:text-white transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                </div>

                {/* Rotating Audio Disc */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md overflow-hidden border-2 border-white/80 mt-1 animate-[spin_5s_linear_infinite] shadow-[0_0_15px_rgba(0,0,0,0.8)] flex-shrink-0">
                  <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${reel.channel}`} alt="audio" className="w-full h-full object-cover scale-150" />
                </div>
              </div>

            </div>
          </div>
        ))
      )}
      </div>

      {/* ====== COMMENT PANEL (Instagram-style slide-up drawer) ====== */}
      {commentOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={closeComments}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Panel */}
          <div 
            className="relative w-full md:max-w-[420px] bg-[#1a1a1a] rounded-t-2xl border-t border-gray-700 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom duration-300 max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/60">
              <h3 className="text-white font-bold text-base">Comments</h3>
              <button onClick={closeComments} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4" style={{ minHeight: '120px', maxHeight: 'calc(70vh - 120px)' }}>
              {commentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-7 h-7 border-3 border-[#1877f2] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : commentsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <MessageCircle size={32} className="mb-2 opacity-50" />
                  <p className="text-sm font-medium">No comments yet</p>
                  <p className="text-xs text-gray-600">Be the first to comment on this reel!</p>
                </div>
              ) : (
                commentsList.map((c: any, i: number) => (
                  <div key={c._id || i} className="flex gap-2.5 items-start">
                    <img 
                      src={c.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user?._id || i}`} 
                      alt="" 
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-700 mt-0.5" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-white text-[13px] font-bold truncate">
                          {c.user?.firstName} {c.user?.lastName}
                        </span>
                        <span className="text-gray-500 text-[11px] flex-shrink-0">
                          {c.createdAt ? formatTimeAgo(c.createdAt) : ''}
                        </span>
                      </div>
                      <p className="text-gray-300 text-[13px] leading-snug mt-0.5 break-words">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 border-t border-gray-700/60 flex items-center gap-2 bg-[#1a1a1a]">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && postComment()}
                className="flex-1 bg-[#2a2a2a] border border-gray-700 rounded-full px-4 py-2 text-sm text-white outline-none placeholder-gray-500 focus:border-[#1877f2] transition-colors"
              />
              <button 
                onClick={postComment}
                disabled={!commentText.trim() || postingComment}
                className="bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-40 disabled:hover:bg-[#1877f2] text-white p-2.5 rounded-full transition-all shadow-md hover:scale-105 disabled:hover:scale-100 flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
