"use client";

import React, { useEffect, useState } from 'react';
import { Search, Shield, UserCheck, Loader2, Filter, Eye, X, Mail, Phone, Calendar, MapPin, Users, MessageSquare, FileText, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function UsersAdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');

  // Modal State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      
      const res = await fetch(`${apiUrl}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users list');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId: string) => {
    setSelectedUser(userId);
    setLoadingDetails(true);
    setUserDetails(null);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      const res = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch details');
      const data = await res.json();
      setUserDetails(data);
    } catch (error) {
      toast.error('Failed to fetch user details');
      setSelectedUser(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (activityFilter === 'all') return true;
    if (activityFilter === 'online') return user.isOnline;
    
    if (user.lastSeen) {
      const lastSeenDate = new Date(user.lastSeen);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastSeenDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (activityFilter === 'recent') return diffDays <= 2 || user.isOnline;
      if (activityFilter === 'inactive') return diffDays > 7 && !user.isOnline;
    }
    return true;
  });

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Users</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage and view user accounts.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative group flex-1 sm:flex-none">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-48 transition-shadow hover:shadow-sm"
            />
          </div>
          <div className="relative">
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="appearance-none pl-8 pr-6 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-shadow hover:shadow-sm text-gray-700 text-sm font-medium"
            >
              <option value="all">All Users</option>
              <option value="online">Online Now 🟢</option>
              <option value="recent">Active (≤ 2 days)</option>
              <option value="inactive">Inactive (&gt; 7 days)</option>
            </select>
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
             <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-500">
              <thead className="text-[10px] text-gray-400 uppercase bg-gray-50/50">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">User</th>
                  <th scope="col" className="px-4 py-2 font-medium">Activity</th>
                  <th scope="col" className="px-4 py-2 font-medium">Status</th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="bg-white hover:bg-gray-50 transition-colors duration-200 group">
                    <td className="px-4 py-2.5 flex items-center gap-2.5">
                      <div className="relative">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        {user.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full"></span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-[120px] sm:max-w-xs">{user.name}</p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[120px] sm:max-w-xs">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {user.isOnline ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          Online
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-500">
                          {user.lastSeen ? formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true }) : 'Never'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        user.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                        user.status === 'Suspended' ? 'bg-rose-50 text-rose-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button 
                        onClick={() => handleViewUser(user.id)}
                        className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-all inline-flex items-center justify-center"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-xs text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ultra Compact User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">User Summary</h2>
              <button onClick={() => setSelectedUser(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 bg-gray-50/50">
              {loadingDetails ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              ) : userDetails ? (
                <div className="space-y-4">
                  {/* Identity Block */}
                  <div className="flex items-center gap-3">
                    {userDetails.user.avatar ? (
                      <img src={userDetails.user.avatar} className="w-12 h-12 rounded-full border border-gray-200 object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                        {userDetails.user.firstName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{userDetails.user.firstName} {userDetails.user.lastName}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        {userDetails.user.emailOrPhone.includes('@') ? <Mail className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                        {userDetails.user.emailOrPhone}
                      </div>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600 bg-white p-2 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {userDetails.user.dobMonth ? `${userDetails.user.dobDay} ${userDetails.user.dobMonth} ${userDetails.user.dobYear}` : 'N/A'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3 h-3 text-gray-400" />
                      {userDetails.user.gender || 'N/A'}
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {userDetails.user.currentCity || 'No Location specified'}
                    </div>
                  </div>

                  {/* Activity Stats */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-blue-50 rounded-lg p-2 flex flex-col items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-blue-600 mb-1" />
                      <span className="font-bold text-gray-900 text-xs">{userDetails.stats.totalPosts}</span>
                      <span className="text-[9px] text-gray-500">Posts</span>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2 flex flex-col items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-emerald-600 mb-1" />
                      <span className="font-bold text-gray-900 text-xs">{userDetails.stats.totalFriends}</span>
                      <span className="text-[9px] text-gray-500">Friends</span>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2 flex flex-col items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-600 mb-1" />
                      <span className="font-bold text-gray-900 text-xs">{userDetails.stats.totalMessaged}</span>
                      <span className="text-[9px] text-gray-500">Chats</span>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2 flex flex-col items-center justify-center">
                      <UserPlus className="w-3.5 h-3.5 text-amber-600 mb-1" />
                      <span className="font-bold text-gray-900 text-xs">{userDetails.stats.pendingRequests}</span>
                      <span className="text-[9px] text-gray-500">Pending</span>
                    </div>
                  </div>
                  
                  {userDetails.user.bio && (
                    <div className="text-[10px] text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100 italic text-center">
                      "{userDetails.user.bio}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-xs text-rose-500 py-4">Failed to load details</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
