'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, ShoppingCart, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { useCart, Product } from '../../context/CartContext';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const MOCK_CATEGORIES: Category[] = [
  { _id: 'cat_pantry', name: 'Pantry & Groceries', slug: 'pantry-groceries' },
  { _id: 'cat_bakery', name: 'Bakery', slug: 'bakery' },
  { _id: 'cat_dairy', name: 'Dairy & Eggs', slug: 'dairy-eggs' },
  { _id: 'cat_beverages', name: 'Beverages', slug: 'beverages' },
  { _id: 'cat_fresh', name: 'Fresh Produce', slug: 'fresh-produce' },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_maize_meal',
    sku: '6001108001012',
    name: 'Red Seal Roller Meal 10kg',
    price: 6.99,
    stock_quantity: 120,
    category_id: 'cat_pantry',
    is_active: true,
    description: 'High quality refined white roller meal, staple for every meal.',
    image_url: '/logo.jpg'
  },
  {
    id: 'prod_cooking_oil',
    sku: '6001108002026',
    name: 'Zimgold Cooking Oil 2L',
    price: 3.49,
    stock_quantity: 85,
    category_id: 'cat_pantry',
    is_active: true,
    description: 'Pure double refined vegetable cooking oil for healthy cooking.',
    image_url: '/logo.jpg'
  },
  {
    id: 'prod_sugar',
    sku: '6001108003030',
    name: 'Gold Star White Sugar 2kg',
    price: 2.80,
    stock_quantity: 150,
    category_id: 'cat_pantry',
    is_active: true,
    description: 'Premium Zimbabwean fine grain white sugar.',
    image_url: '/logo.jpg'
  },
  {
    id: 'prod_bread',
    sku: '6001108004044',
    name: 'Lobels Prime White Bread',
    price: 1.10,
    stock_quantity: 40,
    category_id: 'cat_bakery',
    is_active: true,
    description: 'Freshly baked white sandwich bread, soft and nutritious.',
    image_url: '/logo.jpg'
  },
  {
    id: 'prod_milk',
    sku: '6001108005058',
    name: 'Dairibord Super Milk 1L',
    price: 1.45,
    stock_quantity: 60,
    category_id: 'cat_dairy',
    is_active: true,
    description: 'Long-life full cream milk, rich in calcium and vitamins.',
    image_url: '/logo.jpg'
  },
  {
    id: 'prod_tea',
    sku: '6001108006062',
    name: 'Tanganda Tea Bags 100s',
    price: 1.85,
    stock_quantity: 95,
    category_id: 'cat_beverages',
    is_active: true,
    description: 'Strength and flavor in every cup, natural black tea bags.',
    image_url: '/logo.jpg'
  },
  {
    id: 'prod_washing_powder',
    sku: '6001108007076',
    name: 'MAQ Washing Powder 2kg',
    price: 4.25,
    stock_quantity: 35,
    category_id: 'cat_pantry',
    is_active: true,
    description: 'Super concentrated active ingredients for clean and bright clothes.',
    image_url: '/logo.jpg'
  },
  {
    id: 'prod_rice',
    sku: '6001108008080',
    name: 'Gloria White Rice 2kg',
    price: 2.10,
    stock_quantity: 110,
    category_id: 'cat_pantry',
    is_active: true,
    description: 'Long grain parboiled white rice, perfect fluffy texture.',
    image_url: '/logo.jpg'
  }
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function StorefrontPage() {
  const { addToCart, cart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('all');

  // Load data from FastAPI middleware
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch categories from FastAPI
      const catRes = await fetch(`${API_BASE}/api/categories`);
      if (!catRes.ok) throw new Error('Failed to load categories from backend.');
      const cats = await catRes.json();
      setCategories(cats || []);

      // 2. Fetch active products from FastAPI
      const prodRes = await fetch(`${API_BASE}/api/products`);
      if (!prodRes.ok) throw new Error('Failed to load products from backend.');
      const prods = await prodRes.json();
      
      // Map MongoDB _id to id for storefront cart context compatibility
      const mappedProds = prods.map((p: any) => ({
        ...p,
        id: p._id
      }));
      setProducts(mappedProds || []);
      setIsDemoMode(false);
    } catch (e: any) {
      console.warn('Error fetching data from FastAPI, falling back to mock:', e);
      setCategories(MOCK_CATEGORIES);
      setProducts(MOCK_PRODUCTS);
      setIsDemoMode(true);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Developer Seed Helper
  const handleSeedData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/dev/seed-data`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to run database seeder.');
      await loadData();
    } catch (err: any) {
      alert(`Seeding failed. Ensure the FastAPI middleware is running on localhost:8000: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search query and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      product.sku.includes(searchQuery);

    const matchesCategory = selectedCategorySlug === 'all' || (() => {
      const cat = categories.find(c => c.slug === selectedCategorySlug);
      return cat ? product.category_id === cat._id : false;
    })();

    return matchesSearch && matchesCategory;
  });

  const getProductQuantityInCart = (productId: string) => {
    return cart.find((item) => item.product.id === productId)?.quantity || 0;
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {isDemoMode && (
        <div className="bg-amber-500 text-slate-900 text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2">
          <span>⚠️ Running in Demo/MVP Mode (Backend offline. Using mock catalog data).</span>
          <button 
            onClick={() => {
              setIsDemoMode(false);
              loadData();
            }} 
            className="underline hover:text-black font-extrabold flex items-center gap-1"
          >
            <RefreshCw size={12} className="inline animate-spin" style={{ animationDuration: '3s' }} /> Retry Connecting
          </button>
        </div>
      )}
      {/* Hero section */}
      <section className="bg-gradient-to-br from-brand-green-700 via-brand-green-800 to-emerald-950 text-white py-16 px-4 relative overflow-hidden shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-wide uppercase">
            <Sparkles size={14} /> Freshness Guaranteed
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Nyaningwe Cash & Carry
          </h1>
          <p className="text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto font-medium">
            Masvingo's choice for quality food and bulk pantry items at the best rates. Save more on every basket!
          </p>
        </div>
      </section>

      {/* Main Browse Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Search and Quick Tools */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* Search bar */}
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search product names, description, or barcode (SKU)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent transition-all shadow-sm text-sm"
            />
          </div>

          {/* Dev Seed / Reload Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
              title="Refresh Products"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {products.length === 0 && !loading && (
              <button
                onClick={handleSeedData}
                className="px-4 py-2.5 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
              >
                🌱 Seed MongoDB Collections
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <button
              onClick={() => setSelectedCategorySlug('all')}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 shadow-sm ${
                selectedCategorySlug === 'all'
                  ? 'bg-brand-green-700 text-white scale-102 font-bold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategorySlug(cat.slug)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 shadow-sm ${
                  selectedCategorySlug === cat.slug
                    ? 'bg-brand-green-700 text-white scale-102 font-bold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Status display (Loading / Error / Empty) */}
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="h-10 w-10 animate-spin text-brand-green-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Loading catalog, please wait...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto my-12 bg-rose-50 border border-rose-200 rounded-xl p-6 text-center space-y-4 shadow-sm">
            <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
            <h3 className="text-md font-bold text-rose-800">Backend Server Error</h3>
            <p className="text-sm text-rose-700 leading-relaxed">
              We couldn't connect to the POS Sync Middleware. Make sure your FastAPI server is running on <code className="bg-rose-100 px-1.5 py-0.5 rounded text-xs">localhost:8000</code>.
            </p>
            <div className="pt-2">
              <button
                onClick={loadData}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors"
              >
                Try Reconnecting
              </button>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 mb-2 font-medium text-lg">No products found</p>
            <p className="text-slate-400 text-sm">
              {searchQuery ? 'Try adjusting your search criteria.' : 'No active items in the store yet.'}
            </p>
            {products.length === 0 && (
              <button
                onClick={handleSeedData}
                className="mt-6 px-5 py-2.5 bg-brand-green-700 hover:bg-brand-green-800 text-white font-bold rounded-xl text-sm transition-all shadow-md inline-flex items-center gap-1.5"
              >
                🌱 Seed Mock Store Database
              </button>
            )}
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const cartQty = getProductQuantityInCart(product.id);
              const isOutOfStock = product.stock_quantity <= 0;
              const isAtMaxStock = cartQty >= product.stock_quantity;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group relative"
                >
                  {/* Out of stock overlay badge */}
                  {isOutOfStock && (
                    <div className="absolute top-3 left-3 z-10 bg-slate-900/80 backdrop-blur-xs text-white text-xxs font-black px-2.5 py-1 rounded-md tracking-wider uppercase">
                      Out of Stock
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="relative pt-[100%] bg-slate-50 w-full overflow-hidden border-b border-slate-100">
                    <Image
                      src={product.image_url || '/logo.jpg'}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className={`object-contain p-4 transition-transform duration-500 group-hover:scale-105 ${
                        isOutOfStock ? 'opacity-50 grayscale' : ''
                      }`}
                    />
                  </div>

                  {/* Product Body */}
                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                      <div className="text-xxs text-slate-400 font-bold uppercase tracking-wider mb-1">
                        SKU: {product.sku}
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm group-hover:text-brand-green-700 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">
                        {product.description || 'Fresh item synced from store inventories.'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* Price & Stock info */}
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-xs text-slate-400 font-semibold leading-none">Price</div>
                          <div className="text-lg font-black text-slate-900 mt-1">
                            ${product.price.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400 font-semibold leading-none">Inventory</div>
                          <div
                            className={`text-xs font-bold mt-1 ${
                              isOutOfStock
                                ? 'text-rose-500'
                                : product.stock_quantity < 10
                                ? 'text-amber-500'
                                : 'text-slate-500'
                            }`}
                          >
                            {isOutOfStock ? 'Sold Out' : `${product.stock_quantity} left`}
                          </div>
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => addToCart(product)}
                        disabled={isOutOfStock || isAtMaxStock}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                          isOutOfStock
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                            : isAtMaxStock
                            ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 shadow-none'
                            : 'bg-brand-green-700 hover:bg-brand-green-800 text-white hover:shadow-md'
                        }`}
                      >
                        <ShoppingCart size={15} />
                        {isOutOfStock
                          ? 'Out of Stock'
                          : isAtMaxStock
                          ? `Limit reached (${cartQty})`
                          : cartQty > 0
                          ? `Add More (${cartQty})`
                          : 'Add to Basket'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
