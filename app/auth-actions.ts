'use server';

import { createClient } from '@/lib/db/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { sendEmail } from '@/lib/resend';
import { trackAnalyticsEvent } from '@/app/analytics-actions';

/**
 * Log in a user with email and password
 */
export async function login(formData: FormData) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    redirect('/');
  }
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  // Track returning user event
  await trackAnalyticsEvent('returning_user', 'returning_user_session', { email }).catch(() => {});

  reDirectToDashboard();
}

/**
 * Sign up a new user with email and password
 */
export async function signup(formData: FormData) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    redirect(`/login?message=${encodeURIComponent('Check your email to verify your account and complete sign up.')}`);
  }
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  
  const supabase = await createClient();
  const origin = (await headers()).get('origin') || '';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Track signup event
  await trackAnalyticsEvent('signup', 'signup', { email, userId: data?.user?.id }).catch(() => {});

  // Send welcome email via Resend
  await sendEmail({
    to: email,
    subject: 'Welcome to StartupOS AI!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #111827;">Welcome to StartupOS AI!</h2>
        <p>Hi ${fullName},</p>
        <p>Thank you for signing up. Your account is created, and your startup workspace is ready to build and validate your ventures.</p>
        <p>Get started by creating your first workspace and letting the AI co-founder design your business roadmap, financials, and marketing strategy.</p>
        <div style="margin: 24px 0;">
          <a href="${origin}/" style="background-color: #111827; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Go to Dashboard</a>
        </div>
        <p style="color: #6b7280; font-size: 12px; margin-top: 40px; border-t: 1px solid #e5e7eb; padding-top: 20px;">Powered by StartupOS AI.</p>
      </div>
    `
  }).catch(err => console.error('Failed to send welcome email:', err));

  redirect(`/login?message=${encodeURIComponent('Check your email to verify your account and complete sign up.')}`);
}

/**
 * Initiate password reset flow (sends email link)
 */
export async function resetPassword(formData: FormData) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    redirect(`/reset-password?success=${encodeURIComponent('Password reset link sent! Please check your email.')}`);
  }
  const email = formData.get('email') as string;
  const supabase = await createClient();
  const origin = (await headers()).get('origin') || '';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/update-password`,
  });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  // Send a backup notification link via Resend
  await sendEmail({
    to: email,
    subject: 'Reset Password Request - StartupOS AI',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #111827;">Reset Your Password</h2>
        <p>You requested to reset your password for your StartupOS AI account.</p>
        <p>If you did not request this change, you can safely ignore this email.</p>
        <p>Otherwise, click the link below to access the update page:</p>
        <div style="margin: 24px 0;">
          <a href="${origin}/auth/update-password" style="background-color: #111827; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Update Password</a>
        </div>
      </div>
    `
  }).catch(err => console.error('Failed to send reset email:', err));

  redirect(`/reset-password?success=${encodeURIComponent('Password reset link sent! Please check your email.')}`);
}

/**
 * Update the user's password (after clicking reset link)
 */
export async function updatePassword(formData: FormData) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    redirect('/login?message=Password updated successfully. Please login.');
  }
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    redirect(`/auth/update-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/login?message=Password updated successfully. Please login.');
}

/**
 * Log out user and redirect to login page
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Initiate Login with Google OAuth
 */
export async function loginWithGoogle() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    redirect('/');
  }
  const supabase = await createClient();
  const origin = (await headers()).get('origin') || '';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data?.url) {
    redirect(data.url); // Redirect user to Google OAuth page
  }

  redirect(`/login?error=${encodeURIComponent('OAuth URL generation failed.')}`);
}

function reDirectToDashboard() {
  redirect('/');
}
