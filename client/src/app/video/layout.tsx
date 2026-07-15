import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vaaknow Reels — Watch Safe & Educational Short Videos",
  description: "Explore immersive 9:16 vertical Reels and educational short videos on Vaaknow. Watch, like, comment, and share captivating moments from student creators and Birdies safely.",
  keywords: ["Vaaknow Reels", "Vaaknow videos", "student short videos", "safe short form video feed", "watch Reels online", "kids safe reels", "educational student videos"],
  alternates: {
    canonical: "https://vaaknow.com/video",
  },
  openGraph: {
    title: "Vaaknow Reels — Watch Safe & Educational Short Videos",
    description: "Explore immersive short Reels and videos shared by student Birdies on Vaaknow.",
    url: "https://vaaknow.com/video",
    siteName: "Vaaknow",
  },
};

export default function VideoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
