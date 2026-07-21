'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Search, Menu, X, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const { cartCount, cartTotal } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Banner (Address / Contact) */}
      <div className="bg-brand-green-800 text-white text-xs py-2 px-4 text-center font-medium">
        📍 Visit us at: 41 Ed Mnangagwa St, Masvingo | 📦 Fast Store Pickup & Local Delivery Available
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Name */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative h-12 w-28 overflow-hidden rounded-md border border-slate-100 bg-white p-1">
                  <Image
                    src="/logo.jpg"
                    alt="Nyaningwe Cash & Carry Logo"
                    fill
                    sizes="(max-width: 120px) 100vw, 120px"
                    className="object-contain transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl font-bold tracking-tight text-brand-green-700 block leading-tight">
                    Nyaningwe
                  </span>
                  <span className="text-xs font-semibold tracking-widest text-brand-orange-600 block uppercase leading-none">
                    Cash & Carry
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation Links (Desktop) */}
            <nav className="hidden md:flex space-x-8 text-sm font-semibold text-slate-600">
              <Link href="/" className="hover:text-brand-green-600 transition-colors">
                Shop Products
              </Link>
              <Link href="/admin/dashboard" className="hover:text-brand-green-600 transition-colors flex items-center gap-1">
                <User size={16} /> Admin Portal
              </Link>
            </nav>

            {/* Icons & Actions */}
            <div className="flex items-center gap-4">
              {/* Cart Button */}
              <Link
                href="/cart"
                className="relative p-2.5 rounded-full text-slate-600 hover:text-brand-green-700 hover:bg-brand-green-50 transition-all flex items-center gap-2 group"
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="h-6 w-6 transition-transform group-hover:scale-105" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-orange-500 text-white text-xxs font-bold h-5 w-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
                    {cartCount}
                  </span>
                )}
                {cartCount > 0 && (
                  <span className="hidden lg:inline text-sm font-bold text-brand-green-700">
                    ${cartTotal.toFixed(2)}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3 shadow-inner">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-green-600"
            >
              Shop Products
            </Link>
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-green-600"
            >
              Admin Portal
            </Link>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Branding Info */}
            <div className="space-y-4">
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
                  <h3 className="text-md font-bold text-white leading-tight">Nyaningwe</h3>
                  <p className="text-xs font-semibold text-brand-orange-500 uppercase tracking-wider">More for Less</p>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                Your trusted neighborhood supermarket in Masvingo, bringing you fresh products and bulk groceries since inception.
              </p>
            </div>

            {/* Hours & Location */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Location & Hours</h3>
              <p className="text-sm text-slate-400 mb-2">
                🏠 41 Ed Mnangagwa St, Masvingo
              </p>
              <p className="text-sm text-slate-400">
                ⏰ Monday - Saturday: 7:30 AM - 6:30 PM<br />
                ⏰ Sunday: 8:00 AM - 1:00 PM
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">E-Commerce Access</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">Browse Storefront</Link>
                </li>
                <li>
                  <Link href="/admin/dashboard" className="hover:text-white transition-colors">Admin Dashboard</Link>
                </li>
                <li>
                  <Link href="/admin/login" className="hover:text-white transition-colors">Admin Login</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Nyaningwe Cash & Carry. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
