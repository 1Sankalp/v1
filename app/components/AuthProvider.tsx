'use client';

import { createClient } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (event === 'SIGNED_OUT') {
        // Get the current URL to extract username
        const currentPath = window.location.pathname;
        const username = currentPath.split('/')[1]; // Get username from URL

        // Clear auth-related data but keep profile data
        const keysToKeep = ['tempProfileData'];
        const keysToRemove = Object.keys(localStorage).filter(key => !keysToKeep.includes(key));
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // If we're on a profile page, stay there but as unauthorized
        if (username) {
          // Just refresh the current page state
          router.refresh();
        } else {
          // If not on a profile page, go to home
          window.location.href = '/';
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const username = session?.user?.user_metadata?.username as string | undefined;
        const path = window.location.pathname;
        if (username && (path === '/' || path === '/login' || path === '/signup')) {
          window.location.href = `/${username}`;
          return;
        }
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return children;
} 