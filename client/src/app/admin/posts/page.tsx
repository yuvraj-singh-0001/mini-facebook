"use client";

import React, { useEffect, useState } from 'react';
import { Search, ThumbsUp, MessageSquare, Eye, Loader2, Image as ImageIcon, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PostsAdminPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const adminPin = sessionStorage.getItem('admin_pin') || '';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      
      const res = await fetch(`${apiUrl}/api/admin/posts`, {
        headers: {
          'x-admin-pin': adminPin
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts list');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
    
    setIsDeleting(postId);
    try {
      const adminPin = sessionStorage.getItem('admin_pin') || '';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      
      const res = await fetch(`${apiUrl}/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-pin': adminPin
        }
      });
      
      if (!res.ok) throw new Error('Failed to delete post');
      
      setPosts(posts.filter(p => p.id !== postId));
      toast.success("Post deleted successfully");
      
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(null);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.author.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (post.content && post.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Posts</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage platform content and media.</p>
        </div>
        <div className="relative group w-full sm:w-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search posts..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-56 transition-shadow hover:shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {filteredPosts.map((post) => (
              <li key={post.id} className="p-3 flex flex-col sm:flex-row gap-3 hover:bg-gray-50 transition-colors group">
                <div className="flex-1 min-w-0 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 font-bold text-xs">
                    {post.author.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-gray-900 text-sm truncate">{post.author}</span>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-gray-600 line-clamp-1 break-all flex items-center gap-1.5">
                      {post.media && post.media.length > 0 && <ImageIcon className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                      {post.content || 'Attached Media'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4 pl-11 sm:pl-0">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {post.likes}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.comments}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setSelectedPost(post)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors tooltip-trigger"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(post.id)}
                      disabled={isDeleting === post.id}
                      className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-md transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {isDeleting === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {filteredPosts.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">
                No posts match your search.
              </div>
            )}
          </ul>
        </div>
      )}

      {/* View Post Modal remains untouched functionally, but padding tweaked for mobile */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Post Details</h2>
              <button 
                onClick={() => setSelectedPost(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {selectedPost.author.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{selectedPost.author}</h3>
                    <p className="text-[10px] text-gray-500">{new Date(selectedPost.date).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-md text-xs text-gray-600">
                  <span className="flex items-center gap-1 font-medium"><ThumbsUp className="w-3.5 h-3.5 text-blue-500" /> {selectedPost.likes}</span>
                  <span className="flex items-center gap-1 font-medium"><MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> {selectedPost.comments}</span>
                </div>
              </div>

              {selectedPost.content && (
                <div className="mb-4">
                  <p className="text-gray-800 text-sm whitespace-pre-wrap">{selectedPost.content}</p>
                </div>
              )}

              {selectedPost.media && selectedPost.media.length > 0 && (
                <div className="grid gap-2 mb-2">
                  {selectedPost.media.map((url: string, index: number) => {
                    const isVideo = url.match(/\.(mp4|webm|ogg)$/i) || url.includes('video');
                    return (
                      <div key={index} className="rounded-lg overflow-hidden bg-gray-100 border border-gray-100 max-h-72 flex items-center justify-center">
                        {isVideo ? (
                          <video src={url} controls className="max-w-full max-h-72 object-contain" />
                        ) : (
                          <img src={url} alt="Post media" className="max-w-full max-h-72 object-contain" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button 
                onClick={() => setSelectedPost(null)}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => handleDelete(selectedPost.id)}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-md text-xs font-medium hover:bg-rose-700 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
