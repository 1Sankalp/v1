import type { NextAuthConfig } from "next-auth"
import GitHub from "@auth/core/providers/github"
import Google from "@auth/core/providers/google"
import Credentials from "@auth/core/providers/credentials"
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export const authConfig = {
  pages: {
    signIn: '/login',
    verifyRequest: '/verify-request',
    error: '/auth/error'
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        username: { label: "Username", type: "text" },
        isSignup: { label: "Is Signup", type: "boolean" }
      },
      async authorize(credentials) {
        const { email, password, username, isSignup } = credentials as any;
        
        if (!email || !password) {
          throw new Error('Invalid credentials');
        }

        if (isSignup && !username) {
          throw new Error('Username is required for signup');
        }

        try {
          if (isSignup) {
            // Check if user already exists
            const { data: existingUser } = await supabase
              .from('users')
              .select('id')
              .or(`email.eq.${email.toLowerCase()},username.eq.${username.toLowerCase()}`)
              .single();

            if (existingUser) {
              throw new Error('User already exists');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = crypto.randomUUID();

            // Create new user with minimal fields
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: email.toLowerCase(),
                username: username.toLowerCase(),
                hashed_password: hashedPassword,
                emailVerified: null
              })
              .select('id, email, username, "emailVerified"')
              .single();

            if (createError) {
              console.error('Create user error:', createError);
              throw new Error(createError.message);
            }

            // Generate verification token
            const verificationToken = crypto.randomUUID();
            
            // Store verification token
            const { error: tokenError } = await supabase
              .from('verification_tokens')
              .insert({
                identifier: email.toLowerCase(),
                token: verificationToken,
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
              });

            if (tokenError) {
              console.error('Token creation error:', tokenError);
              // Don't throw here, still allow user creation
            } else {
              // Send verification email
              try {
                const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`;
                
                await resend.emails.send({
                  from: 'Superfolio <onboarding@superfolio.me>',
                  to: email.toLowerCase(),
                  subject: 'Verify your Superfolio email',
                  html: `
                    <h1>Welcome to Superfolio!</h1>
                    <p>Thank you for joining us. Please verify your email address by clicking the link below:</p>
                    <a href="${verificationUrl}">Verify Email Address</a>
                    <p>Your profile will be available at: superfolio.me/${username}</p>
                    <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
                    <p>${verificationUrl}</p>
                  `
                });
                console.log('Verification email sent to:', email);
              } catch (emailError) {
                console.error('Error sending verification email:', emailError);
                // Don't throw here, still allow user creation
              }
            }

            return newUser;
          }

          // Handle sign in
          const { data: user, error } = await supabase
            .from('users')
            .select('id, email, username, hashed_password, "emailVerified"')
            .eq('email', email.toLowerCase())
            .single();

          if (error || !user) {
            throw new Error('User not found');
          }

          const isValidPassword = await bcrypt.compare(password, user.hashed_password || '');
          if (!isValidPassword) {
            throw new Error('Invalid password');
          }

          // Return user without password
          const { hashed_password: _, ...userWithoutPassword } = user;
          return userWithoutPassword;
        } catch (error: any) {
          console.error('Auth error:', error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        return { ...token, ...session.user }
      }
      
      if (user) {
        // Ensure we have all required fields
        token.id = user.id;
        token.username = user.username?.toLowerCase();
        token.emailVerified = user.emailVerified;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.emailVerified = token.emailVerified as Date | null;
      }
      return session;
    }
  }
} satisfies NextAuthConfig 