import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { API_URL } from '@/config/api';

export default function ShareModal({ postId, onClose, onShareSuccess }: { postId: string, onClose: () => void, onShareSuccess: () => void }) {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentTo, setSentTo] = useState<string[]>([]); // Track users we have already sent it to

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/friends/list/${user.id || user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (friendId: string) => {
    if (sentTo.includes(friendId)) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/posts/${postId}/share`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipientId: friendId })
      });

      if (res.ok) {
        setSentTo([...sentTo, friendId]);
        onShareSuccess(); // Increment local share count in parent component
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 sm:p-4">
      <div 
        className="bg-white w-full sm:max-w-[400px] h-[75vh] sm:h-[500px] rounded-t-2xl sm:rounded-xl shadow-xl flex flex-col animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Share</h2>
          <button onClick={onClose} className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-full">
            <Search size={18} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search friends"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none ml-2 w-full text-sm text-black placeholder-gray-500"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center mt-10">
              <div className="w-8 h-8 border-4 border-[#1877f2] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : friends.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">No friends to share with yet.</p>
          ) : filteredFriends.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">No friends found.</p>
          ) : (
            filteredFriends.map((friend) => {
              const isSent = sentTo.includes(friend.id);
              return (
                <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                    <span className="font-semibold text-[15px] text-gray-900">{friend.name}</span>
                  </div>
                  <button
                    onClick={() => handleSend(friend.id)}
                    disabled={isSent}
                    className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-colors ${
                      isSent 
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                        : 'bg-[#1877f2] hover:bg-[#166fe5] text-white'
                    }`}
                  >
                    {isSent ? 'Sent' : 'Send'}
                  </button>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
