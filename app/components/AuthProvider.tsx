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

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;

    try {
      const supabase = createClient();
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          const currentPath = window.location.pathname;
          const username = currentPath.split('/')[1];

          const keysToKeep = ['tempProfileData'];
          const keysToRemove = Object.keys(localStorage).filter(key => !keysToKeep.includes(key));
          keysToRemove.forEach(key => localStorage.removeItem(key));

          if (username) {
            router.refresh();
          } else {
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

      subscription = authSubscription;
    } catch {
      return;
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  return children;
}
