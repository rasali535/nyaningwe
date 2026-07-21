'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, LayoutDashboard, Loader, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/admin/login') {
        router.push('/admin/login');
      } else if (user && pathname === '/admin/login') {
        router.push('/admin/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const handleSignOut = async () => {
    await logout();
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="h-10 w-10 animate-spin text-brand-green-600 mx-auto" />
          <p className="text-slate-400 text-sm font-semibold">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  // Render Login page standalone without navbar frame
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Prevent flash rendering of dashboard before redirect takes place
  if (!user) {
    return null;
  }

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col">
      {/* Admin Header Nav */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-24 overflow-hidden rounded bg-white p-1">
            <Image
              src="/logo.jpg"
              alt="Nyaningwe Logo"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-md font-black tracking-tight text-white leading-tight">Admin Console</h1>
            <p className="text-xxs font-bold text-brand-orange-500 uppercase tracking-widest leading-none mt-0.5">
              Nyaningwe Cash & Carry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 font-semibold hidden sm:inline flex items-center gap-1">
            <User size={14} className="inline text-brand-green-600" /> {user.email}
          </span>
          <Link
            href="/"
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors border border-slate-800 rounded-lg px-3 py-1.5 bg-slate-950"
          >
            Storefront
          </Link>
          <button
            onClick={handleSignOut}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1.5 border border-rose-950 rounded-lg px-3 py-1.5 bg-rose-950/20"
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <aside className="w-64 bg-slate-900/50 border-r border-slate-900 p-6 space-y-6 hidden md:block shrink-0">
          <div className="space-y-1.5">
            <div className="text-xxs font-bold text-slate-500 uppercase tracking-wider px-3">
              Navigation
            </div>
            <Link
              href="/admin/dashboard"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                pathname === '/admin/dashboard'
                  ? 'bg-brand-green-700 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <LayoutDashboard size={18} /> Product Enrichment
            </Link>
          </div>

          <div className="border-t border-slate-900 pt-6 space-y-1 text-xs text-slate-500 bg-slate-950/40 rounded-xl p-4 border">
            <p className="font-bold text-slate-400">POS Sync Active</p>
            <p className="leading-relaxed mt-1">
              Prices and inventory are fetched from the legacy POS. Admins enrich details here.
            </p>
          </div>
        </aside>

        {/* Dashboard Content Container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
