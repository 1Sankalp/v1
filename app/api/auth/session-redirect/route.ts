import { NextRequest } from 'next/server';
import { auth } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // If no session or no user, redirect to login
    if (!session?.user) {
      return Response.redirect(new URL('/login', request.url));
    }

    // Try to get username from session
    if (session.user.username) {
      return Response.redirect(new URL(`/${session.user.username}`, request.url));
    }

    // If no username in session, try to get it from database
    const { data: userData } = await supabase
      .from('users')
      .select('username')
      .eq('id', session.user.id)
      .single();

    if (userData?.username) {
      return Response.redirect(new URL(`/${userData.username}`, request.url));
    }

    // If still no username, redirect to login with error
    return Response.redirect(new URL('/login?error=no_username', request.url));
  } catch (error) {
    console.error('Session redirect error:', error);
    return Response.redirect(new URL('/login', request.url));
  }
} 