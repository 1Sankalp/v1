import { Resend } from 'resend';
import { NextRequest } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    console.log('Testing email functionality...');
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    
    const result = await resend.emails.send({
      from: 'Superfolio <onboarding@superfolio.me>',
      to: 'delivered@resend.dev',  // This is a test email that always works
      subject: 'Test Email',
      html: '<p>This is a test email from Superfolio</p>'
    });

    console.log('Email sent successfully:', result);
    return Response.json({ success: true, result });
  } catch (error) {
    console.error('Test email error:', error);
    return Response.json({ success: false, error }, { status: 500 });
  }
} 