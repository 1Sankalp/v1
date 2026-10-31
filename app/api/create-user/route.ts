import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { id, email, username } = await request.json();
    const supabase = getSupabaseAdmin();

    // Create user record with service role client
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
      });

    if (userError) {
      console.error('Error creating user:', userError);
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in create-user route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
} 