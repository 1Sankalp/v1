import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, username, verificationUrl } = await request.json();

    const emailResult = await resend.emails.send({
      from: 'Superfolio <onboarding@resend.dev>',
      to,
      subject: 'Welcome to Superfolio - Verify your email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0085ff; margin-bottom: 24px;">Welcome to Superfolio!</h1>
          <p style="margin-bottom: 24px; font-size: 16px; line-height: 1.5;">Thank you for joining us. Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" style="display: inline-block; background-color: #0085ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-bottom: 24px;">
            Verify Email Address
          </a>
          <p style="margin-bottom: 12px; font-size: 16px; line-height: 1.5;">Your profile will be available at: <strong>superfolio.me/${username}</strong></p>
          <p style="margin-bottom: 8px; color: #666; font-size: 14px;">If the button above doesn't work, copy and paste this URL into your browser:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
        </div>
      `,
      tags: [{ name: 'type', value: 'verification' }]
    });

    return NextResponse.json(emailResult);
  } catch (error: any) {
    console.error('Failed to send verification email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send verification email' },
      { status: 500 }
    );
  }
} 