import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@/redux/slices/cartSlice';
import { bannerService, categoryService, vendorService, productService } from '@/api/services';
import { selectLocation } from '@/redux/slices/locationSlice';
import { formatCurrency } from '@/utils/formatters';
import { SkeletonCard, ImageWithFallback } from '@/components/common';
import PageLayout from '@/components/layout/PageLayout';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import toast from 'react-hot-toast';

// ── Banner Slider ─────────────────────────────────────────────────────────────
function BannerSlider({ banners }) {
  if (!banners.length) return null;
  return (
    <Swiper modules={[Autoplay, Pagination]} autoplay={{ delay: 4000, disableOnInteraction: false }}
      pagination={{ clickable: true }} loop className="rounded-2xl overflow-hidden">
      {banners.map((b) => (
        <SwiperSlide key={b._id}>
          <a href={b.link || '#'}>
            <ImageWithFallback src={b.image} alt={b.title}
              className="w-full h-40 sm:h-56 object-cover" />
          </a>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

// ── Category Row ──────────────────────────────────────────────────────────────
function CategoryRow({ categories }) {
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
      {categories.map((cat) => (
        <Link key={cat._id} to={`/category/${cat._id}`}
          className="flex-shrink-0 flex flex-col items-center gap-2 group">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-brand-400 transition-all bg-brand-50">
            <ImageWithFallback src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
          </div>
          <span className="text-xs font-medium text-gray-700 text-center w-16 truncate">{cat.name}</span>
        </Link>
      ))}
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product }) {
  const dispatch = useDispatch();
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await dispatch(addToCart({ productId: product._id, quantity: 1 })).unwrap();
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      toast.error(err || 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link to={`/product/${product._id}`}
      className="card group hover:shadow-float transition-shadow">
      <div className="relative overflow-hidden rounded-t-2xl">
        <ImageWithFallback src={product.image} alt={product.name}
          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
        {product.isVeg !== undefined && (
          <span className={`absolute top-2 left-2 w-4 h-4 rounded-sm border-2 flex items-center justify-center
            ${product.isVeg ? 'border-green-600 bg-white' : 'border-red-600 bg-white'}`}>
            <span className={`w-2 h-2 rounded-full ${product.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
          </span>
        )}
        {product.discount > 0 && (
          <span className="absolute top-2 right-2 bg-brand-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {product.discount}% off
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{product.name}</h3>
        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.description}</p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="font-bold text-gray-900 text-sm">{formatCurrency(product.price)}</span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-gray-400 line-through ml-1">{formatCurrency(product.originalPrice)}</span>
            )}
          </div>
          <button onClick={handleAdd} disabled={adding}
            className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-60">
            {adding ? <span className="text-xs">…</span> : <span className="text-lg leading-none">+</span>}
          </button>
        </div>
      </div>
    </Link>
  );
}

// ── Vendor Card ───────────────────────────────────────────────────────────────
function VendorCard({ vendor }) {
  return (
    <Link to={`/vendor/${vendor._id}`} className="card group hover:shadow-float transition-shadow flex-shrink-0 w-56">
      <div className="relative overflow-hidden rounded-t-2xl">
        <ImageWithFallback src={vendor.coverImage} alt={vendor.storeName}
          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300" />
        {vendor.isOpen === false && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">Closed</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{vendor.storeName}</h3>
        <p className="text-xs text-gray-500 line-clamp-1">{vendor.cuisineTypes?.join(', ')}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="flex items-center gap-0.5 text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
            ★ {vendor.avgRating?.toFixed(1) || '—'}
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">{vendor.deliveryTime || '30–40'} min</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">{vendor.deliveryFee === 0 ? 'Free delivery' : formatCurrency(vendor.deliveryFee)}</span>
        </div>
      </div>
    </Link>
  );
}

// ── Section Wrapper ───────────────────────────────────────────────────────────
function Section({ title, viewAllTo, children }) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {viewAllTo && <Link to={viewAllTo} className="text-sm text-brand-500 font-medium hover:text-brand-600">See all →</Link>}
      </div>
      {children}
    </section>
  );
}

// ── Home Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const location = useSelector(selectLocation);
  const [banners,      setBanners]     = useState([]);
  const [categories,   setCategories]  = useState([]);
  const [featured,     setFeatured]    = useState([]);
  const [vendors,      setVendors]     = useState([]);
  const [popular,      setPopular]     = useState([]);
  const [loading,      setLoading]     = useState(true);

  const fetchHomeData = useCallback(async () => {
    try {
      const [b, c, f, v, p] = await Promise.allSettled([
        bannerService.getActive(),
        categoryService.getAll(),
        productService.getFeatured(),
        vendorService.getNearby(location.coords.lat, location.coords.lng),
        productService.getAll({ sort: '-totalSold', limit: 8 }),
      ]);
      if (b.status === 'fulfilled') setBanners(b.value.data.data);
      if (c.status === 'fulfilled') setCategories(c.value.data.data);
      if (f.status === 'fulfilled') setFeatured(f.value.data.data);
      if (v.status === 'fulfilled') setVendors(v.value.data.data);
      if (p.status === 'fulfilled') setPopular(p.value.data.data?.products || []);
    } catch {}
    finally { setLoading(false); }
  }, [location.coords]);

  useEffect(() => { fetchHomeData(); }, [fetchHomeData]);

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-5">
        {/* Banner */}
        {loading
          ? <div className="skeleton h-40 sm:h-56 w-full rounded-2xl" />
          : <BannerSlider banners={banners} />
        }

        {/* Categories */}
        <Section title="What's on your mind?">
          {loading
            ? <div className="flex gap-3">{Array(7).fill(0).map((_, i) => <div key={i} className="skeleton w-16 h-20 rounded-2xl flex-shrink-0" />)}</div>
            : <CategoryRow categories={categories} />
          }
        </Section>

        {/* Featured products */}
        <Section title="🍬 Featured sweets & snacks" viewAllTo="/search?type=featured">
          {loading
            ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
            : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {featured.slice(0, 8).map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
            )
          }
        </Section>

        {/* Nearby vendors */}
        <Section title="🏪 Restaurants near you" viewAllTo="/search?type=vendors">
          {loading
            ? <div className="flex gap-3 overflow-hidden">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton w-56 h-52 rounded-2xl flex-shrink-0" />)}</div>
            : (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                {vendors.map((v) => <VendorCard key={v._id} vendor={v} />)}
              </div>
            )
          }
        </Section>

        {/* Popular products */}
        <Section title="🔥 Popular right now" viewAllTo="/search?sort=popular">
          {loading
            ? <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
            : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {popular.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
            )
          }
        </Section>
      </div>
    </PageLayout>
  );
}
