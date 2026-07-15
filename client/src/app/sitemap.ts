import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://vaaknow.in';
  const now = new Date();

  return [
    // Homepage — highest priority, Google indexes this first
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // Login — brand search "vaaknow login" lands here
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // Signup — brand search "vaaknow sign up" lands here
    {
      url: `${baseUrl}/signup`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // Video / Reels — high traffic potential
    {
      url: `${baseUrl}/video`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    // Friends / Birdies
    {
      url: `${baseUrl}/friends`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    // Profile
    {
      url: `${baseUrl}/profile`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    // Messages
    {
      url: `${baseUrl}/messages`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];
}
