import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const currentPath = new URL(request.url).pathname;
    const origin = new URL(request.url).origin;

    if (currentPath.split('/').filter(Boolean).length === 1) {
      return new Response(null, { status: 200 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/', origin));
    }

    const usernameFromMeta = user.user_metadata?.username as string | undefined;
    if (usernameFromMeta) {
      return NextResponse.redirect(new URL(`/${usernameFromMeta}`, origin));
    }

    const { data: userData } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();

    if (userData?.username) {
      return NextResponse.redirect(new URL(`/${userData.username}`, origin));
    }

    return NextResponse.redirect(new URL('/', origin));
  } catch (error) {
    console.error('Session redirect error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
