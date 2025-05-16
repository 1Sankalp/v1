import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return new Response('Missing token', { status: 400 })
    }

    // Find the verification token
    const { data: verificationData, error: verificationError } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (verificationError || !verificationData) {
      return new Response('Invalid token', { status: 400 })
    }

    // Check if token is expired
    if (new Date(verificationData.expires) < new Date()) {
      return new Response('Token expired', { status: 400 })
    }

    // Update user's email verification status
    const { error: updateError } = await supabase
      .from('users')
      .update({ emailVerified: new Date().toISOString() })
      .eq('email', verificationData.identifier)

    if (updateError) {
      console.error('Error updating user:', updateError)
      return new Response('Error verifying email', { status: 500 })
    }

    // Delete the used token
    await supabase
      .from('verification_tokens')
      .delete()
      .eq('token', token)

    // Redirect to success page
    return Response.redirect(new URL('/login?verified=true', request.url))
  } catch (error) {
    console.error('Verification error:', error)
    return new Response('Error processing verification', { status: 500 })
  }
} 