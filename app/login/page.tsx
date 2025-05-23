'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, MoveLeft, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/app/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    if (searchParams?.get('verified') === 'true') {
      setSuccess('Email verified successfully! You can now log in.');
    }
    const errorMsg = searchParams?.get('error');
    if (errorMsg && errorMsg !== 'No verification code found') {
      setError(decodeURIComponent(errorMsg));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password.trim()
      });

      if (error) throw error;

      if (data?.user) {
        // Get username from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('username')
          .eq('id', data.user.id)
          .single();

        if (userError) throw userError;

        // Update user metadata with username
        await supabase.auth.updateUser({
          data: { username: userData.username }
        });

        // Redirect to profile page
        router.push(`/${userData.username}`);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Social login error:', err);
      setError(err.message);
    }
  };

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
            Log in to your Superfolio
          </h1>

          <p className="text-gray-500 text-lg mb-6">
            Good to have you back!
          </p>
        </div>

        {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center text-green-600 bg-green-50 p-4 rounded-xl"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {success}
            </motion.div>
          )}

        {error && (
          <div className="mb-6 text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <div className="max-w-md">
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

              <div className="flex gap-4 h-[52px] relative">
                <AnimatePresence mode="wait">
                  {!email ? (
                    <motion.div
                      key="social"
                      className="flex gap-4 w-full absolute inset-0"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleSocialLogin('google')}
                        className="flex-1 bg-[#0085ff] text-white text-sm font-bold py-4 rounded-xl
                                 transition-all duration-300 hover:bg-[#2999ff] active:transform 
                                 active:scale-95 hover:shadow-lg flex items-center justify-center
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Connecting...' : 'Sign in with Google'}
                      </button>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleSocialLogin('github')}
                        className="flex-1 bg-black text-white text-sm font-bold py-4 rounded-xl
                                 transition-all duration-300 hover:bg-gray-800 active:transform 
                                 active:scale-95 hover:shadow-lg flex items-center justify-center
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Connecting...' : 'Sign in with GitHub'}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="login"
                      className="w-full absolute inset-0"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        type="submit"
                        disabled={isLoading || !email || !password}
                        className="w-full bg-[#0085ff] text-white text-sm font-bold py-4 rounded-xl
                                 transition-all duration-300 hover:bg-[#2999ff] active:transform 
                                 active:scale-95 hover:shadow-lg flex items-center justify-center
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Signing in...' : 'Sign in'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <motion.div 
            className="mt-16"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link
              href="/signup"
              className="block text-left text-sm text-[#000000]"
            >
              or sign up
            </Link>
          </motion.div>
        </form>
      </div>
    </div>
  );
} 