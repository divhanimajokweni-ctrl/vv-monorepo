import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/messages/', '/notifications/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/messages/', '/notifications/'],
      },
    ],
    sitemap: 'https://ubuntupools.com/sitemap.xml',
  };
}
