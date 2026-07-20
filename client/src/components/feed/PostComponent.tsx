import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MoreHorizontal, ThumbsUp, MessageCircle, Share2, Send, Pencil, Trash2, X, Check, BadgeCheck } from 'lucide-react';
import ShareModal from './ShareModal';
import { API_URL } from '@/config/api';
import { getDefaultAvatar } from "@/lib/utils";
import VerifiedBadge from '@/components/common/VerifiedBadge';

interface PostProps {
  post: any;
  currentUser: any;
  isProfileView?: boolean;
  onPostDeleted?: (postId: string) => void;
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

export default function PostComponent({ post: initialPost, currentUser, isProfileView = false, onPostDeleted }: PostProps) {
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // 3-dot menu
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Delete confirm states
  const [showDeleteConfirm1, setShowDeleteConfirm1] = useState(false);
  const [showDeleteConfirm2, setShowDeleteConfirm2] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const currentUserId = currentUser?._id || currentUser?.id;
  const isOwner = !!(currentUserId && post.user && (currentUserId === post.user._id || currentUserId === post.user._id?.toString()));

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    const wasLiked = post.hasLiked;
    setPost({
      ...post,
      hasLiked: !wasLiked,
      likesCount: wasLiked ? post.likesCount - 1 : post.likesCount + 1
    });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/posts/${post._id}/like`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to like post');
      if (typeof data.likesCount === 'number') {
        setPost((prev: any) => ({ ...prev, hasLiked: data.hasLiked ?? prev.hasLiked, likesCount: data.likesCount }));
      }
    } catch (error) {
      console.error(error);
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
      const res = await fetch(`${API_URL}/api/posts/${post._id}/comments?page=1&limit=30`, {
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
      } else {
        throw new Error(data.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ── DELETE ──────────────────────────────────────────────────
  const handleDeleteStep1 = () => {
    setShowMenu(false);
    setShowDeleteConfirm1(true);
  };

  const handleDeleteStep2 = () => {
    setShowDeleteConfirm1(false);
    setShowDeleteConfirm2(true);
  };

  const handleDeleteConfirmed = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/posts/${post._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDeleteConfirm2(false);
        if (onPostDeleted) onPostDeleted(post._id);
      } else {
        alert('Failed to delete post.');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting post.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── EDIT ────────────────────────────────────────────────────
  const handleEditOpen = () => {
    setEditContent(post.content || '');
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() && !post.image && !post.video) return;
    setIsSavingEdit(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/posts/${post._id}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: editContent })
      });
      const data = await res.json();
      if (res.ok) {
        setPost({ ...post, content: editContent, editedAt: data.post?.editedAt });
        setShowEditModal(false);
      } else {
        alert('Failed to save edit.');
      }
    } catch (error) {
      console.error(error);
      alert('Error saving edit.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="bg-white rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.2)] p-4 w-full mb-4 relative">

      {/* ── DELETE CONFIRM STEP 1 ── */}
      {showDeleteConfirm1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[340px] p-6 flex flex-col items-center gap-4 border border-gray-100">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 size={26} className="text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="text-[17px] font-bold text-gray-900">Delete Post?</h3>
              <p className="text-sm text-gray-500 mt-1">Are you sure you want to delete this post?</p>
            </div>
            <div className="flex gap-3 w-full mt-1">
              <button
                onClick={() => setShowDeleteConfirm1(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStep2}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors text-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM STEP 2 (Final) ── */}
      {showDeleteConfirm2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[360px] p-6 flex flex-col items-center gap-4 border border-red-100">
            <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <Trash2 size={26} className="text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-[17px] font-bold text-gray-900">Permanently Delete?</h3>
              <p className="text-sm text-gray-500 mt-1">
                This will be <span className="text-red-500 font-semibold">permanently removed</span> from the database and cannot be recovered.
              </p>
            </div>
            <div className="flex gap-3 w-full mt-1">
              <button
                onClick={() => setShowDeleteConfirm2(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                {isDeleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-w-[95vw] p-6 flex flex-col gap-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-gray-900 flex items-center gap-2">
                <Pencil size={18} className="text-[#1877f2]" />
                Edit Post
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Media preview (read-only in edit) */}
            {post.image && (
              <div className="rounded-xl overflow-hidden border border-gray-200 max-h-[200px] flex items-center justify-center bg-gray-50">
                <img src={post.image} alt="Post" className="max-h-[200px] object-contain" />
              </div>
            )}
            {post.video && (
              <div className="rounded-xl overflow-hidden border border-gray-200 max-h-[200px] flex items-center justify-center bg-black">
                <video src={post.video} controls className="max-h-[200px] w-full object-contain" />
              </div>
            )}

            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[100px] bg-[#f0f2f5] rounded-xl px-4 py-3 text-[15px] text-black resize-none outline-none focus:ring-2 focus:ring-[#1877f2]/30 transition-all"
              placeholder="What's on your mind?"
              autoFocus
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-5 py-2 rounded-xl bg-[#1877f2] text-white font-bold hover:bg-[#166fe5] transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingEdit ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check size={15} />
                )}
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${post.user._id}`}>
            <img src={post.user.avatar || getDefaultAvatar(post.user.gender)} alt="User" className="w-10 h-10 rounded-full object-cover border border-gray-200 hover:opacity-90" />
          </Link>
          <div>
            <Link href={`/profile/${post.user._id}`}>
              <h3 className="font-semibold text-[15px] text-black hover:underline cursor-pointer flex items-center gap-1">
                {post.user.firstName} {post.user.lastName}
                {(post.user.isVerified || post.user._id === '6a59dbe1d7d3d61365e278cb' || post.user.id === '6a59dbe1d7d3d61365e278cb') && <VerifiedBadge />}
              </h3>
            </Link>
            <p className="text-[13px] text-[#65676B] flex items-center gap-1">
              {formatFacebookTime(post.createdAt)}
              {post.editedAt && <span className="text-[11px] text-gray-400">&nbsp;· Edited</span>}
            </p>
          </div>
        </div>

        {/* 3-dot menu — only if owner */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
          >
            <MoreHorizontal size={20} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 z-30 overflow-hidden">
              {isOwner ? (
                <>
                  <button
                    onClick={handleEditOpen}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    <Pencil size={16} className="text-[#1877f2]" />
                    Edit Post
                  </button>
                  <div className="border-t border-gray-100" />
                  <button
                    onClick={handleDeleteStep1}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-red-500 hover:bg-red-50 transition-colors font-medium"
                  >
                    <Trash2 size={16} />
                    Delete Post
                  </button>
                </>
              ) : (
                <div className="px-4 py-3 text-[13px] text-gray-400 text-center">No options available</div>
              )}
            </div>
          )}
        </div>
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
      {post.imageSkipped && (
        <div className="rounded-lg border border-gray-200 -mx-4 mb-3 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          Large photo feed fast rakhne ke liye yahan skip ki gayi hai. Profile par post open karke dekh sakte ho.
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
                  <img src={comment.user.avatar || getDefaultAvatar(comment.user.gender)} alt="User" className="w-8 h-8 rounded-full object-cover mt-1" />
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
            <img src={currentUser?.avatar || getDefaultAvatar(currentUser?.gender)} alt="User" className="w-8 h-8 rounded-full object-cover" />
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
