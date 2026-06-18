/**
 * Provider-agnostic Email Dispatcher (Resend API client)
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';

  if (isDemoMode || !apiKey || apiKey === 'placeholder' || apiKey.trim() === '') {
    console.log(`\n==================================================`);
    console.log(`[EMAIL SIMULATION]`);
    console.log(`From:    ${from}`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${html.substring(0, 300)}...`);
    console.log(`==================================================\n`);
    return { success: true, message: 'Email logged to console (Simulation mode).' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[Resend Email Error]', data);
      return { success: false, error: data.message || 'Failed to dispatch email.' };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[Resend Email Exception]', err);
    return { success: false, error: err.message || 'An unexpected email dispatch error occurred.' };
  }
}
