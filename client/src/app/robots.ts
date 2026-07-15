import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://vaaknow.com';

  return {
    rules: [
      // All search bots — full access to public pages
      {
        userAgent: '*',
        allow: [
          '/',
          '/login',
          '/signup',
          '/video',
          '/friends',
          '/profile',
          '/messages',
          '/sitemap.xml',
          '/llms.txt',
          '/logo.png',
        ],
        disallow: [
          '/api/',
          '/_next/',
          '/private/',
        ],
      },
      // Google — explicit priority access
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/login',
          '/signup',
          '/video',
          '/friends',
          '/profile',
          '/messages',
          '/sitemap.xml',
          '/llms.txt',
          '/logo.png',
        ],
        disallow: ['/api/', '/_next/'],
        crawlDelay: 0,
      },
      // Google Images
      {
        userAgent: 'Googlebot-Image',
        allow: ['/logo.png', '/'],
      },
      // Bing
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/login',
          '/signup',
          '/video',
          '/sitemap.xml',
        ],
        disallow: ['/api/', '/_next/'],
        crawlDelay: 1,
      },
      // AI search engines (Perplexity, ChatGPT, etc.)
      {
        userAgent: [
          'GPTBot',
          'PerplexityBot',
          'ClaudeBot',
          'Google-Extended',
          'CCBot',
          'Applebot-Extended',
          'Amazonbot',
          'Omgilibot',
        ],
        allow: ['/', '/login', '/signup', '/video', '/llms.txt'],
        disallow: ['/api/', '/_next/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
