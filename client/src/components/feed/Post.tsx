"use client";

import React, { useState } from "react";
import { MoreHorizontal, X, ThumbsUp, MessageSquare, Share2 } from "lucide-react";

interface PostProps {
  authorName: string;
  authorAvatar: string;
  timeAgo: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  shares: number;
}

export default function Post({ authorName, authorAvatar, timeAgo, content, imageUrl, likes, comments, shares }: PostProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setCurrentLikes(isLiked ? currentLikes - 1 : currentLikes + 1);
  };

  return (
    <div className="bg-white  rounded-xl shadow-sm mb-4">
      {/* Post Header */}
      <div className="p-3 md:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer">
          <img src={authorAvatar} alt={authorName} className="w-10 h-10 rounded-full" />
          <div>
            <h4 className="font-semibold text-[15px] hover:underline">{authorName}</h4>
            <div className="flex items-center text-xs text-gray-500 gap-1">
              <span>{timeAgo}</span>
              <span>·</span>
              <span className="w-3 h-3 bg-gray-500 rounded-full flex items-center justify-center text-white text-[8px]">🌍</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-8 h-8 rounded-full hover:bg-gray-200 :bg-fb-gray-bg-dark flex items-center justify-center cursor-pointer transition-colors">
            <MoreHorizontal size={20} />
          </div>
          <div className="w-8 h-8 rounded-full hover:bg-gray-200 :bg-fb-gray-bg-dark flex items-center justify-center cursor-pointer transition-colors hidden sm:flex">
            <X size={20} />
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-3 md:px-4 pb-3">
        <p className="text-[15px] whitespace-pre-wrap">{content}</p>
      </div>

      {/* Post Image */}
      {imageUrl && (
        <div className="w-full max-h-[600px] overflow-hidden bg-gray-100 flex items-center justify-center cursor-pointer">
          <img src={imageUrl} alt="Post image" className="w-full object-contain max-h-[600px]" />
        </div>
      )}

      {/* Post Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-gray-500 text-[15px] border-b border-gray-200  mx-4">
        <div className="flex items-center gap-1 cursor-pointer">
          <div className="w-5 h-5 bg-fb-blue rounded-full flex items-center justify-center">
            <ThumbsUp size={12} className="text-white fill-current" />
          </div>
          <span className="hover:underline">{currentLikes}</span>
        </div>
        <div className="flex gap-3">
          <span className="hover:underline cursor-pointer">{comments} comments</span>
          <span className="hover:underline cursor-pointer">{shares} shares</span>
        </div>
      </div>

      {/* Post Actions */}
      <div className="p-1 px-4 flex justify-between">
        <div 
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 :bg-fb-gray-bg-dark ${isLiked ? 'text-fb-blue font-semibold' : 'text-gray-600  font-semibold text-[15px]'}`}
        >
          <ThumbsUp size={20} className={isLiked ? 'fill-current' : ''} />
          <span>Like</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 :bg-fb-gray-bg-dark text-gray-600  font-semibold text-[15px]">
          <MessageSquare size={20} />
          <span>Comment</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 :bg-fb-gray-bg-dark text-gray-600  font-semibold text-[15px]">
          <Share2 size={20} />
          <span>Share</span>
        </div>
      </div>
    </div>
  );
}
