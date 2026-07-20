import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearCart } from '@/redux/slices/cartSlice';
import { orderService } from '@/api/services';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/utils/constants';
import { StatusBadge, EmptyState, ImageWithFallback } from '@/components/common';
import Spinner from '@/components/common/Spinner';
import PageLayout from '@/components/layout/PageLayout';

// ── Order Success ─────────────────────────────────────────────────────────────
export function OrderSuccess() {
  const { id }    = useParams();
  const dispatch  = useDispatch();
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(clearCart());
    (async () => {
      try {
        const { data } = await orderService.getById(id);
        setOrder(data.data);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [id, dispatch]);

  if (loading) return (
    <PageLayout><div className="flex justify-center py-16"><Spinner size="lg" /></div></PageLayout>
  );

  return (
    <PageLayout>
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Order placed! 🎉</h1>
        <p className="text-sm text-gray-500 mb-2">
          Order #{order?.orderNumber || id.slice(-8).toUpperCase()}
        </p>
        <p className="text-sm text-gray-600 mb-8">
          {order?.paymentMethod === 'cod'
            ? 'Your order is confirmed. Pay when it arrives.'
            : 'Payment confirmed. Your order is being processed.'}
        </p>

        {order && (
          <div className="card p-4 text-left mb-6">
            <div className="space-y-2 text-sm">
              {order.items?.map((item) => (
                <div key={item.productId} className="flex justify-between text-gray-600">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total paid</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link to={`/track/${id}`} className="btn-primary">Track your order</Link>
          <Link to="/" className="btn-secondary">Continue browsing</Link>
        </div>
      </div>
    </PageLayout>
  );
}

// ── Order History ─────────────────────────────────────────────────────────────
export function OrderHistory() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await orderService.getAll({ page: p, limit: 10 });
      const incoming = data.data?.orders || [];
      setOrders((prev) => p === 1 ? incoming : [...prev, ...incoming]);
      setHasMore(data.data?.pagination?.hasMore || false);
      setPage(p);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(1); }, []);

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4 py-5">
        <h1 className="text-xl font-bold text-gray-900 mb-5">My orders</h1>

        {loading && page === 1 ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : orders.length === 0 ? (
          <EmptyState icon="📦" title="No orders yet"
            subtitle="Your order history will appear here."
            action={<Link to="/" className="btn-primary">Start ordering</Link>} />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link key={order._id} to={`/orders/${order._id}`}
                className="card p-4 flex items-start gap-3 hover:shadow-float transition-shadow">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <ImageWithFallback src={order.vendorLogo || order.items?.[0]?.image}
                    alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{order.vendorName}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {order.items?.map((i) => i.name).join(', ')}
                      </p>
                    </div>
                    <StatusBadge status={order.status} label={ORDER_STATUS_LABEL[order.status]} />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-bold text-gray-800">{formatCurrency(order.totalAmount)}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}

            {hasMore && (
              <button onClick={() => load(page + 1)} disabled={loading}
                className="btn-ghost w-full py-3 text-sm text-brand-500">
                {loading ? <Spinner size="sm" /> : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

// ── Order Detail ──────────────────────────────────────────────────────────────
export function OrderDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await orderService.getById(id);
        setOrder(data.data);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      await orderService.cancel(id, 'Cancelled by customer');
      setOrder((o) => ({ ...o, status: 'cancelled' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel at this stage');
    } finally { setCancelling(false); }
  };

  if (loading) return <PageLayout><div className="flex justify-center py-16"><Spinner size="lg" /></div></PageLayout>;
  if (!order)  return <PageLayout><EmptyState icon="📦" title="Order not found" /></PageLayout>;

  const steps = ['placed', 'accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered'];
  const currentStep = steps.indexOf(order.status);

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Order #{order.orderNumber || id.slice(-8).toUpperCase()}</h1>
            <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
          <StatusBadge status={order.status} label={ORDER_STATUS_LABEL[order.status]} />
        </div>

        {/* Timeline */}
        {order.status !== 'cancelled' && (
          <div className="card p-4 mb-4">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Order progress</h2>
            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-200" />
              {steps.map((step, i) => {
                const done    = i <= currentStep;
                const active  = i === currentStep;
                return (
                  <div key={step} className="relative flex items-start gap-4 pb-4 last:pb-0">
                    <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all ${done ? 'bg-brand-500 border-brand-500' : 'bg-white border-gray-200'}`}>
                      {done && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="pt-1">
                      <p className={`text-sm font-medium ${active ? 'text-brand-600' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                        {ORDER_STATUS_LABEL[step]}
                      </p>
                      {active && <p className="text-xs text-brand-500 font-medium">Current status</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="card p-4 mb-4">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Items ordered</h2>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.productId} className="flex items-center gap-3">
                <ImageWithFallback src={item.image} alt={item.name}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">× {item.quantity}</p>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(order.subtotal || 0)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{order.deliveryFee === 0 ? 'FREE' : formatCurrency(order.deliveryFee || 0)}</span></div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span><span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        <div className="card p-4 mb-4">
          <h2 className="text-sm font-bold text-gray-900 mb-2">Delivered to</h2>
          <p className="text-sm text-gray-600">{order.address?.addressLine1}, {order.address?.city}, {order.address?.state} – {order.address?.pincode}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {['placed', 'accepted'].includes(order.status) && (
            <button onClick={handleCancel} disabled={cancelling} className="btn-secondary flex-1 text-red-600 border-red-300">
              {cancelling ? <Spinner size="sm" /> : 'Cancel order'}
            </button>
          )}
          {['out_for_delivery', 'picked_up'].includes(order.status) && (
            <Link to={`/track/${id}`} className="btn-primary flex-1 text-center">Track order</Link>
          )}
          {order.status === 'delivered' && (
            <Link to="/" className="btn-primary flex-1 text-center">Reorder</Link>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default OrderSuccess;
