'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, CheckCircle, AlertCircle, FileSpreadsheet, Image as ImageIcon, 
  Layers, Package, RefreshCw, Save, ToggleLeft, ToggleRight, Loader 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../../context/CartContext';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<'all' | 'missing-images'>('all');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  // Edit form state
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ success: any[]; failed: any[] } | null>(null);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch categories
      const catRes = await fetch(`${API_BASE}/api/categories`);
      if (!catRes.ok) throw new Error('Failed to load categories.');
      const cats = await catRes.json();
      setCategories(cats || []);

      // 2. Fetch admin products list (includes active and inactive)
      const prodRes = await fetch(`${API_BASE}/api/admin/products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!prodRes.ok) throw new Error('Failed to load products list from admin API.');
      const prods = await prodRes.json();

      // Map _id to id for storefront cart compatibility
      const mappedProds = prods.map((p: any) => ({
        ...p,
        id: p._id
      }));
      setProducts(mappedProds || []);
    } catch (err: any) {
      console.error('Error fetching admin products:', err);
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // Reload when token is loaded
  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  // Dropzone drag-and-drop setup
  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !token) return;
    setUploading(true);
    setUploadResults(null);

    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      // Connect to FastAPI bulk upload endpoint with authorization token
      const res = await fetch(`${API_BASE}/api/admin/bulk-upload-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'API server returned an error during bulk upload.');
      }

      setUploadResults(data);
      // Reload catalog to show newly uploaded image URLs
      await loadData();
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(`Upload failed: ${err.message}. Please verify that the FastAPI backend is running on port 8000.`);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    }
  });

  // Edit Row triggers
  const startEditing = (product: Product) => {
    setEditingProductId(product.id);
    setEditDesc(product.description || '');
    setEditCategory(product.category_id || '');
    setEditIsActive(product.is_active);
    setEditImageUrl(product.image_url || '');
  };

  const cancelEditing = () => {
    setEditingProductId(null);
  };

  // Save modified columns to MongoDB via FastAPI
  const saveProduct = async (id: string) => {
    if (!token) return;
    setSavingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: editDesc,
          category_id: editCategory || null,
          is_active: editIsActive,
          image_url: editImageUrl || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update product details.');
      }

      // Update local state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, description: editDesc, category_id: editCategory || null, is_active: editIsActive, image_url: editImageUrl || null }
            : p
        )
      );
      setEditingProductId(null);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  // Filter products by tabs
  const displayedProducts = products.filter((p) => {
    if (viewMode === 'missing-images') {
      return !p.image_url;
    }
    return true;
  });

  const missingImagesCount = products.filter((p) => !p.image_url).length;

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-3 bg-brand-green-800/20 text-brand-green-600 rounded-xl">
            <Package size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase">Total Products</div>
            <div className="text-2xl font-black text-white">{products.length}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <ImageIcon size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase">Missing Images</div>
            <div className="text-2xl font-black text-white">{missingImagesCount}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-3 bg-brand-orange-500/10 text-brand-orange-500 rounded-xl">
            <Layers size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase">Categories</div>
            <div className="text-2xl font-black text-white">{categories.length}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Table, Right Bulk Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Products Table Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-md">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  All Products
                </button>
                <button
                  onClick={() => setViewMode('missing-images')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${
                    viewMode === 'missing-images'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  Missing Images
                  {missingImagesCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-brand-orange-500 text-white text-xxs px-1.5 py-0.5 rounded-full font-bold">
                      {missingImagesCount}
                    </span>
                  )}
                </button>
              </div>

              <button
                onClick={loadData}
                className="p-2 bg-slate-950 border border-slate-800 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Refresh Table"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center space-y-2">
                <Loader className="h-8 w-8 animate-spin text-brand-green-600 mx-auto" />
                <p className="text-slate-500 text-xs font-medium">Refreshing database table...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-950/30 border border-rose-900 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            ) : displayedProducts.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <Package className="h-12 w-12 text-slate-700 mx-auto mb-2" />
                <p className="text-sm font-semibold">No products found in this view</p>
              </div>
            ) : (
              /* Products List Table */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="pb-3 pr-4">Product</th>
                      <th className="pb-3 px-4">SKU / Barcode</th>
                      <th className="pb-3 px-4">Price</th>
                      <th className="pb-3 px-4">Stock</th>
                      <th className="pb-3 px-4">Category / Status</th>
                      <th className="pb-3 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {displayedProducts.map((product) => {
                      const isEditing = editingProductId === product.id;
                      
                      return (
                        <tr key={product.id} className="hover:bg-slate-950/20 group">
                          {/* Photo and Title */}
                          <td className="py-4 pr-4 max-w-[200px]">
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 shrink-0 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 p-1">
                                <Image
                                  src={product.image_url || '/logo.jpg'}
                                  alt={product.name}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                              <div className="truncate">
                                <span className="font-bold text-white block truncate">{product.name}</span>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                    placeholder="Enter description..."
                                    className="mt-1 px-2 py-1 w-full bg-slate-950 border border-slate-800 rounded text-xxs text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-green-600"
                                  />
                                ) : (
                                  <span className="text-slate-500 block truncate max-w-[150px]">
                                    {product.description || 'No description provided.'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="py-4 px-4 font-mono text-slate-400">
                            {product.sku}
                          </td>

                          {/* Price (Read-only UI) */}
                          <td className="py-4 px-4 text-slate-300 font-semibold">
                            <input
                              type="text"
                              value={`$${product.price.toFixed(2)}`}
                              disabled
                              className="w-16 bg-slate-950/30 border border-slate-800/40 rounded px-1.5 py-0.5 text-center text-slate-500 font-mono select-none"
                              title="Prices synced strictly from POS database"
                            />
                          </td>

                          {/* Stock (Read-only UI) */}
                          <td className="py-4 px-4 text-slate-300 font-semibold">
                            <input
                              type="text"
                              value={product.stock_quantity}
                              disabled
                              className="w-12 bg-slate-950/30 border border-slate-800/40 rounded px-1.5 py-0.5 text-center text-slate-500 font-mono select-none"
                              title="Inventory levels synced strictly from POS database"
                            />
                          </td>

                          {/* Category and active status */}
                          <td className="py-4 px-4 space-y-1.5">
                            {isEditing ? (
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xxs text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-green-600 block"
                              >
                                <option value="">Select Category</option>
                                {categories.map((c) => (
                                  <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xxs font-bold">
                                {categories.find((c) => c._id === product.category_id)?.name || 'Uncategorized'}
                              </span>
                            )}

                            {isEditing ? (
                              <button
                                type="button"
                                onClick={() => setEditIsActive(!editIsActive)}
                                className="flex items-center gap-1 text-slate-400 hover:text-white"
                              >
                                {editIsActive ? (
                                  <ToggleRight className="text-brand-green-600 h-5 w-5" />
                                ) : (
                                  <ToggleLeft className="text-slate-600 h-5 w-5" />
                                )}
                                <span className="text-xxs">{editIsActive ? 'Active' : 'Inactive'}</span>
                              </button>
                            ) : (
                              <span
                                className={`block text-xxs font-bold ${
                                  product.is_active ? 'text-emerald-500' : 'text-slate-600'
                                }`}
                              >
                                {product.is_active ? '● Active' : '○ Inactive'}
                              </span>
                            )}
                          </td>

                          {/* Edit / Save Actions */}
                          <td className="py-4 pl-4 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => saveProduct(product.id)}
                                  disabled={savingId === product.id}
                                  className="p-1.5 bg-brand-green-700 hover:bg-brand-green-600 text-white rounded-lg transition-colors"
                                  title="Save Changes"
                                >
                                  {savingId === product.id ? (
                                    <Loader size={14} className="animate-spin" />
                                  ) : (
                                    <Save size={14} />
                                  )}
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-2 py-1 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditing(product)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-bold opacity-80 hover:opacity-100"
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Image Upload Dropzone */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-md">
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              Bulk Image Importer
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drag and drop image files here. Filenames must match product SKUs exactly (e.g. <code>6001234567891.jpg</code>).
            </p>

            {/* Dropzone Area */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 min-h-[180px] ${
                isDragActive
                  ? 'border-brand-green-600 bg-brand-green-800/10'
                  : 'border-slate-800 hover:border-slate-700 hover:bg-slate-950/20'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className={`h-8 w-8 ${isDragActive ? 'text-brand-green-600 animate-bounce' : 'text-slate-600'}`} />
              <div className="text-xs font-semibold text-slate-300">
                {uploading ? 'Processing files...' : isDragActive ? 'Drop images here!' : 'Drag & drop image files, or click to browse'}
              </div>
              <div className="text-xxs text-slate-500">Supports JPG, PNG, WEBP, and GIF</div>
            </div>

            {/* Upload Results status panel */}
            {uploadResults && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
                <h3 className="font-bold text-white">Import Summary</h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                    <CheckCircle size={14} /> Successfully linked: {uploadResults.success.length}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                    <AlertCircle size={14} /> Failed / Skipped: {uploadResults.failed.length}
                  </div>
                </div>

                {uploadResults.failed.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-xxs text-slate-400 font-bold uppercase tracking-wider mb-1.5">Failure Details:</div>
                    <div className="max-h-24 overflow-y-auto space-y-1 divide-y divide-slate-900 scrollbar-thin scrollbar-thumb-slate-800">
                      {uploadResults.failed.map((fail, i) => (
                        <div key={i} className="py-1 text-xxs text-rose-400">
                          <strong>{fail.filename}:</strong> {fail.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
