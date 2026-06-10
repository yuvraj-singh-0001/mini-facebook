import CreatePost from "@/components/feed/CreatePost";
import Post from "@/components/feed/Post";

export default function MainFeedPage() {
  const dummyPosts = [
    {
      id: 1,
      authorName: "Mark Zuckerberg",
      authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mark",
      timeAgo: "2 hrs",
      content: "Just launched a new feature on Mini-Facebook! Check it out. 🚀",
      imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      likes: 1245,
      comments: 342,
      shares: 89,
    },
    {
      id: 2,
      authorName: "Sarah Connor",
      authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      timeAgo: "5 hrs",
      content: "Beautiful day at the park today! 🌳☀️ Loving this new design.",
      likes: 89,
      comments: 12,
      shares: 2,
    },
  ];

  return (
    <div className="w-full max-w-[590px] mx-auto py-4">
      {/* Stories Section Placeholder */}
      <div className="flex gap-2 mb-6 overflow-x-auto hover-scrollbar pb-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-w-[110px] h-[200px] rounded-xl relative overflow-hidden group cursor-pointer shadow-sm">
            <img src={`https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80`} alt="Story" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            <div className="absolute top-3 left-3 w-10 h-10 rounded-full border-4 border-fb-blue overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=User${i}`} alt="Avatar" className="w-full h-full bg-white" />
            </div>
            <span className="absolute bottom-2 left-3 text-white font-semibold text-sm drop-shadow-md">User {i}</span>
          </div>
        ))}
      </div>

      <CreatePost />
      
      {dummyPosts.map((post) => (
        <Post key={post.id} {...post} />
      ))}
    </div>
  );
}
