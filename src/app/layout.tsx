import type { Metadata } from 'next';
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title:       'Ubuntu Pools — Community Savings',
  description: 'Community savings built on Ubuntu philosophy. Stake from R500.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
