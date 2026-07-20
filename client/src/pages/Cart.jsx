import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectCartItems, selectCartTotals, selectCart,
  updateCartItem, removeFromCart, removeCoupon,
} from '@/redux/slices/cartSlice';
import { formatCurrency } from '@/utils/formatters';
import { FREE_DELIVERY_THRESHOLD } from '@/utils/constants';
import { ImageWithFallback, EmptyState } from '@/components/common';
import PageLayout from '@/components/layout/PageLayout';
import toast from 'react-hot-toast';
import { useState } from 'react';

function CartItemRow({ item }) {
  const dispatch = useDispatch();
  const [busy, setBusy] = useState(false);

  const change = async (qty) => {
    if (busy) return;
    setBusy(true);
    try {
      if (qty === 0) await dispatch(removeFromCart(item.productId)).unwrap();
      else           await dispatch(updateCartItem({ productId: item.productId, quantity: qty })).unwrap();
    } catch { toast.error('Could not update'); }
    finally  { setBusy(false); }
  };

  return (
    <div className="flex items-start gap-3 py-4 border-b border-gray-100 last:border-0">
      <Link to={`/product/${item.productId}`}>
        <ImageWithFallback src={item.image} alt={item.name}
          className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/product/${item.productId}`}>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
        </Link>
        <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(item.price)} each</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-2.5 py-1.5">
            <button onClick={() => change(item.quantity - 1)} disabled={busy}
              className="w-5 h-5 flex items-center justify-center text-brand-500 font-bold text-lg leading-none disabled:opacity-40">
              {item.quantity === 1 ? '🗑' : '−'}
            </button>
            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
            <button onClick={() => change(item.quantity + 1)} disabled={busy}
              className="w-5 h-5 flex items-center justify-center text-brand-500 font-bold text-lg leading-none disabled:opacity-40">+</button>
          </div>
          <span className="text-sm font-bold text-gray-900 ml-auto">{formatCurrency(item.price * item.quantity)}</span>
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const items     = useSelector(selectCartItems);
  const totals    = useSelector(selectCartTotals);
  const { coupon, discount } = useSelector(selectCart);
  const remaining = FREE_DELIVERY_THRESHOLD - totals.subtotal;

  if (!items.length) return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4">
        <EmptyState icon="🛒" title="Your cart is empty"
          subtitle="Looks like you haven't added anything yet."
          action={<Link to="/" className="btn-primary">Browse menu</Link>} />
      </div>
    </PageLayout>
  );

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 py-5">
        <h1 className="text-xl font-bold text-gray-900 mb-5">Your cart</h1>
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Items */}
          <div className="lg:col-span-2">
            <div className="card p-4">
              {remaining > 0 && (
                <div className="mb-4 p-3 bg-brand-50 rounded-xl border border-brand-100">
                  <p className="text-xs text-brand-700">
                    Add <strong>{formatCurrency(remaining)}</strong> more for free delivery!
                  </p>
                  <div className="h-1.5 bg-brand-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all"
                      style={{ width: `${Math.min((totals.subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100)}%` }} />
                  </div>
                </div>
              )}
              {items.map((item) => <CartItemRow key={item.productId} item={item} />)}
            </div>
          </div>

          {/* Bill summary */}
          <div className="mt-4 lg:mt-0">
            <div className="card p-4 sticky top-20">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Bill details</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Item total</span><span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      Coupon ({coupon?.code})
                      <button onClick={() => dispatch(removeCoupon())} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </span>
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
                  <span>Platform fee</span><span>{formatCurrency(totals.platformFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-3 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatCurrency(totals.total - discount)}</span>
                </div>
              </div>

              {!coupon && (
                <Link to="/checkout" className="block text-xs text-center text-brand-500 mt-3 hover:underline">
                  Have a coupon? Apply at checkout →
                </Link>
              )}

              <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-4">
                Proceed to checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
