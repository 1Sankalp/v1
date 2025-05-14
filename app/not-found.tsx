'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
      <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
      <Link
        href="/"
        className="text-[#0085ff] hover:text-[#2999ff] font-medium"
      >
        Go back home
      </Link>
    </div>
  );
} 