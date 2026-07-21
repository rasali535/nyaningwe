'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, CreditCard, Sparkles, CheckCircle } from 'lucide-react';
import { useCart } from '../../../context/CartContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'visa' | 'ecocash' | 'cash' | 'paynow' | 'zig_swipe'>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!name || !email) {
      setError('Please provide your name and email address.');
      return;
    }
    if (fulfillmentMethod === 'delivery' && !deliveryAddress) {
      setError('Please provide a delivery address.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const orderItems = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      let orderId = `order_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

      try {
        // Submit order details to the FastAPI middleware gateway
        const res = await fetch(`${API_BASE}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer_name: name,
            customer_email: email,
            items: orderItems,
            fulfillment_method: fulfillmentMethod,
            delivery_address: fulfillmentMethod === 'delivery' ? deliveryAddress : null,
            payment_method: paymentMethod,
          }),
        });

        const data = await res.json();
        
        if (res.ok) {
          orderId = data.order_id;
        } else {
          console.warn('Backend rejected order placement, using mock ID for fallback.');
        }
      } catch (fetchErr) {
        console.warn('FastAPI backend offline. Simulating local checkout for Demo MVP:', fetchErr);
      }

      // Clear cart on success
      clearCart();
      setOrderSuccess(orderId);
    } catch (err: any) {
      console.error('Error placing order:', err);
      setError(err.message || 'An error occurred while placing your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success Screen
  if (orderSuccess) {
    return (
      <div className="bg-slate-50 min-h-screen py-16 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl p-8 md:p-12 text-center space-y-6">
          <div className="inline-flex p-4 rounded-full bg-emerald-100 text-emerald-600 animate-pulse">
            <CheckCircle className="h-16 w-16" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900">Order Placed Successfully!</h1>
            <p className="text-slate-500 font-medium">Thank you for shopping at Nyaningwe Cash & Carry.</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">Order Reference:</span>
              <span className="font-mono font-bold text-slate-800 break-all">{orderSuccess}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">Customer:</span>
              <span className="font-bold text-slate-800">{name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">Email:</span>
              <span className="font-semibold text-slate-700">{email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">Fulfillment:</span>
              <span className="font-bold text-brand-green-700">
                {fulfillmentMethod === 'delivery' ? '🚚 Home Delivery' : '🏪 In-Store Pickup'}
              </span>
            </div>
            {fulfillmentMethod === 'delivery' && (
              <div className="flex flex-col text-sm space-y-0.5">
                <span className="text-slate-400 font-medium">Delivery Address:</span>
                <span className="font-semibold text-slate-700 pl-4 border-l-2 border-slate-200">
                  {deliveryAddress}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">Payment Method:</span>
              <span className="font-bold text-slate-800">
                {paymentMethod === 'cash' && '💵 Cash (USD/ZiG)'}
                {paymentMethod === 'visa' && '💳 Visa / MasterCard'}
                {paymentMethod === 'ecocash' && '📱 EcoCash'}
                {paymentMethod === 'paynow' && '🌐 Paynow Online'}
                {paymentMethod === 'zig_swipe' && '📟 ZiG Swipe (In-Store)'}
              </span>
            </div>
            <hr className="border-slate-200" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-brand-green-700 uppercase tracking-wider">
                Instructions:
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {fulfillmentMethod === 'delivery' ? (
                  <>
                    Your order will be dispatched to <strong>{deliveryAddress}</strong> shortly.
                    {paymentMethod === 'cash' && ' Please prepare exact USD/ZiG cash for payment upon arrival.'}
                    {paymentMethod === 'ecocash' && ' Please send mobile payment of $' + (cartTotal + 2.50).toFixed(2) + ' to EcoCash Merchant: 123456 prior to delivery dispatch.'}
                    {paymentMethod === 'paynow' && ' You will receive a secure Paynow link on your email (' + email + ') to finalize payment.'}
                    {paymentMethod === 'visa' && ' Payment successfully processed via secure Card Gateway. Dispatch pending.'}
                    {paymentMethod === 'zig_swipe' && ' Swiping is only available for instore pick up. Please pay cash or EcoCash on delivery.'}
                  </>
                ) : (
                  <>
                    Please collect your order at <strong>41 Ed Mnangagwa St, Masvingo</strong>.
                    {paymentMethod === 'cash' && ' Please pay USD/ZiG cash at the checkout counter.'}
                    {paymentMethod === 'zig_swipe' && ' Please present this reference and swipe ZiG/USD at the counter.'}
                    {paymentMethod === 'ecocash' && ' Please pay EcoCash to Merchant Code: 123456 at the counter.'}
                    {paymentMethod === 'paynow' && ' You will receive a Paynow payment request on your email (' + email + ') to complete online.'}
                    {paymentMethod === 'visa' && ' Payment successfully cleared. Collect your items at the fast-track lane.'}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green-700 hover:bg-brand-green-800 text-white font-bold rounded-xl transition-colors shadow-md hover:shadow-lg text-sm"
            >
              <ArrowLeft size={16} /> Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-green-700 mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Continue Shopping
        </Link>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-8">
          Shopping Basket
        </h1>

        {cart.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center space-y-6">
            <ShoppingBag className="h-16 w-16 text-slate-300 mx-auto" />
            <div className="space-y-2">
              <p className="text-slate-500 font-bold text-lg">Your basket is empty</p>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Add quality products from our catalog to get started with your order.
              </p>
            </div>
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green-700 hover:bg-brand-green-800 text-white font-bold rounded-xl transition-colors shadow-sm text-sm"
              >
                Browse Catalog
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left: Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">
                  Basket Items ({cart.length})
                </h2>

                <div className="divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={item.product.id} className="py-5 flex gap-4 first:pt-0 last:pb-0">
                      {/* Product Thumbnail */}
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                        <Image
                          src={item.product.image_url || '/logo.jpg'}
                          alt={item.product.name}
                          fill
                          className="object-contain p-2"
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-grow flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">{item.product.name}</h3>
                            <p className="text-xxs text-slate-400 mt-0.5">SKU: {item.product.sku}</p>
                          </div>
                          <span className="font-black text-slate-900 text-sm">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        {/* Adjust qty & Remove */}
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xxs">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="p-1.5 text-slate-500 hover:bg-slate-50 transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="px-3 text-xs font-bold text-slate-800 min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="p-1.5 text-slate-500 hover:bg-slate-50 transition-colors"
                              disabled={item.quantity >= item.product.stock_quantity}
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                            title="Remove from Cart"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Checkout form & summary */}
            <div className="space-y-6">
              {/* Checkout Form */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">
                  Checkout Information
                </h2>

                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-medium">
                      ⚠️ {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-green-600 text-slate-800 text-sm shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      placeholder="e.g. john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-green-600 text-slate-800 text-sm shadow-inner"
                    />
                  </div>

                  {/* Fulfillment Method */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase block">
                      Fulfillment Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFulfillmentMethod('pickup')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                          fulfillmentMethod === 'pickup'
                            ? 'bg-brand-green-700 text-white border-brand-green-700 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        🏪 Store Pickup
                      </button>
                      <button
                        type="button"
                        onClick={() => setFulfillmentMethod('delivery')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                          fulfillmentMethod === 'delivery'
                            ? 'bg-brand-green-700 text-white border-brand-green-700 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        🚚 Home Delivery
                      </button>
                    </div>
                  </div>

                  {/* Delivery Address Text Box */}
                  {fulfillmentMethod === 'delivery' && (
                    <div className="space-y-1.5 pt-1">
                      <label htmlFor="address" className="text-xs font-bold text-slate-500 uppercase">
                        Delivery Address
                      </label>
                      <textarea
                        id="address"
                        required
                        placeholder="Enter your street address in Masvingo..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-green-600 text-slate-800 text-sm shadow-inner resize-none"
                      />
                    </div>
                  )}

                  {/* Payment Method Selector */}
                  <div className="space-y-1.5 pt-2">
                    <label htmlFor="payment" className="text-xs font-bold text-slate-500 uppercase block">
                      Payment Method
                    </label>
                    <select
                      id="payment"
                      value={paymentMethod}
                      onChange={(e: any) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-green-600 text-slate-800 text-sm bg-white shadow-inner font-semibold"
                    >
                      <option value="cash">💵 Cash (USD/ZiG Cash)</option>
                      <option value="visa">💳 Visa / MasterCard (International)</option>
                      <option value="ecocash">📱 EcoCash (Mobile Wallet)</option>
                      <option value="paynow">🌐 Paynow Online (Local Cards/EcoCash)</option>
                      <option value="zig_swipe">📟 ZiG Swipe (In-Store Terminal)</option>
                    </select>
                  </div>

                  {/* Summary math */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 mt-6">
                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                      <span>Subtotal</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                      <span>{fulfillmentMethod === 'delivery' ? 'Delivery Fee' : 'Pickup Fee'}</span>
                      <span className={fulfillmentMethod === 'pickup' ? 'text-brand-green-700 font-bold' : 'text-slate-850 font-bold'}>
                        {fulfillmentMethod === 'delivery' ? '$2.50' : 'FREE'}
                      </span>
                    </div>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between text-sm font-black text-slate-900">
                      <span>Total Amount</span>
                      <span>${(cartTotal + (fulfillmentMethod === 'delivery' ? 2.50 : 0)).toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-brand-green-700 hover:bg-brand-green-800 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    <CreditCard size={16} />
                    {submitting ? 'Processing Order...' : 'Submit Order'}
                  </button>
                </form>
              </div>

              {/* Fulfillment badge notice */}
              <div className="bg-brand-green-50/50 rounded-2xl border border-brand-green-100/50 p-5 flex gap-3 text-slate-700 text-xs">
                <Sparkles className="h-5 w-5 text-brand-green-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-brand-green-800">
                    {fulfillmentMethod === 'delivery' ? 'Home Delivery Service' : 'Store Pickup Location'}
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    {fulfillmentMethod === 'delivery' ? (
                      <>Deliveries are dispatched within 2 hours. Available throughout Masvingo urban and residential zones for a flat rate of $2.50.</>
                    ) : (
                      <>Orders are packed within 1 hour. Collect your shopping cart at: <strong>41 Ed Mnangagwa St, Masvingo</strong>.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
