"use client";

import React, { useEffect, useState } from 'react';
import { Users, FileText, Activity, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, trend, trendUp }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-100 group">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{value}</h3>
      {trend && (
        <p className={`text-sm mt-2 flex items-center gap-1 ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
          <span className="font-medium">{trend}</span> vs last month
        </p>
      )}
    </div>
    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
      <Icon className="w-7 h-7" />
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const adminPin = sessionStorage.getItem('admin_pin') || '';
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
        
        const res = await fetch(`${apiUrl}/api/admin/stats`, {
          headers: {
            'x-admin-pin': adminPin
          }
        });
        
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-gray-500 mt-1">Real-time statistics for your platform.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} trend={`${stats?.trends?.users > 0 ? '+' : ''}${stats?.trends?.users || 0}%`} trendUp={(stats?.trends?.users || 0) >= 0} />
        <StatCard title="Total Posts" value={stats?.totalPosts || 0} icon={FileText} trend={`${stats?.trends?.posts > 0 ? '+' : ''}${stats?.trends?.posts || 0}%`} trendUp={(stats?.trends?.posts || 0) >= 0} />
        <StatCard title="Active Sessions" value={stats?.activeSessions || 0} icon={Activity} trend={`${stats?.trends?.sessions > 0 ? '+' : ''}${stats?.trends?.sessions || 0}%`} trendUp={(stats?.trends?.sessions || 0) >= 0} />
        <StatCard title="Reports" value={stats?.totalReports || 0} icon={AlertCircle} trend={`${stats?.trends?.reports > 0 ? '+' : ''}${stats?.trends?.reports || 0}%`} trendUp={(stats?.trends?.reports || 0) >= 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {stats?.recentActivity?.length > 0 ? (
              stats.recentActivity.map((post: any) => (
                <div key={post._id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center font-bold text-blue-600">
                    {post.user?.firstName?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      <span className="text-blue-600">{post.user?.firstName} {post.user?.lastName}</span> created a new post
                    </p>
                    <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent activity.</p>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Status</h2>
          <div className="space-y-6">
            <div className="group">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Server Load</span>
                <span className="font-medium text-gray-900">{stats?.systemStatus?.serverLoad || 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-500 h-2 rounded-full transform origin-left transition-transform duration-500 group-hover:scale-x-105" style={{ width: `${stats?.systemStatus?.serverLoad || 0}%` }}></div>
              </div>
            </div>
            <div className="group">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Database Usage</span>
                <span className="font-medium text-gray-900">{stats?.systemStatus?.databaseUsage || 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-2 rounded-full transform origin-left transition-transform duration-500 group-hover:scale-x-105" style={{ width: `${stats?.systemStatus?.databaseUsage || 0}%` }}></div>
              </div>
            </div>
            <div className="group">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Memory</span>
                <span className="font-medium text-gray-900">{stats?.systemStatus?.memoryUsage || 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full transform origin-left transition-transform duration-500 group-hover:scale-x-105" style={{ width: `${stats?.systemStatus?.memoryUsage || 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
