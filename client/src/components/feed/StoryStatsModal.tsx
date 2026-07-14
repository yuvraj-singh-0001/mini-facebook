import React, { useState, useEffect } from 'react';
import { X, Eye, Heart } from 'lucide-react';
import { API_URL } from '@/config/api';

export default function StoryStatsModal({ storyId, onClose }: { storyId: string, onClose: () => void }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'viewers' | 'likes'>('viewers');

  useEffect(() => {
    fetchStats();
  }, [storyId]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/stories/${storyId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div 
        className="bg-white w-full sm:max-w-[400px] h-[70vh] sm:h-[600px] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Prevent clicking background from closing
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Story Details</h2>
          <button onClick={onClose} className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        {stats && (
          <div className="flex border-b border-gray-200">
            <button 
              onClick={() => setActiveTab('viewers')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-semibold transition-colors ${activeTab === 'viewers' ? 'text-[#1877f2] border-b-2 border-[#1877f2]' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Eye size={20} />
              Viewers ({stats.viewCount})
            </button>
            <button 
              onClick={() => setActiveTab('likes')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-semibold transition-colors ${activeTab === 'likes' ? 'text-[#1877f2] border-b-2 border-[#1877f2]' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Heart size={20} />
              Likes ({stats.likeCount})
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-4 border-[#1877f2] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : stats ? (
            <div className="flex flex-col gap-4">
              {activeTab === 'viewers' && (
                stats.viewers.length === 0 ? (
                  <p className="text-center text-gray-500 mt-10">No views yet.</p>
                ) : (
                  stats.viewers.map((user: any, idx: number) => (
                    <div key={`${user._id}-${idx}`} className="flex items-center gap-3">
                      <img src={user.avatar} className="w-12 h-12 rounded-full object-cover border border-gray-200" alt="Avatar" />
                      <span className="font-semibold text-[15px]">{user.firstName} {user.lastName}</span>
                    </div>
                  ))
                )
              )}

              {activeTab === 'likes' && (
                stats.likes.length === 0 ? (
                  <p className="text-center text-gray-500 mt-10">No likes yet.</p>
                ) : (
                  stats.likes.map((user: any, idx: number) => (
                    <div key={`${user._id}-${idx}`} className="flex items-center gap-3">
                      <div className="relative">
                        <img src={user.avatar} className="w-12 h-12 rounded-full object-cover border border-gray-200" alt="Avatar" />
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                          <Heart size={16} className="fill-red-500 text-red-500" />
                        </div>
                      </div>
                      <span className="font-semibold text-[15px]">{user.firstName} {user.lastName}</span>
                    </div>
                  ))
                )
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 mt-10">Failed to load stats.</p>
          )}
        </div>

      </div>
    </div>
  );
}
