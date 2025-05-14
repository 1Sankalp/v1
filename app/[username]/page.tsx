'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [showSuccess, setShowSuccess] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return null;
  }

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
                  You can keep adding projects and customising<br /> your profile, and then share it<br /> with the world!
                </p>
                <p className="text-gray-800 font-bold text-lg">
                  You will soon be able to add photos, videos,<br /> maps, notes, links, and more!
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
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.6 }}
            className="p-8"
          >
            <button
              onClick={handleLogout}
              className="fixed top-8 right-8 px-6 py-2 bg-[#0085ff] text-white text-sm font-bold rounded-xl
                       transition-all duration-300 hover:bg-[#2999ff] active:transform 
                       active:scale-95 hover:shadow-lg"
            >
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 