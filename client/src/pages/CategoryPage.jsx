import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/redux/slices/cartSlice';
import { categoryService, productService, vendorService } from '@/api/services';
import { formatCurrency } from '@/utils/formatters';
import { SkeletonCard, ImageWithFallback, EmptyState } from '@/components/common';
import PageLayout from '@/components/layout/PageLayout';
import toast from 'react-hot-toast';

// ── Shared ProductGrid ────────────────────────────────────────────────────────
function ProductGrid({ products, loading }) {
  const dispatch = useDispatch();
  const [addingId, setAddingId] = useState(null);

  const handleAdd = async (e, productId, name) => {
    e.preventDefault();
    setAddingId(productId);
    try {
      await dispatch(addToCart({ productId, quantity: 1 })).unwrap();
      toast.success(`${name} added`);
    } catch (err) { toast.error(err || 'Failed'); }
    finally { setAddingId(null); }
  };

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );

  if (!products.length) return <EmptyState icon="🍽️" title="No items here yet" />;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {products.map((p) => (
        <Link key={p._id} to={`/product/${p._id}`} className="card group hover:shadow-float transition-shadow">
          <div className="relative overflow-hidden rounded-t-2xl">
            <ImageWithFallback src={p.image} alt={p.name}
              className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
            {p.discount > 0 && (
              <span className="absolute top-2 right-2 bg-brand-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {p.discount}% off
              </span>
            )}
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{p.name}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="font-bold text-gray-900 text-sm">{formatCurrency(p.price)}</span>
              <button onClick={(e) => handleAdd(e, p._id, p.name)} disabled={addingId === p._id}
                className="w-7 h-7 rounded-full bg-brand-500 text-white text-lg flex items-center justify-center hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-50">
                {addingId === p._id ? '…' : '+'}
              </button>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── Category Page ─────────────────────────────────────────────────────────────
export function CategoryPage() {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cr, pr] = await Promise.all([
          categoryService.getById(id),
          productService.getByCategory(id),
        ]);
        setCategory(cr.data.data);
        setProducts(pr.data.data?.products || pr.data.data || []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [id]);

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-5">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 bg-brand-50">
          {category?.banner && (
            <ImageWithFallback src={category.banner} alt={category.name}
              className="w-full h-32 sm:h-44 object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
            <div>
              <h1 className="text-xl font-bold text-white">{category?.name || '…'}</h1>
              <p className="text-sm text-white/80">{products.length} items</p>
            </div>
          </div>
        </div>
        <ProductGrid products={products} loading={loading} />
      </div>
    </PageLayout>
  );
}

export default CategoryPage;

// ── Vendor Page ───────────────────────────────────────────────────────────────
export function VendorPage() {
  const { id } = useParams();
  const [vendor,   setVendor]   = useState(null);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [vr, pr] = await Promise.all([
          vendorService.getById(id),
          productService.getByVendor(id),
        ]);
        setVendor(vr.data.data);
        const prods = pr.data.data?.products || pr.data.data || [];
        setProducts(prods);
        const cats = [...new Set(prods.map((p) => p.categoryName).filter(Boolean))];
        setCategories(['All', ...cats]);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [id]);

  const filtered = activeTab === 'All' ? products : products.filter((p) => p.categoryName === activeTab);

  return (
    <PageLayout>
      {/* Cover */}
      <div className="relative h-48 sm:h-64 bg-gray-200">
        {vendor?.coverImage && (
          <ImageWithFallback src={vendor.coverImage} alt={vendor.storeName}
            className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-10">
        {/* Info card */}
        <div className="card p-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-2xl border-2 border-white shadow-card overflow-hidden flex-shrink-0 bg-white">
              <ImageWithFallback src={vendor?.logo} alt={vendor?.storeName}
                className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">{vendor?.storeName || '…'}</h1>
              <p className="text-sm text-gray-500">{vendor?.cuisineTypes?.join(', ')}</p>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                  ★ {vendor?.avgRating?.toFixed(1) || '—'} · {vendor?.totalReviews || 0} reviews
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                  🕒 {vendor?.deliveryTime || '30-40'} min
                </span>
                <span className={`text-xs px-2 py-1 rounded-lg font-medium ${vendor?.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {vendor?.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category tabs */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4">
            {categories.map((c) => (
              <button key={c} onClick={() => setActiveTab(c)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === c ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'}`}>
                {c}
              </button>
            ))}
          </div>
        )}

        <ProductGrid products={filtered} loading={loading} />
        <div className="h-6" />
      </div>
    </PageLayout>
  );
}
