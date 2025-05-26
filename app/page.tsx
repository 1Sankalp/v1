'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for auth code in URL
    const code = searchParams?.get('code');
    if (code) {
      // Redirect to auth callback with the code
      router.push(`/auth/callback?code=${code}`);
      return;
    }
  }, [searchParams, router]);

  const handleNavigation = (path: string) => {
    console.log('Navigating to:', path);
    window.location.href = path;
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-white text-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <motion.h1 
          className="mb-16 max-w-4xl mx-auto text-black text-3xl md:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          A Link in Bio.
          <span style={{ paddingTop: '4px', display: 'block' }}>But for developers.</span>
          <span className='text-sm font-light md:text-2xl'>The Only Link You Need to Share to Show All Your Projects.</span>
        </motion.h1>
        
        <div className="flex flex-col gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <button 
              onClick={() => handleNavigation('/signup')}
              className="btn-primary"
            >
              Create your Superfolio
            </button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <button 
              onClick={() => handleNavigation('/login')}
              className="btn-text"
            >
              Log in
            </button>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
} 