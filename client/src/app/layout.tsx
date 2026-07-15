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
  metadataBase: new URL("https://vaaknow.com"),
  title: {
    default: "Vaaknow — Safe Social Platform for Students (Ages 6-16)",
    template: "%s | Vaaknow"
  },
  description:
    "Vaaknow is a safe, moderated social platform built exclusively for students aged 6–16. Share Chirps, watch Reels, connect with Birdies, and enjoy a cyberbullying-free community powered by an Automated Moderation Engine and 3-Strike Disciplinary System.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  keywords: [
    // Brand-exact (highest priority — triggers branded search)
    "Vaaknow",
    "Vaaknow.com",
    "vaaknow.com",
    "Vaaknow app",
    "Vaaknow social",
    "Vaaknow login",
    "Vaaknow sign up",
    "Vaaknow platform",
    "vaaknow social network",
    "vaaknow student app",
    "vaaknow for kids",
    "vaaknow for students",

    // Long-tail branded
    "Vaaknow safe social media",
    "Vaaknow child-friendly social network",
    "Vaaknow moderated student platform",
    "Vaaknow Chirps and Reels",
    "Vaaknow Birdies friends",
    "Vaaknow 3-Strike System",
    "Vaaknow automated moderation",
    "Vaaknow 6 to 16 students",

    // Category keywords
    "safe social media for kids",
    "social network for students",
    "child-friendly social media app",
    "student social platform India",
    "moderated social media for children",
    "cyberbullying-free social network",
    "safe mini-facebook for students",
    "social media for school students",
    "kids social media platform",
    "safe online community for teenagers",
    "AI moderated student community",
    "automated moderation social platform",
  ],
  authors: [{ name: "Vaaknow Team", url: "https://vaaknow.com" }],
  creator: "Vaaknow",
  publisher: "Vaaknow",
  category: "Social Networking",
  classification: "Education, Social Networking",
  alternates: {
    canonical: "https://vaaknow.com",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Vaaknow — Safe Social Platform for Students (Ages 6-16)",
    description:
      "Join Vaaknow — the safe, moderated social network for students aged 6–16. Share Chirps, watch Reels, connect with Birdies. Powered by an Automated Moderation Engine & 3-Strike System.",
    url: "https://vaaknow.com",
    siteName: "Vaaknow",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://vaaknow.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Vaaknow — Safe Social Platform for Students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vaaknow — Safe Social Platform for Students (Ages 6-16)",
    description:
      "Vaaknow: The safe, moderated social network for students aged 6–16. Chirps, Reels, Birdies — cyberbullying-free.",
    images: ["https://vaaknow.com/logo.png"],
  },
  verification: {
    // Add your Google Search Console verification code here when you get it
    // google: "YOUR_GOOGLE_VERIFICATION_CODE",
  },
  other: {
    "theme-color": "#1877f2",
    "color-scheme": "light",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Vaaknow",
    "application-name": "Vaaknow",
    "msapplication-TileColor": "#1877f2",
    "rating": "safe for kids",
    "revisit-after": "3 days",
    "language": "English",
    "geo.region": "IN",
    "geo.placename": "India",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = [
    // 1. WebSite schema — enables Google Sitelinks Search Box
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://vaaknow.com/#website",
      "name": "Vaaknow",
      "alternateName": ["vaaknow.com", "Vaaknow.com", "Vaaknow App", "Vaaknow Social"],
      "url": "https://vaaknow.com",
      "description": "Vaaknow is a safe, moderated social platform for students aged 6–16, featuring Chirps, Reels, Birdies, Automated Moderation, and a 3-Strike Disciplinary System.",
      "inLanguage": "en",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://vaaknow.com/?search={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    },

    // 2. Organization — helps Google Knowledge Panel
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://vaaknow.com/#organization",
      "name": "Vaaknow",
      "alternateName": ["vaaknow.com", "Vaaknow Platform"],
      "url": "https://vaaknow.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://vaaknow.com/logo.png",
        "width": 512,
        "height": 512
      },
      "image": "https://vaaknow.com/logo.png",
      "description": "Vaaknow is a safe, child-friendly social networking platform exclusively for students aged 6 to 16 years.",
      "foundingDate": "2024",
      "slogan": "Safe Social for Students",
      "knowsAbout": [
        "Child Safety Online",
        "Student Social Networking",
        "AI Content Moderation",
        "Cyberbullying Prevention"
      ],
      "sameAs": [
        "https://vaaknow.com",
        "https://www.vaaknow.com"
      ]
    },

    // 3. SoftwareApplication — app listing in Google
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": "https://vaaknow.com/#app",
      "name": "Vaaknow",
      "alternateName": "Vaaknow Safe Social Platform",
      "applicationCategory": "SocialNetworkingApplication",
      "applicationSubCategory": "Education",
      "operatingSystem": "Web, iOS, Android",
      "url": "https://vaaknow.com",
      "description": "Vaaknow is a specialized, safe social platform restricted to students aged 6–16. It features an Automated Moderation Engine filtering adult content, abusive slang, and spam, plus a 3-Strike Disciplinary System with 24-hour account suspension.",
      "isFamilyFriendly": true,
      "inLanguage": "en",
      "audience": {
        "@type": "PeopleAudience",
        "suggestedMinAge": "6",
        "suggestedMaxAge": "16",
        "audienceType": "Students aged 6 to 16 years"
      },
      "featureList": [
        "Safe student social networking for ages 6–16",
        "Automated Moderation Engine (adult content, abusive slang, spam filtering)",
        "3-Strike Disciplinary System with 24-hour account suspension",
        "Chirps — clean short-form posts and media",
        "Reels — curated safe vertical short videos",
        "Birdies — verified peer connections",
        "Real-time cyberbullying-free messaging",
        "Daily screen time limit (15 minutes)"
      ],
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "100",
        "bestRating": "5"
      }
    },

    // 4. BreadcrumbList — navigation structure
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Vaaknow Home",
          "item": "https://vaaknow.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Log In",
          "item": "https://vaaknow.com/login"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Sign Up",
          "item": "https://vaaknow.com/signup"
        }
      ]
    },

    // 5. FAQPage — shows rich FAQ snippets on Google
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Vaaknow?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Vaaknow (vaaknow.com) is a safe, moderated social platform built exclusively for students aged 6 to 16 years. It provides a cyberbullying-free environment with features like Chirps (posts), Reels (short videos), and Birdies (friend connections), powered by an Automated Moderation Engine."
          }
        },
        {
          "@type": "Question",
          "name": "Is Vaaknow safe for kids?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Vaaknow is designed exclusively for students aged 6–16. Every post, comment, and message is scanned in real-time by an Automated Moderation Engine. A 3-Strike Disciplinary System automatically suspends accounts for 24 hours upon repeated violations, ensuring a safe environment."
          }
        },
        {
          "@type": "Question",
          "name": "How do I sign up on Vaaknow?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Visit vaaknow.com/signup to create your free Vaaknow account. You'll need to provide your name, email or phone number, and create a password. Vaaknow is free for all students aged 6–16."
          }
        },
        {
          "@type": "Question",
          "name": "What happens if someone uses bad words on Vaaknow?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Vaaknow's Automated Moderation Engine blocks the post immediately and issues a warning (Strike 1 & 2). On the 3rd violation, the user's account is automatically suspended for exactly 24 hours (Strike 3)."
          }
        },
        {
          "@type": "Question",
          "name": "What are Chirps, Reels, and Birdies on Vaaknow?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Chirps are clean short-form posts and media updates. Reels are curated safe 9:16 vertical short videos suitable for students. Birdies are verified peer connections (friends) that foster positive communication on Vaaknow."
          }
        },
        {
          "@type": "Question",
          "name": "Is Vaaknow free to use?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, Vaaknow is completely free for all students aged 6–16. Simply sign up at vaaknow.com to get started."
          }
        }
      ]
    }
  ];

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Structured Data / JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Additional SEO meta */}
        <meta name="theme-color" content="#1877f2" />
        <meta name="msapplication-TileColor" content="#1877f2" />
        <link rel="canonical" href="https://vaaknow.com" />
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
