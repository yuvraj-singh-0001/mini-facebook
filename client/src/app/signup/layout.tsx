import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up for Vaaknow — Join the Safe Student Social Platform",
  description:
    "Create your free Vaaknow account at vaaknow.com. A safe, moderated social network exclusively for students aged 6–16. Join thousands of students sharing Chirps, Reels, and connecting with Birdies.",
  keywords: [
    "Vaaknow sign up",
    "Vaaknow register",
    "vaaknow.com signup",
    "Vaaknow create account",
    "vaaknow student registration",
    "join vaaknow",
    "vaaknow app signup",
    "safe student social signup",
    "child friendly social registration",
  ],
  alternates: {
    canonical: "https://vaaknow.com/signup",
  },
  openGraph: {
    title: "Sign Up for Vaaknow — Join the Safe Student Social Platform",
    description:
      "Create your free Vaaknow account — the safe, moderated social network for students aged 6–16. Chirps, Reels, Birdies — cyberbullying-free.",
    url: "https://vaaknow.com/signup",
    siteName: "Vaaknow",
    images: [
      {
        url: "https://vaaknow.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Vaaknow Sign Up — Safe Social Platform for Students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign Up for Vaaknow — Safe Student Social Platform",
    description:
      "Create your free Vaaknow account — the safe, moderated social network for students aged 6–16.",
    images: ["https://vaaknow.com/logo.png"],
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
