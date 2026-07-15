import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In to Vaaknow — Safe Social Platform for Students",
  description:
    "Log in to Vaaknow (vaaknow.com) — the safe, moderated social platform for students aged 6–16. Access your Birdies, Chirps, and Reels in a cyberbullying-free environment.",
  keywords: [
    "Vaaknow login",
    "Vaaknow sign in",
    "vaaknow.com login",
    "Vaaknow account login",
    "vaaknow student login",
    "safe student social login",
    "vaaknow app login",
  ],
  alternates: {
    canonical: "https://vaaknow.com/login",
  },
  openGraph: {
    title: "Log In to Vaaknow — Safe Social Platform for Students",
    description:
      "Log in to Vaaknow — the safe, moderated social network for students aged 6–16. Chirps, Reels, Birdies — cyberbullying-free.",
    url: "https://vaaknow.com/login",
    siteName: "Vaaknow",
    images: [
      {
        url: "https://vaaknow.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Vaaknow Login — Safe Social Platform for Students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Log In to Vaaknow — Safe Social Platform for Students",
    description:
      "Log in to Vaaknow — the safe, moderated social network for students aged 6–16.",
    images: ["https://vaaknow.com/logo.png"],
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
