import { createClient } from '@/app/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (!code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent('No verification code found')}`
    );
  }

  const supabase = createClient();

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;

    if (next) {
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }

    const { data: { user } } = await supabase.auth.getUser();
    let username = user?.user_metadata?.username as string | undefined;
    if (!username && user) {
      const { data } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();
      username = data?.username;
    }

    if (username) {
      return NextResponse.redirect(`${requestUrl.origin}/${username}`);
    }

    return NextResponse.redirect(`${requestUrl.origin}/`);
  } catch (error) {
    console.error('Error in auth callback:', error);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(
        'Failed to verify email. Please try again.'
      )}`
    );
  }
}
