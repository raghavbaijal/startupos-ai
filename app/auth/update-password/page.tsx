import { updatePassword } from '@/app/auth-actions';
import { Lock, Shield, KeyRound } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UpdatePasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const error = typeof params.error === 'string' ? params.error : undefined;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#FAFAFA] text-slate-900">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-sm relative z-10 border border-slate-200 bg-white">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-slate-550/10 rounded-xl border border-slate-200 mb-3 shadow-inner">
            <Shield className="w-8 h-8 text-slate-800" />
          </div>
          <h1 className="text-3xl font-sans font-bold text-slate-900 tracking-tight">
            Update Password
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Enter your new secure password below
          </p>
        </div>

        {/* Message / Error banners */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-650">
            {error}
          </div>
        )}

        {/* Update Form */}
        <form action={updatePassword} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              New Password
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
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 group active:scale-[0.98] shadow-sm"
          >
            Update and Log In
            <KeyRound className="w-4 h-4 transition-transform group-hover:rotate-12" />
          </button>
        </form>
      </div>
    </div>
  );
}
