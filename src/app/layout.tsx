import type { Metadata } from 'next';
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'Ubuntu Pools | UI/UX Architecture & Layout Blueprint',
  description: 'A technical and aesthetic guide to building the world\'s first meritocratic community wealth governance platform, rooted in South African POPIA compliance and AWS Cape Town sovereignty.',
  icons: { icon: '/favicon.ico' },
  viewport: 'width=device-width, initial-scale=1.0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&family=Playfair+Display:ital,wght@0,900;1,900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <ClerkProvider>
          {children}
          <Analytics />
          <SpeedInsights />
        </ClerkProvider>
      </body>
    </html>
  );
}
