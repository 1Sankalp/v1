'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from './lib/supabase';
import LandingSkeleton from './components/LandingSkeleton';

function HomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const run = async () => {
      const code = searchParams?.get('code');
      if (code) {
        router.replace(`/auth/callback?code=${encodeURIComponent(code)}`);
        return;
      }

      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          let username = session.user.user_metadata?.username as string | undefined;
          if (!username) {
            const { data } = await supabase
              .from('users')
              .select('username')
              .eq('id', session.user.id)
              .maybeSingle();
            username = data?.username;
          }
          if (username) {
            router.replace(`/${username}`);
            return;
          }
        }
      } catch (error) {
        console.error('Landing session check failed:', error);
      }

      setReady(true);
    };

    run();
  }, [searchParams, router]);

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  if (!ready) {
    return <LandingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-white">
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
            <span className='text-xs font-light md:text-2xl'>The only link you need to share to show everything you are and create.</span>
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="w-full max-w-5xl mx-auto px-4 -mt-64 md:-mt-32 mb-4"
      >
        <div className="relative overflow-hidden rounded-2xl bg-white">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full shadow-lg outline-none border-none"
            style={{ 
              display: 'block',
              objectFit: 'cover',
              width: '100%',
              height: '100%'
            }}
          >
            <source src="/videos/superfolio_demo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </motion.div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LandingSkeleton />}>
      <HomeInner />
    </Suspense>
  );
}
