'use client';

import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: true,
      storage: {
        getItem: (key) => {
          try {
            return localStorage.getItem(key);
          } catch (error) {
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            localStorage.setItem(key, value);
          } catch (error) {
            console.error('Error setting auth storage:', error);
          }
        },
        removeItem: (key) => {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.error('Error removing auth storage:', error);
          }
        }
      }
    },
    db: {
      schema: 'public'
    },
    global: {
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Content-Type': 'application/json',
            'x-client-info': 'superfolio'
          }
        });
      }
    }
  }
); 