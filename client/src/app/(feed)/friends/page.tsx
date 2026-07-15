"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { UserPlus, Clock, Check, Users as UsersIcon } from "lucide-react";
import { API_URL } from "@/config/api";
import toast, { Toaster } from "react-hot-toast";

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState("suggestions");
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Track which user IDs are currently loading (button spinner)
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const [reqRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/friends/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const reqData = await reqRes.json();
      const usersData = await usersRes.json();

      if (reqRes.ok) setRequests(reqData.requests || []);
      if (usersRes.ok) setUsers(usersData.users || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    action: string,
    userId: string,
    userName: string,
    endpoint: string,
    method: string
  ) => {
    // Optimistic UI — update state instantly before API call
    setActionLoading((prev) => new Set(prev).add(userId));

    if (action === "add") {
      // Instantly change status to request_sent (no refresh needed)
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "request_sent" } : u))
      );
    } else if (action === "cancel") {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "none" } : u))
      );
    } else if (action === "unfriend") {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "none" } : u))
      );
    } else if (action === "accept") {
      // Remove from requests list, move to friends
      setRequests((prev) => prev.filter((r) => r.requester.id !== userId));
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "friends" } : u))
      );
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/friends/${endpoint}/${userId}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        // Show branded toast notification
        if (action === "add") {
          toast.success(`Friend request sent to ${userName}! 🎉`, {
            style: {
              background: "#1877f2",
              color: "#fff",
              fontWeight: "600",
              borderRadius: "12px",
              padding: "12px 18px",
              fontSize: "14px",
              boxShadow: "0 4px 20px rgba(24,119,242,0.35)",
            },
            iconTheme: { primary: "#fff", secondary: "#1877f2" },
            duration: 3000,
            position: "bottom-center",
          });
        } else if (action === "cancel") {
          toast(`Request cancelled`, {
            icon: "✕",
            style: {
              background: "#e4e6eb",
              color: "#050505",
              fontWeight: "600",
              borderRadius: "12px",
              padding: "12px 18px",
              fontSize: "14px",
            },
            duration: 2000,
            position: "bottom-center",
          });
        } else if (action === "accept") {
          toast.success(`You and ${userName} are now friends! 🎊`, {
            style: {
              background: "#42b72a",
              color: "#fff",
              fontWeight: "600",
              borderRadius: "12px",
              padding: "12px 18px",
              fontSize: "14px",
              boxShadow: "0 4px 20px rgba(66,183,42,0.35)",
            },
            iconTheme: { primary: "#fff", secondary: "#42b72a" },
            duration: 3000,
            position: "bottom-center",
          });
        } else if (action === "unfriend") {
          toast(`${userName} removed from friends`, {
            icon: "👋",
            style: {
              background: "#e4e6eb",
              color: "#050505",
              fontWeight: "600",
              borderRadius: "12px",
              padding: "12px 18px",
              fontSize: "14px",
            },
            duration: 2000,
            position: "bottom-center",
          });
        }
      } else {
        // Rollback optimistic update on failure
        fetchData();
      }
    } catch (error) {
      fetchData();
      console.error(error);
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const isLoading = (userId: string) => actionLoading.has(userId);

  return (
    <div suppressHydrationWarning className="max-w-[1000px] mx-auto w-full pt-6">
      <Toaster />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[24px] font-bold text-black">Friends</h1>
      </div>

      <div suppressHydrationWarning className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button
          suppressHydrationWarning
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 rounded-full font-semibold text-[15px] whitespace-nowrap transition-colors ${
            activeTab === "requests"
              ? "bg-[#e7f3ff] text-[#1877f2]"
              : "bg-gray-200 text-black hover:bg-gray-300"
          }`}
        >
          Friend Requests ({requests.length})
        </button>
        <button
          suppressHydrationWarning
          onClick={() => setActiveTab("suggestions")}
          className={`px-4 py-2 rounded-full font-semibold text-[15px] whitespace-nowrap transition-colors ${
            activeTab === "suggestions"
              ? "bg-[#e7f3ff] text-[#1877f2]"
              : "bg-gray-200 text-black hover:bg-gray-300"
          }`}
        >
          Suggestions
        </button>
        <button
          suppressHydrationWarning
          onClick={() => setActiveTab("friends")}
          className={`px-4 py-2 rounded-full font-semibold text-[15px] whitespace-nowrap transition-colors ${
            activeTab === "friends"
              ? "bg-[#e7f3ff] text-[#1877f2]"
              : "bg-gray-200 text-black hover:bg-gray-300"
          }`}
        >
          All Friends
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">

          {/* ─── Friend Requests Tab ─── */}
          {activeTab === "requests" && requests.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-10">
              No pending friend requests.
            </div>
          )}

          {activeTab === "requests" &&
            requests.map((req) => (
              <div
                key={req.requestId}
                className="bg-white rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-300"
              >
                <Link
                  href={`/profile/${req.requester.id}`}
                  className="block overflow-hidden relative pb-[100%]"
                >
                  <img
                    src={req.requester.avatar}
                    alt="User"
                    className="absolute top-0 left-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                <div className="p-4 bg-white relative z-10 flex flex-col justify-between">
                  <Link href={`/profile/${req.requester.id}`}>
                    <h3 className="font-semibold text-[17px] text-gray-900 hover:underline truncate">
                      {req.requester.name}
                    </h3>
                  </Link>
                  <div className="flex flex-col gap-2 mt-4">
                    <button
                      onClick={() =>
                        handleAction("accept", req.requester.id, req.requester.name, "accept", "PUT")
                      }
                      disabled={isLoading(req.requester.id)}
                      className="w-full bg-[#1877f2] hover:bg-[#166fe5] disabled:opacity-60 text-white py-1.5 rounded-md font-semibold text-[15px] transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading(req.requester.id) ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check size={16} /> Confirm
                        </>
                      )}
                    </button>
                    <Link
                      href={`/profile/${req.requester.id}`}
                      className="w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-900 py-1.5 rounded-md font-semibold text-[15px] transition-colors block"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            ))}

          {/* ─── Suggestions Tab ─── */}
          {activeTab === "suggestions" &&
            users.filter((u) => u.status === "none" || u.status === "request_sent").length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-10">
                No more suggestions.
              </div>
            )}

          {activeTab === "suggestions" &&
            users
              .filter((u) => u.status === "none" || u.status === "request_sent")
              .map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-300"
                >
                  <Link
                    href={`/profile/${user.id}`}
                    className="block overflow-hidden relative pb-[100%]"
                  >
                    <img
                      src={user.avatar}
                      alt="User"
                      className="absolute top-0 left-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <div className="p-4 bg-white relative z-10 flex flex-col justify-between">
                    <Link href={`/profile/${user.id}`}>
                      <h3 className="font-semibold text-[17px] text-gray-900 hover:underline truncate">
                        {user.name}
                      </h3>
                    </Link>
                    <div className="flex flex-col gap-2 mt-4">
                      {user.status === "none" ? (
                        <button
                          onClick={() =>
                            handleAction("add", user.id, user.name, "request", "POST")
                          }
                          disabled={isLoading(user.id)}
                          className="w-full bg-[#e7f3ff] hover:bg-[#dbe7f2] disabled:opacity-60 text-[#1877f2] py-1.5 rounded-md font-semibold text-[15px] flex items-center justify-center gap-2 transition-all duration-200"
                        >
                          {isLoading(user.id) ? (
                            <span className="w-4 h-4 border-2 border-[#1877f2] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <UserPlus size={18} /> Add Friend
                            </>
                          )}
                        </button>
                      ) : (
                        // Pending Request button — instantly shown after clicking Add Friend
                        <button
                          onClick={() =>
                            handleAction("cancel", user.id, user.name, "cancel", "DELETE")
                          }
                          disabled={isLoading(user.id)}
                          className="w-full bg-[#e4e6eb] hover:bg-[#d8dadf] disabled:opacity-60 text-gray-700 py-1.5 rounded-md font-semibold text-[15px] flex items-center justify-center gap-2 transition-all duration-200"
                        >
                          {isLoading(user.id) ? (
                            <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Clock size={16} /> Pending Request
                            </>
                          )}
                        </button>
                      )}
                      <Link
                        href={`/profile/${user.id}`}
                        className="w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-900 py-1.5 rounded-md font-semibold text-[15px] transition-colors block"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

          {/* ─── All Friends Tab ─── */}
          {activeTab === "friends" &&
            users.filter((u) => u.status === "friends").length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-10">
                You have no friends yet.
              </div>
            )}

          {activeTab === "friends" &&
            users
              .filter((u) => u.status === "friends")
              .map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-300"
                >
                  <Link
                    href={`/profile/${user.id}`}
                    className="block overflow-hidden relative pb-[100%]"
                  >
                    <img
                      src={user.avatar}
                      alt="User"
                      className="absolute top-0 left-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <div className="p-4 bg-white relative z-10 flex flex-col justify-between">
                    <Link href={`/profile/${user.id}`}>
                      <h3 className="font-semibold text-[17px] text-gray-900 hover:underline truncate">
                        {user.name}
                      </h3>
                    </Link>
                    <div className="flex flex-col gap-2 mt-4">
                      <button
                        onClick={() =>
                          handleAction("unfriend", user.id, user.name, "unfriend", "DELETE")
                        }
                        disabled={isLoading(user.id)}
                        className="w-full bg-[#e4e6eb] hover:bg-[#d8dadf] disabled:opacity-60 text-gray-900 py-1.5 rounded-md font-semibold text-[15px] transition-colors flex items-center justify-center gap-2"
                      >
                        {isLoading(user.id) ? (
                          <span className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "Unfriend"
                        )}
                      </button>
                      <Link
                        href={`/profile/${user.id}`}
                        className="w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-900 py-1.5 rounded-md font-semibold text-[15px] transition-colors block"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
