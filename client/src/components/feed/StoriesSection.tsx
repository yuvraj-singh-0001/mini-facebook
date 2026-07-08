import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import CreateStoryModal from '@/components/feed/CreateStoryModal';
import StoryViewerModal from '@/components/feed/StoryViewerModal';

export default function StoriesSection({ currentUser, ready = true }: { currentUser: any; ready?: boolean }) {
  const [storyGroups, setStoryGroups] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeViewerGroupIndex, setActiveViewerGroupIndex] = useState<number | null>(null);

  const fetchStories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5002/api/stories/feed', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStoryGroups(data.storyGroups || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    // Only fetch when parent says ready (feed loaded first)
    if (ready) {
      fetchStories();
    }
  }, [ready]);

  const openViewer = (index: number) => {
    setActiveViewerGroupIndex(index);
  };

  const closeViewer = () => {
    setActiveViewerGroupIndex(null);
    fetchStories(); // refresh to update borders (seen/unseen)
  };

  return (
    <>
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-2">
        {/* Create Story Card */}
        <div 
          onClick={() => setIsCreateOpen(true)}
          className="min-w-[110px] w-[110px] h-[200px] rounded-xl relative overflow-hidden group cursor-pointer shadow-sm flex-shrink-0 bg-white border border-gray-200 flex flex-col"
        >
          <div className="h-[130px] w-full overflow-hidden">
            <img src={currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="Your Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div className="flex-1 bg-white relative flex flex-col items-center justify-end pb-2">
            <div className="absolute -top-5 w-10 h-10 bg-[#1877f2] rounded-full flex items-center justify-center border-4 border-white">
              <Plus size={20} className="text-white" />
            </div>
            <span className="text-[13px] font-semibold text-black">Create Story</span>
          </div>
        </div>

        {/* Friends' Stories */}
        {storyGroups.map((group, idx) => {
          const latestStory = group.stories[group.stories.length - 1];
          return (
            <div 
              key={group.user._id} 
              onClick={() => openViewer(idx)}
              className="min-w-[110px] w-[110px] h-[200px] rounded-xl relative overflow-hidden group cursor-pointer shadow-sm flex-shrink-0"
            >
              <img src={latestStory.image} alt="Story" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
              
              {/* Avatar with dynamic border color (Blue = unseen, Gray = seen) */}
              <div className={`absolute top-3 left-3 w-10 h-10 rounded-full border-4 ${group.hasUnseen ? 'border-[#1877f2]' : 'border-gray-300'} overflow-hidden`}>
                <img src={group.user.avatar} alt="Avatar" className="w-full h-full bg-white object-cover" />
              </div>
              
              <span className="absolute bottom-2 left-3 right-3 text-white font-semibold text-sm drop-shadow-md truncate">
                {group.user._id === (currentUser?._id || currentUser?.id) ? 'Your Story' : `${group.user.firstName} ${group.user.lastName}`}
              </span>
            </div>
          );
        })}
      </div>

      {isCreateOpen && (
        <CreateStoryModal 
          onClose={() => setIsCreateOpen(false)} 
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchStories();
          }}
        />
      )}

      {activeViewerGroupIndex !== null && (
        <StoryViewerModal 
          storyGroups={storyGroups}
          initialGroupIndex={activeViewerGroupIndex}
          currentUser={currentUser}
          onClose={closeViewer}
        />
      )}
    </>
  );
}
