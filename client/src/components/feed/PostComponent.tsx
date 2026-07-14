import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MoreHorizontal, ThumbsUp, MessageCircle, Share2, Send } from 'lucide-react';
import ShareModal from './ShareModal';
import { API_URL } from '@/config/api';

interface PostProps {
  post: any;
  currentUser: any;
  isProfileView?: boolean;
}

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

const formatViewCount = (count: number = 0) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1).replace('.0', '')}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace('.0', '')}K`;
  return `${count}`;
};

export default function PostComponent({ post: initialPost, currentUser, isProfileView = false }: PostProps) {
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  useEffect(() => {
    if (isProfileView && post?._id && typeof window !== 'undefined') {
      const viewedKey = `viewed_${post._id}`;
      if (!sessionStorage.getItem(viewedKey)) {
        sessionStorage.setItem(viewedKey, 'true');
        const token = localStorage.getItem('token');
        fetch(`${API_URL}/api/posts/${post._id}/view`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (typeof data?.viewsCount === 'number') {
              setPost((prev: any) => ({ ...prev, viewsCount: data.viewsCount }));
            }
          })
          .catch(err => console.error(err));
      }
    }
  }, [post?._id, isProfileView]);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    // Optimistic UI update
    const wasLiked = post.hasLiked;
    setPost({
      ...post,
      hasLiked: !wasLiked,
      likesCount: wasLiked ? post.likesCount - 1 : post.likesCount + 1
    });

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/posts/${post._id}/like`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error(error);
      // Revert if failed
      setPost({
        ...post,
        hasLiked: wasLiked,
        likesCount: wasLiked ? post.likesCount + 1 : post.likesCount - 1
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/posts/${post._id}/share`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setPost({ ...post, sharesCount: post.sharesCount + 1 });
    } catch (error) {
      console.error(error);
    }
  };

  const loadComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/posts/${post._id}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setComments(data.comments);
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/posts/${post._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      
      const data = await res.json();
      if (res.ok) {
        setComments([...comments, data.comment]);
        setNewComment('');
        setPost({ ...post, commentsCount: post.commentsCount + 1 });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="bg-white rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.2)] p-4 w-full mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${post.user._id}`}>
            <img src={post.user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="User" className="w-10 h-10 rounded-full object-cover border border-gray-200 hover:opacity-90" />
          </Link>
          <div>
            <Link href={`/profile/${post.user._id}`}>
              <h3 className="font-semibold text-[15px] text-black hover:underline cursor-pointer">
                {post.user.firstName} {post.user.lastName}
              </h3>
            </Link>
            <p className="text-[13px] text-[#65676B]">
              {formatFacebookTime(post.createdAt)}
            </p>
          </div>
        </div>
        <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-[15px] text-black mb-3 whitespace-pre-wrap">{post.content}</p>
      )}
      
      {/* Image */}
      {post.image && (
        <div className="rounded-lg overflow-hidden border border-gray-200 -mx-4 mb-3 max-h-[600px] flex items-center justify-center bg-black">
          <img src={post.image} alt="Post content" loading="lazy" decoding="async" className="w-full max-h-[600px] object-contain" />
        </div>
      )}

      {/* Video / Reel */}
      {post.video && (
        <div className="rounded-lg overflow-hidden border border-gray-200 -mx-4 mb-3 max-h-[600px] flex items-center justify-center bg-black relative">
          <video src={post.video} controls preload="metadata" playsInline className="w-full max-h-[600px] object-contain" />
        </div>
      )}
      
      {/* Stats */}
      <div className="flex justify-between text-[#65676B] text-[15px] pb-3 border-b border-gray-200 mb-1 items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {post.likesCount > 0 && (
              <>
                <div className="bg-[#1877f2] w-5 h-5 rounded-full flex items-center justify-center">
                  <ThumbsUp size={12} className="text-white" />
                </div>
                <span>{post.likesCount}</span>
              </>
            )}
          </div>

          {/* View Count Badge - Only shown when visiting profile */}
          {isProfileView && (
            <div className="flex items-center gap-1.5 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors px-2.5 py-0.5 rounded-full text-xs cursor-pointer shadow-sm" title="Total unique views on this post/video">
              <span className="text-[#1877f2] font-bold">{post.video || post.mediaType === 'video' || post.mediaType === 'reel' ? '▶' : '👁️'}</span>
              <span>{formatViewCount(post.viewsCount || 0)} views</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          {post.commentsCount > 0 && <span className="hover:underline cursor-pointer" onClick={handleToggleComments}>{post.commentsCount} comments</span>}
          {post.sharesCount > 0 && <span>{post.sharesCount} shares</span>}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-between pt-1">
        <button 
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 rounded-md font-semibold transition-colors ${post.hasLiked ? 'text-[#1877f2]' : 'text-[#65676B]'}`}
        >
          <ThumbsUp size={20} />
          <span>Like</span>
        </button>
        <button 
          onClick={handleToggleComments}
          className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 rounded-md font-semibold text-[#65676B] transition-colors"
        >
          <MessageCircle size={20} />
          <span>Comment</span>
        </button>
        <button 
          onClick={() => setIsShareModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 rounded-md font-semibold text-[#65676B] transition-colors"
        >
          <Share2 size={20} />
          <span>Share</span>
        </button>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal 
          postId={post._id} 
          onClose={() => setIsShareModalOpen(false)} 
          onShareSuccess={() => setPost({ ...post, sharesCount: post.sharesCount + 1 })} 
        />
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto pr-2">
            {comments.map((comment, idx) => (
              <div key={idx} className="flex gap-2">
                <Link href={`/profile/${comment.user._id}`}>
                  <img src={comment.user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="User" className="w-8 h-8 rounded-full object-cover mt-1" />
                </Link>
                <div className="bg-[#f0f2f5] rounded-2xl px-3 py-2 max-w-[85%]">
                  <Link href={`/profile/${comment.user._id}`}>
                    <span className="font-semibold text-[13px] hover:underline cursor-pointer block">{comment.user.firstName} {comment.user.lastName}</span>
                  </Link>
                  <span className="text-[15px]">{comment.content}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input */}
          <div className="flex gap-2 items-center">
            <img src={currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="User" className="w-8 h-8 rounded-full object-cover" />
            <form onSubmit={handleSubmitComment} className="flex-1 relative">
              <input 
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..." 
                className="w-full bg-[#f0f2f5] rounded-full px-4 py-2 pr-10 text-[15px] focus:outline-none"
              />
              <button type="submit" disabled={!newComment.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1877f2] disabled:text-gray-400 p-1">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
