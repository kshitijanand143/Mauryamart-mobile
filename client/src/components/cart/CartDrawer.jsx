import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  selectCartItems, selectCartTotals, selectCart,
  updateCartItem, removeFromCart, applyCoupon, removeCoupon,
} from '@/redux/slices/cartSlice';
import { selectIsCartOpen, closeCart } from '@/redux/slices/uiSlice';
import { selectIsLoggedIn } from '@/redux/slices/authSlice';
import { couponService } from '@/api/services';
import { formatCurrency } from '@/utils/formatters';
import { FREE_DELIVERY_THRESHOLD } from '@/utils/constants';
import { ImageWithFallback } from '@/components/common';
import Spinner from '@/components/common/Spinner';
import toast from 'react-hot-toast';

function CartItem({ item }) {
  const dispatch = useDispatch();
  const [busy, setBusy] = useState(false);

  const change = async (qty) => {
    if (busy) return;
    setBusy(true);
    try {
      if (qty === 0) await dispatch(removeFromCart(item.productId)).unwrap();
      else           await dispatch(updateCartItem({ productId: item.productId, quantity: qty })).unwrap();
    } catch { toast.error('Could not update cart'); }
    finally  { setBusy(false); }
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <ImageWithFallback src={item.image} alt={item.name}
        className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</p>
        <p className="text-xs text-gray-500">{formatCurrency(item.price)} each</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => change(item.quantity - 1)} disabled={busy}
          className="w-7 h-7 rounded-full border border-brand-400 text-brand-500 flex items-center justify-center hover:bg-brand-50 font-bold text-lg leading-none disabled:opacity-50">
          {item.quantity === 1 ? '🗑' : '−'}
        </button>
        {busy
          ? <Spinner size="sm" />
          : <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
        }
        <button onClick={() => change(item.quantity + 1)} disabled={busy}
          className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 font-bold text-lg leading-none disabled:opacity-50">
          +
        </button>
      </div>
    </div>
  );
}

function CouponInput({ vendorId }) {
  const dispatch = useDispatch();
  const { coupon, totals } = useSelector(selectCart);
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const { data } = await couponService.validate(code.trim(), totals.subtotal);
      dispatch(applyCoupon({ coupon: data.data.coupon, discount: data.data.discount }));
      toast.success(`Coupon applied! You save ${formatCurrency(data.data.discount)}`);
      setCode('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    } finally { setLoading(false); }
  };

  if (coupon) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 mt-3">
        <div>
          <p className="text-xs font-semibold text-green-700">{coupon.code} applied</p>
          <p className="text-xs text-green-600">You save {formatCurrency(coupon.discountAmount || 0)}</p>
        </div>
        <button onClick={() => dispatch(removeCoupon())} className="text-red-400 hover:text-red-600 text-xs font-medium">Remove</button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 mt-3">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === 'Enter' && apply()}
        placeholder="Enter coupon code"
        className="input-field flex-1 text-sm py-2.5"
      />
      <button onClick={apply} disabled={loading || !code.trim()}
        className="btn-secondary px-4 py-2.5 text-sm flex-shrink-0 disabled:opacity-50">
        {loading ? <Spinner size="sm" /> : 'Apply'}
      </button>
    </div>
  );
}

export default function CartDrawer() {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const isOpen      = useSelector(selectIsCartOpen);
  const isLoggedIn  = useSelector(selectIsLoggedIn);
  const items       = useSelector(selectCartItems);
  const totals      = useSelector(selectCartTotals);
  const { discount } = useSelector(selectCart);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleCheckout = () => {
    dispatch(closeCart());
    if (!isLoggedIn) { navigate('/login'); return; }
    navigate('/checkout');
  };

  const progressPct = Math.min((totals.subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100);
  const remaining   = FREE_DELIVERY_THRESHOLD - totals.subtotal;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => dispatch(closeCart())}
      />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white z-50 flex flex-col shadow-modal transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Your cart</h2>
            <p className="text-xs text-gray-500">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
          </div>
          <button onClick={() => dispatch(closeCart())}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">Your cart is empty</h3>
            <p className="text-sm text-gray-500 mb-5">Add items to get started</p>
            <button onClick={() => dispatch(closeCart())} className="btn-primary">Browse menu</button>
          </div>
        ) : (
          <>
            {/* Free delivery progress */}
            {remaining > 0 && (
              <div className="px-5 py-3 bg-brand-50 border-b border-brand-100">
                <p className="text-xs text-brand-700 mb-1.5">
                  Add {formatCurrency(remaining)} more for <strong>free delivery</strong>
                </p>
                <div className="h-1.5 bg-brand-200 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5">
              {items.map((item) => <CartItem key={item.productId} item={item} />)}
              <CouponInput />
            </div>

            {/* Bill summary */}
            <div className="border-t border-gray-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Bill details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Item total</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon discount</span>
                    <span>−{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery fee</span>
                  <span className={totals.delivery === 0 ? 'text-green-600 font-medium' : ''}>
                    {totals.delivery === 0 ? 'FREE' : formatCurrency(totals.delivery)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform fee</span>
                  <span>{formatCurrency(totals.platformFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                  <span>To pay</span>
                  <span>{formatCurrency(totals.total - discount)}</span>
                </div>
              </div>
              <button onClick={handleCheckout} className="btn-primary w-full mt-4">
                Proceed to checkout →
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
