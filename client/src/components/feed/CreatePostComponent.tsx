import React, { useState } from 'react';
import { Image as ImageIcon, Video, Smile } from 'lucide-react';

export default function CreatePostComponent({ currentUser, onPostCreated }: { currentUser: any, onPostCreated: () => void }) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !image) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5002/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content, image })
      });

      if (res.ok) {
        setContent('');
        setImage('');
        
        // Show success toast
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        
        onPostCreated(); // refresh feed
      } else {
        alert("Failed to create post. File might be too large.");
      }
    } catch (error) {
      console.error(error);
      alert("Error creating post.");
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
          Post published successfully!
        </div>
      )}
      <div className="flex gap-2 mb-3">
        <img src={currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="User" className="w-10 h-10 rounded-full object-cover" />
        <div className="flex-1 bg-[#f0f2f5] hover:bg-[#e4e6eb] rounded-full px-4 py-2 flex items-center transition-colors">
          <input 
            type="text" 
            placeholder={currentUser?.firstName ? `What's on your mind, ${currentUser.firstName}?` : "What's on your mind?"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-[17px] text-black"
            suppressHydrationWarning
          />
        </div>
      </div>

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

      {(content || image) && (
        <button 
          onClick={handlePost} 
          disabled={loading}
          className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-2 rounded-md mb-3 disabled:opacity-50"
          suppressHydrationWarning
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      )}

      <div className="border-t border-[#ced0d4] mb-3 w-full"></div>
      
      <div className="flex justify-between">
        <button suppressHydrationWarning className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-[#f0f2f5] rounded-lg transition-colors text-[#65676B] font-semibold">
          <span className="text-red-500"><Video size={24} /></span>
          <span className="hidden sm:inline">Live video</span>
        </button>
        <label className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-[#f0f2f5] rounded-lg transition-colors text-[#65676B] font-semibold cursor-pointer">
          <span className="text-green-500"><ImageIcon size={24} /></span>
          Photo/video
          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </label>
        <button suppressHydrationWarning className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-[#f0f2f5] rounded-lg transition-colors text-[#65676B] font-semibold">
          <span className="text-yellow-500"><Smile size={24} /></span>
          <span className="hidden sm:inline">Feeling/activity</span>
        </button>
      </div>
    </div>
  );
}
