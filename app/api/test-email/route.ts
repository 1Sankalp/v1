import { Resend } from 'resend';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new Response(null, { status: 404 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: 'Superfolio <onboarding@superfolio.me>',
      to: 'delivered@resend.dev',
      subject: 'Test Email',
      html: '<p>This is a test email from Superfolio</p>',
    });

    return Response.json({ success: true, result });
  } catch (error) {
    console.error('Test email error:', error);
    return Response.json({ success: false, error }, { status: 500 });
  }
}
