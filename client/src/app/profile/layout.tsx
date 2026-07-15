import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vaaknow Profile — Student Portfolio & Chirps",
  description: "View student profiles, shared Chirps, Reels, and verified Birdie connections on Vaaknow — the safe social learning platform for ages 6–16.",
  keywords: ["Vaaknow profile", "student portfolio", "Vaaknow user profile", "Chirps timeline", "Birdie connections"],
  alternates: {
    canonical: "https://vaaknow.com/profile",
  },
  openGraph: {
    title: "Student Profile & Chirps — Vaaknow",
    description: "View student profiles, shared Chirps, and Birdie connections on Vaaknow.",
    url: "https://vaaknow.com/profile",
    siteName: "Vaaknow",
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
