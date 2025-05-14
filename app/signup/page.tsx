'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Eye, EyeOff, MoveLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

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
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const validateUsername = (value: string) => {
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
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', value)
        .single();

      setIsAvailable(!data);
    } catch (error) {
      console.error('Error checking username:', error);
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
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [username]);

  const validateEmail = (email: string) => {
    // Simpler email validation - just check for @ and .
    const isValid = email.includes('@') && email.includes('.');
    setEmailError(!isValid && email.length > 0);
    return isValid;
  };

  const validatePassword = (password: string) => {
    const isValid = password.length >= 6;
    setPasswordError(!isValid && password.length > 0);
    return isValid;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    validateEmail(newEmail);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  const createUserRecord = async (userId: string) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: email,
            username: username,
            createdAt: now,
            updatedAt: now
          }
        ]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error creating user record:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAvailable && validateUsername(username)) {
      setShowAccountCreation(true);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (!validatePassword(password)) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Sign up and automatically sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create account');

      // Create user record in database
      await createUserRecord(authData.user.id);

      // Change URL to username and show success
      router.push(`/${username}`);
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.message);
      setShowSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider: 'google' | 'github') => {
    setError(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/${username}`
        }
      });

      if (error) throw error;
      
      // Change URL to username and show success
      router.push(`/${username}`);
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.message);
      setShowSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-left px-24">
      <div className="fixed top-1/2 -translate-y-1/2 w-full max-w-lg">
        <AnimatePresence mode="wait">
          {!showAccountCreation && !showSuccess ? (
            <motion.div
              key="username-selection"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-left space-y-4 mb-28">
                <h1 className="text-4xl font-bold">
                  First, claim your Super link! 🚀
                </h1>
                <p className="text-gray-500 text-lg">
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
                      className="absolute w-[448px] -mt-4 bg-[#0085ff] text-white font-bold py-4 px-2 rounded-xl
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
              key="account-creation"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.6 }}
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
                  <p className="text-gray-500 text-lg flex items-center">
                    <span className="text-black">superfolio.me/</span>
                    <span className="text-black">{username}</span>
                    <span className="text-black ml-1">is yours!</span>
                  </p>
                  <h1 className="text-4xl font-bold">
                    Now, create your account.
                  </h1>
                </div>
              </div>

              <form onSubmit={handleCreateAccount} className="relative">
                <div className="max-w-md mb-20">
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                      <input
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="email"
                        className="w-full text-sm bg-[#f6f6f6] py-4 px-4 rounded-xl outline-none"
                      />
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={handlePasswordChange}
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
                    <AnimatePresence>
                      {email.length === 0 && !emailError && !passwordError && (
                        <motion.div
                          key="or-text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-left font-bold my-6"
                        >
                          OR
                        </motion.div>
                      )}
                      {emailError && (
                        <motion.div
                          key="email-error"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-left text-red-500 my-6"
                        >
                          Please enter a valid email address
                        </motion.div>
                      )}
                      {passwordError && !emailError && (
                        <motion.div
                          key="password-error"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-left text-red-500 my-6"
                        >
                          Password must be at least 6 characters long
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      {email.length === 0 && !emailError && !passwordError ? (
                        <motion.div
                          key="social-buttons"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 1 }}
                          className="flex gap-4"
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
                        <motion.div
                          key="create-account"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 1 }}
                          className="flex gap-4 absolute bottom-0 left-0 right-0"
                        >
                          <button
                            type="submit"
                            disabled={isLoading || !email || !password}
                            className="flex-1 bg-[#0085ff] text-white font-bold py-4 px-2 rounded-xl
                                     transition-all duration-300 hover:bg-[#2999ff] active:transform 
                                     active:scale-95 hover:shadow-lg flex items-center justify-center
                                     disabled:opacity-100 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
              key="success-view"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.6 }}
              className="text-left"
            >
              <div className="flex flex-col gap-y-8 mb-28">
                <div className="flex items-center gap-x-3">
                  <h1 className="text-4xl font-bold">Awesome!</h1>
                  <CheckCircle className="text-green-500 w-8 h-8" />
                </div>
                <div className="space-y-10">
                  <p className="text-gray-800 font-bold text-lg">
                    You can keep adding projects and customising<br /> your profile, and then share it<br /> with the world!
                  </p>
                  <p className="text-gray-800 font-bold text-lg">
                    You will soon be able to add photos, videos,<br /> maps, notes, links, and more!
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Just toggle the view state since we're already at the correct URL
                    setShowSuccess(false);
                  }}
                  disabled={isLoading}
                  className="w-[288px] bg-[#0085ff] text-white font-bold py-4 px-2 rounded-xl
                           transition-all duration-300 hover:bg-[#2999ff] active:transform 
                           active:scale-95 hover:shadow-lg
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Loading...' : 'Go to Profile'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 