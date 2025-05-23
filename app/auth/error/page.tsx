'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Authentication Error</h1>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-700">
            {error === 'Configuration' 
              ? 'There was a problem with the authentication configuration. Please try again.'
              : error || 'An unknown error occurred'}
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            You can try:
          </p>
          <ul className="list-disc text-left pl-5 space-y-2 text-gray-600">
            <li>Refreshing the page</li>
            <li>Clearing your browser cookies</li>
            <li>Using a different authentication method</li>
          </ul>
        </div>

        <div className="pt-4">
          <Link 
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
} 