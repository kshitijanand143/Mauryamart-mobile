import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/redux/slices/cartSlice';
import { productService, vendorService } from '@/api/services';
import { useDebounce } from '@/hooks';
import { formatCurrency } from '@/utils/formatters';
import { SkeletonCard, ImageWithFallback, EmptyState } from '@/components/common';
import PageLayout from '@/components/layout/PageLayout';
import toast from 'react-hot-toast';

const TABS = ['All', 'Products', 'Vendors'];
const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest' },
  { value: 'price',      label: 'Price: Low to high' },
  { value: '-price',     label: 'Price: High to low' },
  { value: '-avgRating', label: 'Top rated' },
];

function ProductResult({ product }) {
  const dispatch = useDispatch();
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await dispatch(addToCart({ productId: product._id, quantity: 1 })).unwrap();
      toast.success('Added to cart');
    } catch (err) { toast.error(err || 'Failed'); }
    finally { setAdding(false); }
  };

  return (
    <Link to={`/product/${product._id}`} className="card flex gap-3 p-3 hover:shadow-float transition-shadow">
      <ImageWithFallback src={product.image} alt={product.name}
        className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{product.name}</h3>
        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.vendorName}</p>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs font-medium text-amber-500">★ {product.avgRating?.toFixed(1) || '—'}</span>
          {product.isVeg !== undefined && (
            <span className={`w-3 h-3 rounded-sm border flex items-center justify-center ml-1 ${product.isVeg ? 'border-green-600' : 'border-red-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${product.isVeg ? 'bg-green-600' : 'bg-red-500'}`} />
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-gray-900 text-sm">{formatCurrency(product.price)}</span>
          <button onClick={handleAdd} disabled={adding}
            className="w-7 h-7 rounded-full bg-brand-500 text-white text-lg flex items-center justify-center hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-50">
            {adding ? '…' : '+'}
          </button>
        </div>
      </div>
    </Link>
  );
}

function VendorResult({ vendor }) {
  return (
    <Link to={`/vendor/${vendor._id}`} className="card flex gap-3 p-3 hover:shadow-float transition-shadow">
      <ImageWithFallback src={vendor.logo || vendor.coverImage} alt={vendor.storeName}
        className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{vendor.storeName}</h3>
        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{vendor.cuisineTypes?.join(', ')}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs font-medium text-amber-500">★ {vendor.avgRating?.toFixed(1) || '—'}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">{vendor.deliveryTime || '30-40'} min</span>
        </div>
        <span className={`text-xs font-medium mt-1 inline-block ${vendor.isOpen ? 'text-green-600' : 'text-red-500'}`}>
          {vendor.isOpen ? 'Open now' : 'Closed'}
        </span>
      </div>
    </Link>
  );
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [query,    setQuery]    = useState(initialQ);
  const [tab,      setTab]      = useState('All');
  const [sort,     setSort]     = useState('-createdAt');
  const [products, setProducts] = useState([]);
  const [vendors,  setVendors]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  const debounced = useDebounce(query, 400);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setProducts([]); setVendors([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const [pr, vr] = await Promise.allSettled([
        productService.search(q),
        vendorService.getAll({ search: q }),
      ]);
      setProducts(pr.status === 'fulfilled' ? (pr.value.data.data?.products || pr.value.data.data || []) : []);
      setVendors(vr.status === 'fulfilled'  ? (vr.value.data.data?.vendors  || vr.value.data.data || []) : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    doSearch(debounced);
    if (debounced) setSearchParams({ q: debounced });
  }, [debounced, doSearch, setSearchParams]);

  const filteredProducts = [...products].sort((a, b) => {
    if (sort === 'price')       return a.price - b.price;
    if (sort === '-price')      return b.price - a.price;
    if (sort === '-avgRating')  return (b.avgRating || 0) - (a.avgRating || 0);
    return 0;
  });

  const showProducts = tab !== 'Vendors';
  const showVendors  = tab !== 'Products';
  const total        = (showProducts ? filteredProducts.length : 0) + (showVendors ? vendors.length : 0);

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Search input */}
        <div className="relative mb-4">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for food, sweets, restaurants…"
            autoFocus
            className="w-full pl-12 pr-4 py-3.5 text-sm rounded-2xl border border-gray-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 shadow-card transition-all"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tabs + Sort */}
        {searched && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {TABS.map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-white text-brand-600 shadow-card' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t}
                </button>
              ))}
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 bg-white text-gray-600 focus:border-brand-400 focus:outline-none">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} className="h-24" />)}
          </div>
        ) : searched && total === 0 ? (
          <EmptyState icon="🔍" title="No results found"
            subtitle={`We couldn't find anything for "${query}". Try different keywords.`} />
        ) : (
          <div className="space-y-3">
            {showVendors && vendors.map((v) => <VendorResult key={v._id} vendor={v} />)}
            {showProducts && filteredProducts.map((p) => <ProductResult key={p._id} product={p} />)}
          </div>
        )}

        {!searched && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🍽️</div>
            <p className="text-sm">Start typing to search</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
