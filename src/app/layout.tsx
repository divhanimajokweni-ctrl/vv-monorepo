import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import {
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import './globals.css';

const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://ubuntupools.com'),
  title: {
    default: 'Ubuntu Pools | Collective Prosperity',
    template: '%s | Ubuntu Pools',
  },
  description: 'Distributed governance and ethical financial pools. Coordinate collective wealth with Ubuntu principles — "I am because we are."',
  keywords: ['Ubuntu Pools', 'collective finance', 'governance', 'ethical pools', 'decentralized finance', 'community wealth'],
  authors: [{ name: 'Ubuntu Pools' }],
  creator: 'Ubuntu Pools',
  publisher: 'Ubuntu Pools',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ubuntupools.com',
    siteName: 'Ubuntu Pools',
    title: 'Ubuntu Pools | Collective Prosperity',
    description: 'Distributed governance and ethical financial pools. Coordinate collective wealth with Ubuntu principles.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ubuntu Pools - Collective Prosperity',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ubuntu Pools | Collective Prosperity',
    description: 'Distributed governance and ethical financial pools. Coordinate collective wealth with Ubuntu principles.',
    images: ['/og-image.png'],
    creator: '@ubuntupools',
  },
  alternates: {
    canonical: 'https://ubuntupools.com',
    languages: {
      en: 'https://ubuntupools.com',
    },
  },
};

async function AuthHeader() {
  const { userId } = await auth();
  
  return (
    <header className="sticky top-0 z-50 flex items-center justify-end gap-4 p-4 bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border)]">
      {!userId ? (
        <>
          <SignInButton mode="modal">
            <button className="px-4 py-2 text-sm font-medium text-white bg-[color:var(--accent-sage)] hover:bg-[color:var(--accent-sage)]/80 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-sage)]">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="px-4 py-2 text-sm font-medium text-white bg-[color:var(--accent-gold)] hover:bg-[color:var(--accent-gold)]/80 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-gold)]">
              Sign Up
            </button>
          </SignUpButton>
        </>
      ) : (
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-9 h-9"
            }
          }}
        />
      )}
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = (
    <html lang="en" suppressHydrationWarning className="h-full scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col overflow-x-hidden`}>
        {clerkPubKey && <AuthHeader />}
        <main className="flex-grow w-full">
          {children}
        </main>
      </body>
    </html>
  );

  if (!clerkPubKey) {
    return content;
  }

  return <ClerkProvider>{content}</ClerkProvider>;
}
