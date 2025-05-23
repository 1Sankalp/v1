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

        // Clear any stored username and other auth-related data
        localStorage.removeItem('pendingUsername');
        
        // If we're on a profile page, stay there but as unauthorized
        if (username) {
          window.location.href = `/${username}`;
        } else {
          // If not on a profile page, go to home
          window.location.href = '/';
        }
      } else {
        // For other auth state changes, refresh the page data
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return children;
} 