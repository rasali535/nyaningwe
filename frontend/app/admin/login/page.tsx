'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, loginWithCredentials } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/admin/dashboard');
    }
  }, [user, authLoading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Authenticate using the mocked credentials function
      const success = await loginWithCredentials(email, password);
      if (success) {
        router.push('/admin/dashboard');
      } else {
        setError('Invalid admin credentials. Please use the seeded login details.');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background blur effects */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-green-800/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-brand-orange-600/10 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full space-y-8 bg-slate-950/80 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-md relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-slate-900 border border-slate-800">
            <Lock className="h-8 w-8 text-brand-green-600" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Admin Portal</h2>
            <p className="text-xs font-semibold text-brand-orange-500 uppercase tracking-widest mt-1">
              Nyaningwe Cash & Carry
            </p>
          </div>
        </div>

        {/* Seeded Admin Login Details Notice */}
        <div className="p-4 bg-emerald-950/30 border border-emerald-900/40 rounded-2xl text-xs space-y-2 text-emerald-300">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <Info size={16} />
            <span>MVP Seeded Admin Login</span>
          </div>
          <div className="space-y-1 font-mono text-xxs pl-6">
            <div>Email: <span className="text-white font-bold select-all">admin@nyaningwe.com</span></div>
            <div>Password: <span className="text-white font-bold select-all">admin123</span></div>
          </div>
        </div>

        <form onSubmit={handleAuth} className="mt-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-xs">
            <div className="space-y-1.5">
              <label htmlFor="email-address" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@nyaningwe.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-green-600 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-green-600 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-green-700 hover:bg-brand-green-600 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
