import NextAuth from "next-auth"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import { Resend } from 'resend'
import type { User } from "next-auth"
import { authConfig } from "./auth.config"
import type { Adapter } from "@auth/core/adapters"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      email?: string | null
      name?: string | null
      image?: string | null
      emailVerified?: Date | null
    }
  }

  interface User {
    id: string
    username: string
    email?: string | null
    emailVerified?: Date | null
  }
}

const resend = new Resend(process.env.RESEND_API_KEY)

// Initialize Supabase adapter with only the required options
const supabaseAdapter = SupabaseAdapter({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  secret: process.env.SUPABASE_SERVICE_ROLE_KEY!
}) as Adapter

export const config = {
  ...authConfig,
  adapter: supabaseAdapter,
  session: { strategy: "jwt" as const },
  debug: true,
  events: {
    async signIn({ user }: { user: User }) {
      console.log('Sign in event:', user)
    },
    async createUser({ user }: { user: User }) {
      console.log('Create user event triggered with full user object:', JSON.stringify(user, null, 2))
      
      if (!user.email || !user.username) {
        console.error('Missing required fields:', {
          hasEmail: !!user.email,
          hasUsername: !!user.username,
          email: user.email,
          username: user.username
        })
        return
      }
      
      try {
        // Generate verification token
        const verificationToken = crypto.randomUUID()
        console.log('Generated verification token:', verificationToken)
        
        // Store the token in the database
        const tokenResult = await supabaseAdapter.createVerificationToken?.({
          identifier: user.email,
          token: verificationToken,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        })
        console.log('Verification token storage result:', tokenResult)
        
        // Construct email content
        const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`
        const emailContent = `
          <h1>Welcome to Superfolio!</h1>
          <p>Thank you for joining us. Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}">
            Verify Email Address
          </a>
          <p>Your profile will be available at: superfolio.me/${user.username}</p>
          <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
          <p>${verificationUrl}</p>
        `
        
        console.log('Attempting to send email with config:', {
          to: user.email,
          from: 'Superfolio <onboarding@superfolio.me>',
          subject: 'Verify your Superfolio email',
          verificationUrl
        })

        // Send verification email
        const emailResult = await resend.emails.send({
          from: 'Superfolio <onboarding@superfolio.me>',
          to: user.email,
          subject: 'Verify your Superfolio email',
          html: emailContent
        })
        console.log('Email send result:', JSON.stringify(emailResult, null, 2))
      } catch (error) {
        console.error('Detailed error in createUser event:', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined
        })
      }
    }
  }
}

const { auth: nextAuth, handlers: { GET, POST }, signIn, signOut } = NextAuth(config)

export { nextAuth as auth, GET, POST, signIn, signOut }