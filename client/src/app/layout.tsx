import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { GlobalDailyTimeLimit } from "@/components/common/GlobalDailyTimeLimit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Nestra — Connect & Share",
    template: "%s | Nestra"
  },
  description: "Nestra is a safe, moderated social learning & connection platform exclusively for students aged 6 to 16 years. Featuring automated bad-word filtering, clean Chirps, curated Reels, and safe Birdie connections.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  keywords: [
    "Nestra",
    "Nestra safe social network",
    "kids social platform ages 6 to 16",
    "student safe social app",
    "bad word filtered social network",
    "chirps",
    "birdies",
    "reels",
    "safe social media for students"
  ],
  authors: [{ name: "Nestra Team" }],
  creator: "Nestra",
  publisher: "Nestra",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Nestra — Safe Social Platform for Students (Ages 6-16)",
    description: "A safe, moderated social platform for students aged 6–16 with automated bad-word filtering. Share clean Chirps, watch Reels, and connect with Birdies.",
    url: "https://nestra.app",
    siteName: "Nestra",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nestra — Safe Social Platform for Students (Ages 6-16)",
    description: "A safe, moderated social platform for students aged 6–16 with automated bad-word filtering. Share clean Chirps, watch Reels, and connect with Birdies.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SocialNetworkingApp",
    "name": "Nestra",
    "applicationCategory": "SocialNetworkingApplication",
    "operatingSystem": "All",
    "description": "Nestra is a safe, AI-moderated social platform exclusively designed for students and young people aged 6 to 16 years. It features automated bad-word filtering, safe connections with Birdies, and clean short-form Chirps and Reels.",
    "url": "https://nestra.app",
    "isFamilyFriendly": true,
    "audience": {
      "@type": "PeopleAudience",
      "suggestedMinAge": "6",
      "suggestedMaxAge": "16",
      "audienceType": "Students and Children aged 6 to 16 years"
    },
    "featureList": [
      "Age 6-16 Safe & Moderated Community",
      "Automated Bad Word & Abusive Language Filtering",
      "Safe Chirps & Educational Reels",
      "Connect safely with Birdies"
    ],
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-fb-bg text-fb-text-dark">
        <AuthGuard>
          <SocketProvider>
            {children}
            <GlobalDailyTimeLimit />
          </SocketProvider>
        </AuthGuard>
      </body>
    </html>
  );
}
