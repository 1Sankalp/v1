'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password: password.trim(),
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Wait a moment for the session to be updated
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get username from session
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      
      if (!session?.user?.username) {
        throw new Error('No username found in session');
      }

      // Redirect to user's profile page
      router.push(`/${session.user.username.toLowerCase()}`);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setError(null);
    setIsLoading(true);

    try {
      await signIn(provider, {
        callbackUrl: `${window.location.origin}/api/auth/session-redirect`,
        redirect: true
      });
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-left px-24">
      <div className="fixed top-1/2 -translate-y-1/2 w-full max-w-lg">
        <div className="text-left space-y-4 mb-28">
          <h1 className="text-4xl font-bold">
            Welcome back! 👋
          </h1>
          <p className="text-gray-500 text-lg">
            Log in to your Superfolio account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="max-w-md mb-20">
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email"
                  className="w-full text-sm bg-[#f6f6f6] py-4 px-4 rounded-xl outline-none"
                />
              </div>
              <div className="flex-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  className="w-full text-sm bg-[#f6f6f6] py-4 px-4 rounded-xl outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="relative h-[104px]">
              <div className="text-left font-bold my-6">
                OR
                    </div>

              <div className="flex gap-4">
                    <button
                      type="button"
                  disabled={isLoading}
                  onClick={() => handleSocialLogin('google')}
                      className="flex-1 bg-[#0085ff] text-white text-sm font-bold py-4 px-2 rounded-xl
                               transition-all duration-300 hover:bg-[#2999ff] active:transform 
                               active:scale-95 hover:shadow-lg flex items-center justify-center
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                  {isLoading ? 'Connecting...' : 'Continue with Google'}
                    </button>
                    <button
                      type="button"
                  disabled={isLoading}
                  onClick={() => handleSocialLogin('github')}
                      className="flex-1 bg-black text-white text-sm font-bold py-4 px-2 rounded-xl
                               transition-all duration-300 hover:bg-gray-800 active:transform 
                               active:scale-95 hover:shadow-lg flex items-center justify-center
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                  {isLoading ? 'Connecting...' : 'Continue with GitHub'}
                    </button>
              </div>
            </div>

                    <button
                      type="submit"
                      disabled={isLoading || !email || !password}
              className="w-full bg-[#0085ff] text-white font-bold py-4 px-2 rounded-xl
                               transition-all duration-300 hover:bg-[#2999ff] active:transform 
                               active:scale-95 hover:shadow-lg flex items-center justify-center
                       disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                      {isLoading ? 'Logging in...' : 'Log in'}
                    </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm mt-2"
            >
              {error}
            </motion.p>
          )}

        <motion.div 
            className="mt-4"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link
            href="/signup"
            className="block text-left text-sm text-[#000000]"
          >
              Don't have an account? Sign up
          </Link>
        </motion.div>
        </form>
      </div>
    </div>
  );
} 