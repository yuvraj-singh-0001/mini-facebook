"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import CreatePostComponent from "@/components/feed/CreatePostComponent";
import PostComponent from "@/components/feed/PostComponent";
import StoriesSection from "@/components/feed/StoriesSection";
import { useRouter } from "next/navigation";
import { API_URL } from "@/config/api";

const CACHE_KEY = "fb_feed_cache";
const PAGE_SIZE = 10;

// Skeleton loader for posts
function PostSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 animate-pulse">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-3.5 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-2.5 bg-gray-100 rounded w-20" />
        </div>
      </div>
      <div className="px-4 pb-3">
        <div className="h-3 bg-gray-100 rounded w-full mb-2" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
      </div>
      <div className="h-64 bg-gray-100" />
      <div className="p-4 flex justify-between border-t border-gray-100">
        <div className="h-3 bg-gray-100 rounded w-16" />
        <div className="h-3 bg-gray-100 rounded w-20" />
      </div>
    </div>
  );
}

export default function MainFeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [feedLoaded, setFeedLoaded] = useState(false);
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  // Step 1: On mount — load cached posts instantly, then fetch fresh from server
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      router.push("/login");
      return;
    }

    setCurrentUser(JSON.parse(storedUser));

    // Show cached posts immediately (instant feel)
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const cachedPosts = JSON.parse(cached);
        if (cachedPosts.length > 0) {
          setPosts(cachedPosts);
          setInitialLoading(false); // cached data shown, no skeleton needed
        }
      }
    } catch {}

    // Fetch fresh page 1 in background
    fetchFeed(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2: Cache posts whenever they change
  useEffect(() => {
    if (posts.length > 0) {
      // Cache only first 20 posts max to keep localStorage lean
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(posts.slice(0, 20)));
      } catch {}
    }
  }, [posts]);

  // Step 3: Infinite scroll — observe a sentinel element at bottom
  const setupObserver = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !initialLoading) {
          loadNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, initialLoading, page]);

  useEffect(() => {
    setupObserver();
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [setupObserver]);

  const fetchFeed = async (pageNum: number, replace: boolean, retryCount = 0) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_URL}/api/posts/feed?page=${pageNum}&limit=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem(CACHE_KEY);
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (res.ok) {
        const newPosts = data.posts || [];
        if (replace) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => {
            // Deduplicate by _id
            const existingIds = new Set(prev.map((p) => p._id));
            const unique = newPosts.filter((p: any) => !existingIds.has(p._id));
            return [...prev, ...unique];
          });
        }
        setHasMore(data.hasMore !== undefined ? data.hasMore : newPosts.length >= PAGE_SIZE);
        setPage(pageNum);
        setError(null);
      } else {
        if (replace && posts.length === 0) {
          setError(data.message || "Failed to load feed.");
        }
      }
    } catch (err) {
      console.error(err);
      // Automatically retry up to 2 times if server was restarting
      if (retryCount < 2) {
        setTimeout(() => {
          fetchFeed(pageNum, replace, retryCount + 1);
        }, 1000);
        return;
      }
      if (replace && posts.length === 0) {
        setError("Network error. Please check your connection.");
      }
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
      setFeedLoaded(true);
    }
  };

  const loadNextPage = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchFeed(page + 1, false);
  };

  const handlePostCreated = () => {
    fetchFeed(1, true);
  };

  return (
    <div className="w-full max-w-[590px] mx-auto py-4 px-2 sm:px-0">
      {/* Stories Section */}
      <StoriesSection currentUser={currentUser} ready={feedLoaded} />

      <CreatePostComponent currentUser={currentUser} onPostCreated={handlePostCreated} />

      {/* Initial loading — show skeletons only if NO cached data */}
      {initialLoading && posts.length === 0 ? (
        <div>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : error && posts.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm border border-red-200">
          <p className="text-red-500 mb-3">{error}</p>
          <button
            onClick={() => { setInitialLoading(true); setError(null); fetchFeed(1, true); }}
            className="px-4 py-2 bg-[#1877f2] text-white rounded-lg hover:bg-[#166fe5] transition-colors text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-sm border border-gray-200">
          No chirps to show. Add some Birdies to see their chirps!
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostComponent key={post._id} post={post} currentUser={currentUser} />
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={loadMoreTriggerRef} className="h-1" />

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex justify-center py-6">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-5 h-5 border-2 border-[#1877f2] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading more chirps...</span>
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
}
