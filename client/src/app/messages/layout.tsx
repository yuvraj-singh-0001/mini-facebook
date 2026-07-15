import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vaaknow Messages — Safe Real-time Chat with Birdies",
  description: "Chat securely with your Birdies on Vaaknow. Featuring real-time messaging, automated bad-word filtering, and a student-safe communication environment.",
  keywords: ["Vaaknow chat", "Vaaknow messages", "safe kids chat", "student secure messaging", "Birdie chat"],
  alternates: {
    canonical: "https://vaaknow.com/messages",
  },
  openGraph: {
    title: "Vaaknow Messages — Safe Real-time Chat with Birdies",
    description: "Chat securely with your Birdies on Vaaknow with built-in bad-word filtering.",
    url: "https://vaaknow.com/messages",
    siteName: "Vaaknow",
  },
};

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
