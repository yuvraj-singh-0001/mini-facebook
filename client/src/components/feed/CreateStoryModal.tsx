import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { API_URL } from '@/config/api';

export default function CreateStoryModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [image, setImage] = useState<string>('');
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
    if (!image) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ image })
      });

      if (res.ok) {
        onSuccess();
      } else {
        alert("Failed to create story. File might be too large.");
      }
    } catch (error) {
      console.error(error);
      alert("Error creating story.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm sm:bg-black/50 p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[500px] sm:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:py-4 border-b border-gray-200 sticky top-0 z-10 bg-white">
          <h2 className="text-xl font-bold text-gray-900 mx-auto">Create Story</h2>
          <button onClick={onClose} className="absolute right-4 w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center min-h-[300px] bg-gray-50">
          {!image ? (
            <label className="w-full max-w-[300px] h-[300px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="w-16 h-16 bg-[#e4e6eb] rounded-full flex items-center justify-center mb-4">
                <ImageIcon size={30} className="text-gray-600" />
              </div>
              <span className="font-semibold text-lg">Create a Photo Story</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          ) : (
            <div className="relative w-full max-w-[300px] rounded-xl overflow-hidden shadow-md">
              <button 
                onClick={() => setImage('')} 
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors text-white"
              >
                <X size={20} />
              </button>
              <img src={image} alt="Story Preview" className="w-full h-[500px] object-cover" />
            </div>
          )}
        </div>

        {/* Footer */}
        {image && (
          <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
            <button
              onClick={handlePost}
              disabled={loading}
              className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Sharing to Story..." : "Share to Story"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
