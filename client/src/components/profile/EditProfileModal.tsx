import React, { useState } from "react";
import { X, Camera } from "lucide-react";
import { API_URL } from "@/config/api";

interface EditProfileModalProps {
  user: any;
  onClose: () => void;
  onSave: (updatedUser: any) => void;
}

export default function EditProfileModal({ user, onClose, onSave }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    bio: user?.bio || "",
    workplace: user?.workplace || "",
    education: user?.education || "",
    location: user?.location || "",
    hometown: user?.hometown || "",
    relationshipStatus: user?.relationshipStatus || "",
  });

  const [profileImage, setProfileImage] = useState<string>(user?.avatar || "");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      // Update details
      const detailsRes = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const detailsData = await detailsRes.json();

      let finalUser = detailsData.user;

      // Update avatar if changed
      if (profileImage && profileImage !== user?.avatar) {
        const avatarRes = await fetch(`${API_URL}/api/auth/profile-picture`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ avatar: profileImage })
        });
        const avatarData = await avatarRes.json();
        finalUser = avatarData.user;
      }

      onSave(finalUser);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm sm:bg-black/50 p-0 sm:p-4 transition-all">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[700px] sm:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-900 mx-auto">Edit profile</h2>
          <button onClick={onClose} className="absolute right-4 w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
          <form id="editProfileForm" onSubmit={handleSubmit} className="space-y-8 max-w-[600px] mx-auto">
            
            {/* Profile Picture Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Profile picture</h3>
                <label className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors">
                  Add
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
              <div className="flex justify-center">
                <div className="relative group cursor-pointer">
                  <div className="w-[168px] h-[168px] rounded-full overflow-hidden border-4 border-white shadow-sm ring-1 ring-gray-200">
                    <img src={profileImage || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <label className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera size={28} className="text-white mb-1" />
                    <span className="text-white font-semibold text-sm">Update</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Bio Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Bio</h3>
                <span className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors">Add</span>
              </div>
              <div className="text-center">
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Describe who you are"
                  maxLength={101}
                  className="w-full text-center bg-gray-100 border-none rounded-lg p-3 text-[15px] focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={3}
                />
                <p className="text-right text-xs text-gray-500 mt-1">{101 - formData.bio.length} characters remaining</p>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Details Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-gray-900">Customize your intro</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Workplace</label>
                  <input type="text" name="workplace" value={formData.workplace} onChange={handleInputChange} placeholder="e.g. Software Engineer at Google" className="w-full bg-transparent border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Education</label>
                  <input type="text" name="education" value={formData.education} onChange={handleInputChange} placeholder="e.g. Studied at MIT" className="w-full bg-transparent border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Current City</label>
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. San Francisco, California" className="w-full bg-transparent border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hometown</label>
                  <input type="text" name="hometown" value={formData.hometown} onChange={handleInputChange} placeholder="e.g. New York, NY" className="w-full bg-transparent border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Relationship Status</label>
                  <select name="relationshipStatus" value={formData.relationshipStatus} onChange={handleInputChange} className="w-full bg-transparent border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="">Select status</option>
                    <option value="Single">Single</option>
                    <option value="In a relationship">In a relationship</option>
                    <option value="Engaged">Engaged</option>
                    <option value="Married">Married</option>
                    <option value="It's complicated">It's complicated</option>
                  </select>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
          <button
            type="submit"
            form="editProfileForm"
            disabled={loading}
            className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>

      </div>
    </div>
  );
}
