import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@/redux/slices/cartSlice';
import { selectIsLoggedIn } from '@/redux/slices/authSlice';
import { productService, reviewService } from '@/api/services';
import { formatCurrency, formatRelative, getInitials } from '@/utils/formatters';
import { StarRating, ImageWithFallback } from '@/components/common';
import Spinner from '@/components/common/Spinner';
import PageLayout from '@/components/layout/PageLayout';
import toast from 'react-hot-toast';

function ReviewForm({ productId, onSubmitted }) {
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!rating) { toast.error('Select a rating'); return; }
    setLoading(true);
    try {
      await reviewService.add({ productId, rating, comment });
      toast.success('Review submitted!');
      setRating(0); setComment('');
      onSubmitted?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setLoading(false); }
  };

  return (
    <div className="card p-4 mt-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Write a review</h3>
      <StarRating rating={rating} interactive onRate={setRating} size="lg" />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience…"
        rows={3}
        className="input-field mt-3 text-sm resize-none"
      />
      <button onClick={submit} disabled={loading || !rating} className="btn-primary mt-3 text-sm px-4 py-2 disabled:opacity-50">
        {loading ? <Spinner size="sm" /> : 'Submit review'}
      </button>
    </div>
  );
}

export default function ProductDetail() {
  const { id }      = useParams();
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const isLoggedIn  = useSelector(selectIsLoggedIn);

  const [product,  setProduct]  = useState(null);
  const [reviews,  setReviews]  = useState([]);
  const [quantity, setQty]      = useState(1);
  const [adding,   setAdding]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [imgIdx,   setImgIdx]   = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pr, rr] = await Promise.all([
        productService.getById(id),
        reviewService.getByProduct(id),
      ]);
      setProduct(pr.data.data);
      setReviews(rr.data.data || []);
    } catch { toast.error('Product not found'); navigate(-1); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAddToCart = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setAdding(true);
    try {
      await dispatch(addToCart({ productId: id, quantity })).unwrap();
      toast.success(`${product.name} added to cart`);
    } catch (err) { toast.error(err || 'Failed'); }
    finally { setAdding(false); }
  };

  if (loading) return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="skeleton h-72 rounded-2xl mb-5" />
        <div className="skeleton h-6 w-2/3 mb-3" />
        <div className="skeleton h-4 w-1/2" />
      </div>
    </PageLayout>
  );

  if (!product) return null;

  const images = product.images?.length ? product.images : [product.image].filter(Boolean);

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 py-5">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Image gallery */}
          <div>
            <div className="rounded-2xl overflow-hidden bg-gray-100 h-72 sm:h-96">
              <ImageWithFallback src={images[imgIdx]} alt={product.name}
                className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${i === imgIdx ? 'border-brand-500' : 'border-transparent'}`}>
                    <ImageWithFallback src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="mt-5 lg:mt-0">
            {/* Veg indicator */}
            {product.isVeg !== undefined && (
              <div className={`inline-flex items-center gap-1 text-xs font-medium mb-2 px-2 py-1 rounded ${product.isVeg ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                <span className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center ${product.isVeg ? 'border-green-600' : 'border-red-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${product.isVeg ? 'bg-green-600' : 'bg-red-500'}`} />
                </span>
                {product.isVeg ? 'Vegetarian' : 'Non-veg'}
              </div>
            )}

            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-500 mt-1">by <span className="text-brand-500 font-medium">{product.vendorName}</span></p>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2">
              <StarRating rating={Math.round(product.avgRating || 0)} />
              <span className="text-sm text-gray-600">{product.avgRating?.toFixed(1) || '—'} ({reviews.length} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
              {product.originalPrice > product.price && (
                <span className="text-lg text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>
              )}
              {product.discount > 0 && (
                <span className="bg-green-100 text-green-700 text-sm font-semibold px-2 py-0.5 rounded-full">{product.discount}% off</span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed mt-3">{product.description}</p>
            )}

            {/* Quantity + Add */}
            {product.inStock !== false ? (
              <div className="flex items-center gap-3 mt-5">
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-2">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-6 h-6 rounded-full border border-brand-400 text-brand-500 font-bold flex items-center justify-center hover:bg-brand-50">−</button>
                  <span className="text-sm font-bold w-4 text-center">{quantity}</span>
                  <button onClick={() => setQty((q) => Math.min(20, q + 1))}
                    className="w-6 h-6 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center hover:bg-brand-600">+</button>
                </div>
                <button onClick={handleAddToCart} disabled={adding} className="btn-primary flex-1">
                  {adding ? <Spinner size="sm" /> : `Add to cart · ${formatCurrency(product.price * quantity)}`}
                </button>
              </div>
            ) : (
              <div className="mt-5 bg-red-50 text-red-600 text-sm font-medium text-center py-3 rounded-xl">
                Currently out of stock
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-8">
          <h2 className="text-base font-bold text-gray-900 mb-4">Customer reviews ({reviews.length})</h2>
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r._id} className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {getInitials(r.userName || 'U')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{r.userName || 'Customer'}</p>
                      <StarRating rating={r.rating} />
                    </div>
                    <span className="ml-auto text-xs text-gray-400">{formatRelative(r.createdAt)}</span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No reviews yet. Be the first!</p>
          )}

          {isLoggedIn && <ReviewForm productId={id} onSubmitted={fetchData} />}
        </div>
      </div>
    </PageLayout>
  );
}
