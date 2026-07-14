import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Eye } from 'lucide-react';
import StoryStatsModal from './StoryStatsModal';
import { API_URL } from '@/config/api';

// Helper for dynamic Facebook-like relative time
const formatFacebookTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds || 1} seconds ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (diffInDays <= 10) {
    return `${diffInDays} days ago`;
  }

  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

export default function StoryViewerModal({ storyGroups, initialGroupIndex, currentUser, onClose }: any) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  
  const currentGroup = storyGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  
  const isOwnStory = currentGroup?.user._id === (currentUser?._id || currentUser?.id);
  const hasLiked = currentStory?.likes.some((id: string) => id === (currentUser?._id || currentUser?.id));

  // Auto-progress timer
  useEffect(() => {
    if (!currentStory || isPaused || statsOpen) return;

    // View tracking (only call once per story, don't await)
    if (!isOwnStory) {
      const token = localStorage.getItem('token');
      fetch(`${API_URL}/api/stories/${currentStory._id}/view`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(console.error);
    }

    setProgress(0);
    const duration = 5000; // 5 seconds per story
    const interval = 50; // update every 50ms
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [groupIndex, storyIndex, isPaused, statsOpen, currentStory]);

  // Handle auto-advance
  useEffect(() => {
    if (progress >= 100) {
      handleNext();
    }
  }, [progress]);

  const handleNext = () => {
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setStoryIndex(0);
    } else {
      onClose(); // End of all stories
    }
  };

  const handlePrev = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    } else if (groupIndex > 0) {
      const prevGroup = storyGroups[groupIndex - 1];
      setGroupIndex(groupIndex - 1);
      setStoryIndex(prevGroup.stories.length - 1);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOwnStory) return;
    
    // Optimistic update
    if (!hasLiked) {
      currentStory.likes.push(currentUser._id || currentUser.id);
    }
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/stories/${currentStory._id}/like`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (!currentGroup || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-[100] flex bg-black">
      
      {/* Background Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl" 
        style={{ backgroundImage: `url(${currentStory.image})` }}
      ></div>

      {/* Main Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 md:right-8 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white z-50 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Content Area */}
        <div 
          className="relative w-full max-w-[400px] h-[100dvh] md:h-[90vh] md:rounded-xl overflow-hidden bg-black flex flex-col shadow-2xl"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Progress Bars */}
          <div className="absolute top-0 left-0 right-0 p-3 flex gap-1 z-20">
            {currentGroup.stories.map((_: any, idx: number) => (
              <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-75 linear"
                  style={{ 
                    width: idx < storyIndex ? '100%' : idx === storyIndex ? `${progress}%` : '0%' 
                  }}
                ></div>
              </div>
            ))}
          </div>

          {/* User Info Header */}
          <div className="absolute top-6 left-0 right-0 p-3 flex items-center gap-2 z-20">
            <img src={currentGroup.user.avatar} className="w-10 h-10 rounded-full border border-white/50" alt="Avatar" />
            <div className="text-white drop-shadow-md">
              <span className="font-semibold">{isOwnStory ? "Your Story" : `${currentGroup.user.firstName} ${currentGroup.user.lastName}`}</span>
              <span className="text-sm opacity-80 ml-2">
                {formatFacebookTime(currentStory.createdAt)}
              </span>
            </div>
          </div>

          {/* Story Image */}
          <img src={currentStory.image} alt="Story" className="w-full h-full object-cover select-none pointer-events-none" />

          {/* Navigation Click Areas (Left 30% = prev, Right 70% = next) */}
          <div className="absolute inset-0 z-10 flex">
            <div className="w-[30%] h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrev(); }}></div>
            <div className="w-[70%] h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNext(); }}></div>
          </div>

          {/* Bottom Actions */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20">
            {isOwnStory ? (
              <div 
                className="flex items-end justify-between cursor-pointer w-full group"
                onClick={(e) => { e.stopPropagation(); setStatsOpen(true); }}
              >
                <div className="flex flex-col gap-1 hover:bg-white/10 p-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3 text-white font-semibold">
                    <div className="flex items-center gap-1.5">
                      <Eye size={20} />
                      <span>{currentStory.viewers?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Heart size={20} className={currentStory.likes?.length > 0 ? "fill-red-500 text-red-500" : ""} />
                      <span>{currentStory.likes?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-end pr-2 pb-2">
                <button 
                  onClick={handleLike}
                  className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-black/60 transition-colors"
                >
                  <Heart size={24} className={hasLiked ? "fill-red-500 text-red-500" : "text-white"} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Arrows */}
        <button onClick={handlePrev} className="hidden md:flex absolute left-8 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full items-center justify-center text-white z-50 transition-colors">
          <ChevronLeft size={30} />
        </button>
        <button onClick={handleNext} className="hidden md:flex absolute right-8 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full items-center justify-center text-white z-50 transition-colors">
          <ChevronRight size={30} />
        </button>

      </div>

      {/* Stats Modal for Own Stories */}
      {statsOpen && (
        <StoryStatsModal 
          storyId={currentStory._id} 
          onClose={() => setStatsOpen(false)} 
        />
      )}

    </div>
  );
}
