import React, { useState } from 'react';
import { Image as ImageIcon, Video, Smile, Film, Link as LinkIcon, X } from 'lucide-react';
import { API_URL } from '@/config/api';

export default function CreatePostComponent({ currentUser, onPostCreated }: { currentUser: any, onPostCreated: () => void }) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string>('');
  const [video, setVideo] = useState<string>('');
  const [mediaType, setMediaType] = useState<'post' | 'reel'>('post');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 40 * 1024 * 1024) {
        alert("File size exceeds 40MB. Please use a smaller file or paste a Video URL.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (file.type.startsWith('video/')) {
          setVideo(reader.result as string);
          setImage('');
          setMediaType('reel');
        } else {
          setImage(reader.result as string);
          setVideo('');
          setMediaType('post');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddVideoUrl = () => {
    if (!videoUrlInput.trim()) return;
    setVideo(videoUrlInput.trim());
    setImage('');
    setMediaType('reel');
    setShowUrlInput(false);
    setVideoUrlInput('');
  };

  const handlePost = async () => {
    if (!content.trim() && !image && !video) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          content, 
          image, 
          video, 
          mediaType: video ? 'reel' : mediaType 
        })
      });

      if (res.ok) {
        setContent('');
        setImage('');
        setVideo('');
        setMediaType('post');
        setShowUrlInput(false);
        
        // Show success toast
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        
        onPostCreated(); // refresh feed
      } else {
        alert("Failed to create post/reel. File might be too large.");
      }
    } catch (error) {
      console.error(error);
      alert("Error creating post/reel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.2)] p-4 w-full border border-gray-200 mb-4 relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#333] text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          {video ? 'Reel / Video published successfully!' : 'Chirp published successfully!'}
        </div>
      )}

      {/* Mode Indicator */}
      {video && (
        <div className="mb-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center justify-between shadow-sm">
          <span className="flex items-center gap-1.5">🎬 Creating a Vaaknow Reel / Video Chirp</span>
          <span className="bg-black/20 px-2 py-0.5 rounded text-[10px]">Will appear in Birdies Feed & Global Reels</span>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <img src={currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="User" className="w-10 h-10 rounded-full object-cover" />
        <div className="flex-1 bg-[#f0f2f5] hover:bg-[#e4e6eb] rounded-full px-4 py-2 flex items-center transition-colors">
          <input 
            type="text" 
            placeholder={currentUser?.firstName ? (video ? `Write a caption for your Reel, ${currentUser.firstName}...` : `What's chirping in your mind, ${currentUser.firstName}?`) : "What's chirping in your mind?"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-[17px] text-black"
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* Image Preview */}
      {image && (
        <div className="relative mb-3 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex justify-center max-h-[300px]">
          <button 
            onClick={() => setImage('')} 
            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md font-bold text-gray-700 hover:bg-gray-100"
          >
            ✕
          </button>
          <img src={image} alt="Upload preview" className="max-h-[300px] object-contain" />
        </div>
      )}

      {/* Video / Reel Preview */}
      {video && (
        <div className="relative mb-3 rounded-lg overflow-hidden border border-gray-200 bg-black flex justify-center max-h-[400px]">
          <button 
            onClick={() => setVideo('')} 
            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md font-bold text-gray-700 hover:bg-gray-100 z-10"
          >
            ✕
          </button>
          <video src={video} controls className="max-h-[400px] w-full object-contain" />
        </div>
      )}

      {/* Video URL Paste Panel */}
      {showUrlInput && (
        <div className="mb-3 bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center gap-2">
          <LinkIcon size={18} className="text-[#1877f2] flex-shrink-0" />
          <input 
            type="text" 
            placeholder="Paste video MP4 URL (e.g. https://www.w3schools.com/html/mov_bbb.mp4)" 
            value={videoUrlInput}
            onChange={(e) => setVideoUrlInput(e.target.value)}
            className="flex-1 bg-white border border-gray-300 rounded px-3 py-1.5 text-sm text-black outline-none focus:border-[#1877f2]"
          />
          <button 
            onClick={handleAddVideoUrl}
            className="bg-[#1877f2] text-white px-3 py-1.5 rounded text-sm font-semibold hover:bg-[#166fe5]"
          >
            Add Reel
          </button>
          <button 
            onClick={() => setShowUrlInput(false)}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {(content || image || video) && (
        <button 
          onClick={handlePost} 
          disabled={loading}
          className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-2 rounded-md mb-3 disabled:opacity-50 transition-colors shadow-sm"
          suppressHydrationWarning
        >
          {loading ? 'Posting...' : (video ? '🎬 Share Reel / Video' : 'Chirp')}
        </button>
      )}

      <div className="border-t border-[#ced0d4] mb-3 w-full"></div>
      
      <div className="flex justify-between gap-1">
        <label className="flex-1 flex items-center justify-center gap-1.5 p-2 hover:bg-[#f0f2f5] rounded-lg transition-colors text-[#65676B] font-semibold cursor-pointer text-sm sm:text-base">
          <span className="text-green-500"><ImageIcon size={22} /></span>
          <span>Photo</span>
          <input type="file" accept="image/*" onChange={handleMediaChange} className="hidden" />
        </label>
        
        <label className="flex-1 flex items-center justify-center gap-1.5 p-2 hover:bg-[#f0f2f5] rounded-lg transition-colors text-[#65676B] font-semibold cursor-pointer text-sm sm:text-base">
          <span className="text-red-500"><Video size={22} /></span>
          <span>Reel / Video</span>
          <input type="file" accept="video/*,image/*" onChange={handleMediaChange} className="hidden" />
        </label>

        <button 
          onClick={() => setShowUrlInput(!showUrlInput)}
          suppressHydrationWarning 
          className="flex-1 flex items-center justify-center gap-1.5 p-2 hover:bg-[#f0f2f5] rounded-lg transition-colors text-[#65676B] font-semibold text-sm sm:text-base"
        >
          <span className="text-purple-500"><Film size={22} /></span>
          <span>Paste Video URL</span>
        </button>
      </div>
    </div>
  );
}

