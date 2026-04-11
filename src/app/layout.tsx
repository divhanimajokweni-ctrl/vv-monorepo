import type { Metadata } from 'next';
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title:       'Ubuntu Pools — Community Savings',
  description: 'Community savings built on Ubuntu philosophy. Stake from R500.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <ClerkProvider>
          <header>
            <Show when="signed-out">
              <SignInButton />
              <SignUpButton />
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          {children}
          <Analytics />
        </ClerkProvider>
      </body>
    </html>
  );
}
