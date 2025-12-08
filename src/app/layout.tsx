import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bid4Service - Get the Best Price for Your Home Services',
  description:
    'Post your project and let qualified professionals compete for your business. Compare bids, reviews, and choose the perfect match.',
  keywords: [
    'home services',
    'contractors',
    'bidding',
    'plumbing',
    'electrical',
    'HVAC',
    'roofing',
    'home improvement',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
