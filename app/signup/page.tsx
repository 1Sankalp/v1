'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Eye, EyeOff, MoveLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '../lib/supabase';
import { Analytics } from '../lib/analytics';

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
      // Track signup started
      Analytics.track.signupStarted({ username });
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

      // Track successful signup
      Analytics.track.signupCompleted({
        userId: authData.user.id,
        username,
        email: email.toLowerCase().trim()
      });

      setShowSuccess(true);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'An error occurred during signup');
      // Track signup error
      Analytics.track.signupCompleted({
        error: err.message,
        username,
        email: email.toLowerCase().trim()
      });
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
      <AnimatePresence mode="wait">
        {!showAccountCreation && !showSuccess ? (
          <motion.div
            className="w-full max-w-lg"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="text-left">
              <Link
                href="/"
                className="block mb-4 text-gray-500 hover:text-black transition-colors"
              >
                <MoveLeft size={24} />
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                First, claim your Super link! 🚀
              </h1>
              <p className="text-gray-500 text-base md:text-lg mb-24">
                The good ones are still available!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="relative">
              <div className="max-w-md">
                <div>
                  <div className="flex items-center bg-[#f6f6f6] rounded-xl overflow-hidden">
                    <span className="pl-4 text-gray-500">superfolio.me/</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      placeholder="username"
                      className="flex-1 bg-transparent py-4 px-1 outline-none"
                      maxLength={30}
                    />
                    {isChecking ? (
                      <div className="animate-spin rounded-xl h-5 w-5 border-2 border-blue-500 border-t-transparent mx-4" />
                    ) : isAvailable && username.length >= 1 ? (
                      <CheckCircle className="text-green-500 w-5 h-5 mx-4" />
                    ) : null}
                  </div>
                  
                  <div className="h-8 mt-2">
                    {!isValidFormat && username.length > 0 && (
                      <motion.p 
                        initial={{ opacity: 0, x: 0 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-red-500 text-sm"
                      >
                        Username must be 3-30 characters and can only contain a-z, 0-9, and hyphens
                      </motion.p>
                    )}
                    
                    {isValidFormat && !isAvailable && username.length >= 1 && (
                      <motion.p 
                        initial={{ opacity: 0, x: 0 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-red-500 text-sm"
                      >
                        Username is taken
                      </motion.p>
                    )}
                  </div>
                </div>

                {isAvailable && username.length >= 1 && (
                  <motion.button
                    type="submit"
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full -mt-4 bg-[#0085ff] text-white font-bold py-4 px-2 rounded-xl
                             transition-all duration-300 hover:bg-[#2999ff] active:transform 
                             active:scale-95 hover:shadow-lg"
                  >
                    Grab my link
                  </motion.button>
                )}
              </div>

              <motion.div 
                className="mt-20"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Link
                  href="/login"
                  className="block text-left text-sm text-[#000000]"
                >
                  or log in
                </Link>
              </motion.div>
            </form>
          </motion.div>
        ) : showAccountCreation && !showSuccess ? (
          <motion.div
            className="w-full max-w-lg"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="text-left mb-16 flex flex-col">
              <div className="mb-0">
                <button
                  type="button"
                  onClick={() => setShowAccountCreation(false)}
                  className="text-gray-500 hover:text-black transition-colors"
                >
                  <MoveLeft size={24} />
                </button>
              </div>
              <div className="flex flex-col gap-y-4">
                <p className="text-gray-500 text-base md:text-lg flex items-center">
                  <span className="text-black">superfolio.me/</span>
                  <span className="text-black">{username}</span>
                  <span className="text-black ml-1">is yours!</span>
                </p>
                <h1 className="text-3xl md:text-4xl font-bold">
                  Now, create your account.
                </h1>
              </div>
            </div>

            <form onSubmit={handleCreateAccount} className="relative">
              <div className="max-w-md mb-20">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
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

                <div className="h-[120px]">
                  <div className="h-[40px] relative">
                    <AnimatePresence mode="wait">
                      {/* Commenting out OR text
                      {email.length === 0 && (
                        <motion.div
                          key="or-text"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="text-left font-bold absolute inset-0"
                        >
                          OR
                        </motion.div>
                      )}
                      */}
                    </AnimatePresence>
                  </div>

                  <div className="relative h-[52px]">
                    <AnimatePresence mode="wait">
                      {/* Commenting out social buttons
                      {email.length === 0 ? (
                        <motion.div
                          key="social-buttons"
                          className="flex gap-4 absolute inset-0"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleSocialSignup('google')}
                            className="flex-1 bg-[#0085ff] text-white text-sm font-bold py-4 px-2 rounded-xl
                                     transition-all duration-300 hover:bg-[#2999ff] active:transform 
                                     active:scale-95 hover:shadow-lg flex items-center justify-center
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'Connecting...' : 'Sign up with Google'}
                          </button>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleSocialSignup('github')}
                            className="flex-1 bg-black text-white text-sm font-bold py-4 px-2 rounded-xl
                                     transition-all duration-300 hover:bg-gray-800 active:transform 
                                     active:scale-95 hover:shadow-lg flex items-center justify-center
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'Connecting...' : 'Sign up with GitHub'}
                          </button>
                        </motion.div>
                      ) : (
                      */}
                        <motion.div
                          key="create-account"
                          className="absolute inset-0"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <button
                            type="submit"
                            disabled={isLoading || !email || !password}
                            className="w-full bg-[#0085ff] text-white text-sm font-bold py-4 px-2 rounded-xl
                                     transition-all duration-300 hover:bg-[#2999ff] active:transform 
                                     active:scale-95 hover:shadow-lg flex items-center justify-center
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                          </button>
                        </motion.div>
                      {/* Commenting out closing of social buttons condition
                      )}
                      */}
                    </AnimatePresence>
                  </div>
                </div>
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
            </form>
          </motion.div>
        ) : (
          <motion.div
            className="w-full max-w-lg"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="text-left">
              <div className="flex flex-col gap-y-8">
                <div className="flex items-center gap-x-3">
                  <h1 className="text-3xl md:text-4xl font-bold">Almost there!</h1>
                  <CheckCircle className="text-green-500 w-8 h-8" />
                </div>
                <div className="space-y-6">
                  <p className="text-gray-800 text-base md:text-lg">
                    We've sent you a confirmation email. Please check your inbox and click the link to verify your email address.
                  </p>
                  <p className="text-gray-800 text-base md:text-lg">
                    Once verified, you'll be able to log in and start customizing your profile!
                  </p>
                  <p className="text-gray-500 text-sm">
                    Your profile will be available at: superfolio.me/{username}
                  </p>
                </div>
                <Link
                  href="/login"
                  className="w-[288px] bg-[#0085ff] text-white font-bold py-4 px-2 rounded-xl
                           text-center transition-all duration-300 hover:bg-[#2999ff] active:transform 
                           active:scale-95 hover:shadow-lg"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 