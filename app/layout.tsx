import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { headers } from 'next/headers';
import AuthProvider from './components/AuthProvider';
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Superfolio',
  description: 'Your super portfolio',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-white text-black antialiased">
        <AuthProvider>
          {children}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
} 