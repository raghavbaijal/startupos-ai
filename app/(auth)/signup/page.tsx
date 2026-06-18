import Link from 'next/link';
import { signup, loginWithGoogle } from '@/app/auth-actions';
import { ArrowRight, Chrome, Lock, Mail, User, Shield } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SignupPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const error = typeof params.error === 'string' ? params.error : undefined;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#FAFAFA] text-slate-900">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-sm relative z-10 border border-slate-200 bg-white">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3 shadow-inner">
            <Shield className="w-8 h-8 text-slate-800" />
          </div>
          <h1 className="text-3xl font-sans font-bold text-slate-900 tracking-tight">
            Create Account
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Create an account to begin generating your startup
          </p>
        </div>

        {/* Message / Error banners */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-650">
            {error}
          </div>
        )}

        {/* Signup Form */}
        <form action={signup} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                name="fullName"
                type="text"
                placeholder="John Doe"
                required
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all text-sm shadow-sm"
              />
            </div>
          </div>

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

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                name="password"
                type="password"
                placeholder="Minimum 8 characters"
                minLength={8}
                required
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all text-sm shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 group active:scale-[0.98] shadow-sm"
          >
            Create Free Account
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 w-full border-t border-slate-200" />
          <span className="relative z-10 px-3 bg-white text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Or Connect With
          </span>
        </div>

        {/* OAuth Buttons */}
        <form action={loginWithGoogle}>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-sm"
          >
            <Chrome className="w-5 h-5 text-red-500" />
            Continue with Google
          </button>
        </form>

        {/* Toggle link */}
        <div className="text-center mt-8 text-sm text-slate-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-slate-900 hover:underline font-semibold transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
