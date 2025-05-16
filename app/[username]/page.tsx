'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import { supabase } from '../lib/supabase';

export default function ProfilePage({ params }: { params: { username: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        console.log('Status:', status);
        console.log('Session:', session);
        console.log('Params:', params);

        // Wait for session to be checked
        if (status === 'loading') {
          return;
        }

        // Validate username parameter
        if (!params?.username) {
          if (isMounted) {
            setError('Invalid profile URL');
            setLoading(false);
          }
          return;
        }

        const usernameToCheck = params.username.toLowerCase();
        console.log('Checking username:', usernameToCheck);

        // Try to get user info for the requested username
        const { data: profileUser, error: profileError } = await supabase
          .from('users')
          .select('username')
          .eq('username', usernameToCheck)
          .single();

        if (profileError) {
          console.error('Profile lookup error:', profileError);
          throw profileError;
        }

        // If no profile exists, show error
        if (!profileUser) {
          if (isMounted) {
            setError('Profile not found');
            setLoading(false);
          }
          return;
        }

        console.log('Found profile:', profileUser);

        // If no session, we can still show public profile
        if (status === 'unauthenticated' || !session?.user) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // If we have a session, verify the user
        if (!session.user.id) {
          console.error('No user ID in session');
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // Check if this is the user's own profile
        const isOwnProfile = session.user.username?.toLowerCase() === usernameToCheck;
        console.log('Is own profile:', isOwnProfile);

        if (isOwnProfile) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // If not own profile, verify if user exists in database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('username')
          .eq('id', session.user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error('Database error:', userError);
          throw userError;
        }

        // If no user record exists but we have a session and username
        if (!userData && session.user.username) {
          try {
            const { error: createError } = await supabase
              .from('users')
              .insert([
                { 
                  id: session.user.id,
                  email: session.user.email,
                  username: session.user.username.toLowerCase(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ]);

            if (createError) throw createError;
            
            console.log('Created missing user record during profile check');
          } catch (createError) {
            console.error('Failed to create user record:', createError);
            throw new Error('Failed to create user profile. Please try again.');
          }
        }

        if (isMounted) {
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Profile error:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [params?.username, router, session, status]);

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-xl h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const currentUsername = params?.username || '';
  const isOwnProfile = session?.user?.username?.toLowerCase() === currentUsername.toLowerCase();

  return (
    <div className="min-h-screen bg-white">
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success-view"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.6 }}
            className="fixed top-1/2 -translate-y-1/2 w-full max-w-lg px-24"
          >
            <div className="flex flex-col gap-y-8 mb-28">
              <div className="flex items-center gap-x-3">
                <h1 className="text-4xl font-bold">Awesome!</h1>
                <CheckCircle className="text-green-500 w-8 h-8" />
              </div>
              <div className="space-y-10">
                <p className="text-gray-800 font-bold text-lg">
                  Your email has been verified! You can now start customizing your profile and sharing it with the world!
                </p>
                <p className="text-gray-800 font-bold text-lg">
                  You will soon be able to add photos, videos, maps, notes, links, and more!
                </p>
              </div>
              <button
                onClick={() => setShowSuccess(false)}
                className="w-[288px] bg-[#0085ff] text-white font-bold py-4 px-2 rounded-xl
                         transition-all duration-300 hover:bg-[#2999ff] active:transform 
                         active:scale-95 hover:shadow-lg"
              >
                Go to Profile
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="profile-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">@{currentUsername}</h1>
                {isOwnProfile && (
                  <button
                    onClick={handleLogout}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Log out
                  </button>
                )}
              </div>
              {/* More profile content will go here */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 