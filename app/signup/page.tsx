'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Eye, EyeOff, MoveLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '../lib/supabase';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isValidFormat, setIsValidFormat] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState(false);
  const [showAccountCreation, setShowAccountCreation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const validateUsername = (value: string) => {
    // Only allow lowercase letters, numbers, and hyphens
    const regex = /^[a-z0-9-]{1,30}$/;
    return regex.test(value);
  };

  const checkUsernameAvailability = async (value: string) => {
    if (!validateUsername(value)) {
      setIsValidFormat(false);
      setIsAvailable(null);
      return;
    }
    
    setIsValidFormat(true);
    setIsChecking(true);

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username')
        .eq('username', value.toLowerCase())
        .maybeSingle();

      if (userError) throw userError;
      setIsAvailable(!userData);
    } catch (error) {
      console.error('Error checking username:', error);
      setIsAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (username.length >= 1) {
        checkUsernameAvailability(username);
      } else {
        setIsAvailable(null);
        setIsValidFormat(true);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [username]);

  useEffect(() => {
    // Check if we have a stored username and user just completed OAuth
    const checkAndCreateUser = async () => {
      const storedUsername = localStorage.getItem('pendingUsername');
      if (!storedUsername) return;

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) return;

      // Check if user record exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('id', session.user.id)
        .single();

      if (existingUser) {
        // User exists, clear storage and redirect
        localStorage.removeItem('pendingUsername');
        router.push(`/${existingUser.username}`);
        return;
      }

      try {
        // Create user record with stored username
        const { error: createError } = await supabase
          .from('users')
          .insert({
            id: session.user.id,
            email: session.user.email,
            username: storedUsername,
          });

        if (createError) throw createError;

        // Clear storage and redirect to profile
        localStorage.removeItem('pendingUsername');
        router.push(`/${storedUsername}`);
      } catch (err: any) {
        console.error('Error creating user:', err);
        setError(err.message);
      }
    };

    checkAndCreateUser();
  }, [router]);

  useEffect(() => {
    // Check if we have a stored username
    const storedUsername = localStorage.getItem('pendingUsername');
    if (storedUsername) {
      setUsername(storedUsername);
      setShowAccountCreation(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAvailable && validateUsername(username)) {
      // Store username before showing account creation
      localStorage.setItem('pendingUsername', username);
      setShowAccountCreation(true);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log('Creating account with:', { email, username });
      
      // First check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${email},username.eq.${username}`)
        .single();

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Sign up with Supabase Auth 
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password.trim(),
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
          data: {
            username: username.toLowerCase().trim()
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from auth signup');

      // Create user record using fetch to backend endpoint
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: authData.user.id,
          email: email.toLowerCase().trim(),
          username: username.toLowerCase().trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user record');
      }

      setShowSuccess(true);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider: 'google' | 'github') => {
    try {
      // Store username before OAuth flow
      if (username) {
        localStorage.setItem('pendingUsername', username);
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Social signup error:', err);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-left px-4 md:px-24 pt-16 md:pt-32">
      <div className="w-full max-w-lg">
        <div className="text-left">
          <Link
            href="/"
            className="block mb-4 text-gray-500 hover:text-black transition-colors"
          >
            <MoveLeft size={24} />
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Create your Superfolio
          </h1>
          <p className="text-gray-500 text-base md:text-lg mb-6">
            Your portfolio is just a few clicks away!
          </p>
        </div>

        {error && (
          <div className="mb-6 text-red-600">
            {error}
          </div>
        )}

        {showSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <h2 className="text-2xl font-bold">Check your email</h2>
              <p className="text-gray-500 max-w-sm">
                We've sent you a confirmation link. Please check your email to verify your account.
              </p>
            </div>
          </motion.div>
        ) : showAccountCreation ? (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <form onSubmit={handleCreateAccount}>
              <div className="space-y-4 mb-6">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email"
                    className="w-full text-sm bg-[#f6f6f6] py-4 px-4 rounded-xl outline-none"
                  />
                </div>
                <div className="relative">
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

              <div className="relative h-[52px]">
                <button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full bg-[#0085ff] text-white text-sm font-bold py-4 rounded-xl
                           transition-all duration-300 hover:bg-[#2999ff] active:transform 
                           active:scale-95 hover:shadow-lg flex items-center justify-center
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <form onSubmit={handleSubmit}>
              <div className="relative mb-6">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="choose your username"
                  className={`w-full text-sm py-4 px-4 rounded-xl outline-none pr-12
                           ${isAvailable === false ? 'bg-red-50' : 'bg-[#f6f6f6]'}
                           ${isAvailable === true ? 'bg-green-50' : ''}`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isChecking ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  ) : isAvailable === true ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : isAvailable === false ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : null}
                </div>
              </div>

              {!isValidFormat && username && (
                <p className="text-red-500 text-sm mb-4">
                  Username can only contain lowercase letters, numbers, and hyphens
                </p>
              )}

              <div className="relative h-[156px]">
                <div className="text-left font-bold my-6">
                  OR
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSocialSignup('google')}
                    className="flex-1 bg-[#0085ff] text-white text-sm font-bold py-4 rounded-xl
                             transition-all duration-300 hover:bg-[#2999ff] active:transform 
                             active:scale-95 hover:shadow-lg flex items-center justify-center
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Connecting...' : 'Continue with Google'}
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSocialSignup('github')}
                    className="flex-1 bg-black text-white text-sm font-bold py-4 rounded-xl
                             transition-all duration-300 hover:bg-gray-800 active:transform 
                             active:scale-95 hover:shadow-lg flex items-center justify-center
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Connecting...' : 'Continue with GitHub'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {!showSuccess && (
          <div className="mt-8 text-sm">
            <span className="text-gray-500">Already have an account? </span>
            <Link href="/login" className="text-[#0085ff] font-bold hover:underline">
              Log in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 