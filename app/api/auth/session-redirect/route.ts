import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get the current path
    const currentPath = new URL(request.url).pathname;
    
    // If we're already on a profile page (path has exactly one segment), don't redirect
    if (currentPath.split('/').filter(Boolean).length === 1) {
      return new Response(null, { status: 200 });
    }

    // Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    // If no session or no user, redirect to home
    if (!session?.user) {
      return Response.redirect(new URL('/', request.url));
    }

    // Try to get username from user metadata
    const username = session.user.user_metadata?.username;
    if (username) {
      return Response.redirect(new URL(`/${username}`, request.url));
    }

    // If no username in metadata, try to get it from database
    const { data: userData } = await supabase
      .from('users')
      .select('username')
      .eq('id', session.user.id)
      .single();

    if (userData?.username) {
      return Response.redirect(new URL(`/${userData.username}`, request.url));
    }

    // If still no username, redirect to home
    return Response.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Session redirect error:', error);
    return Response.redirect(new URL('/', request.url));
  }
} 