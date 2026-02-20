import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Vertex - Football Player Development Platform',
  description: 'The intelligent platform for football player development. Track progress, get AI-powered training recommendations, and unlock every player\'s potential.',
  keywords: ['football', 'coaching', 'player development', 'training', 'sports tech'],
  authors: [{ name: 'Vertex Football' }],
  openGraph: {
    title: 'Vertex - Football Player Development Platform',
    description: 'The intelligent platform for football player development.',
    url: 'https://vertex-football.com',
    siteName: 'Vertex',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
