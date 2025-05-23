'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoveLeft } from 'lucide-react';
import Link from 'next/link';

export default function VerifyRequestPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col items-left px-24 pt-32">
      <div className="w-full max-w-lg">
        <div className="text-left">
          <Link
            href="/"
            className="block mb-4 text-gray-500 hover:text-black transition-colors"
          >
            <MoveLeft size={24} />
          </Link>
          <h1 className="text-4xl font-bold mb-4">
            Almost there! ✨
          </h1>
          <p className="text-gray-500 text-lg mb-6">
            We've sent you a confirmation email. Please check your inbox and click the link to verify your email address.
          </p>
          <p className="text-gray-500 text-base mb-24">
            Once verified, you'll be able to log in and start customizing your profile!
          </p>
        </div>
      </div>
    </div>
  );
} 