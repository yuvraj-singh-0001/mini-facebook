import React from "react";
import { Video, Image as ImageIcon, Smile } from "lucide-react";

export default function CreatePost() {
  return (
    <div className="bg-white  rounded-xl shadow-sm mb-4">
      {/* Top section */}
      <div className="p-3 md:p-4 flex gap-2">
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
          alt="User"
          className="w-10 h-10 rounded-full cursor-pointer"
        />
        <div className="flex-1 bg-gray-100  rounded-full hover:bg-gray-200 :bg-gray-600 transition-colors flex items-center px-4 cursor-pointer">
          <span className="text-gray-500 text-[15px]">What's on your mind, Yuvraj?</span>
        </div>
      </div>
      
      {/* Divider */}
      <div className="mx-4 border-t border-gray-200 "></div>
      
      {/* Bottom Actions */}
      <div className="p-2 md:p-3 flex justify-between">
        <div className="flex-1 flex items-center justify-center gap-2 hover:bg-gray-100 :bg-fb-gray-bg-dark p-2 rounded-lg cursor-pointer transition-colors">
          <Video className="text-red-500" size={24} />
          <span className="text-[15px] font-semibold text-gray-600  hidden sm:block">Live video</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2 hover:bg-gray-100 :bg-fb-gray-bg-dark p-2 rounded-lg cursor-pointer transition-colors">
          <ImageIcon className="text-green-500" size={24} />
          <span className="text-[15px] font-semibold text-gray-600  hidden sm:block">Photo/video</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2 hover:bg-gray-100 :bg-fb-gray-bg-dark p-2 rounded-lg cursor-pointer transition-colors">
          <Smile className="text-yellow-500" size={24} />
          <span className="text-[15px] font-semibold text-gray-600  hidden sm:block">Feeling/activity</span>
        </div>
      </div>
    </div>
  );
}
