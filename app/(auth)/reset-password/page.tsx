import Link from 'next/link';
import { resetPassword } from '@/app/auth-actions';
import { ArrowLeft, Mail, Shield, Send } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const error = typeof params.error === 'string' ? params.error : undefined;
  const success = typeof params.success === 'string' ? params.success : undefined;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#FAFAFA] text-slate-900">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-sm relative z-10 border border-slate-200 bg-white">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-slate-550/10 rounded-xl border border-slate-200 mb-3 shadow-inner">
            <Shield className="w-8 h-8 text-slate-800" />
          </div>
          <h1 className="text-3xl font-sans font-bold text-slate-900 tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Enter your email and we&apos;ll send you a password reset link
          </p>
        </div>

        {/* Message / Error banners */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-650">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-550/10 border border-emerald-200 rounded-xl text-sm text-emerald-800">
            {success}
          </div>
        )}

        {/* Reset Form */}
        <form action={resetPassword} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all text-sm shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 group active:scale-[0.98] shadow-sm"
          >
            Send Reset Link
            <Send className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </form>

        {/* Go back */}
        <div className="text-center mt-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-850 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
