import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCartItems, selectCartTotals, selectCart, clearCart } from '@/redux/slices/cartSlice';
import { placeOrder } from '@/redux/slices/orderSlice';
import { addressService, paymentService, couponService } from '@/api/services';
import { validateAddressForm } from '@/utils/validators';
import { formatCurrency } from '@/utils/formatters';
import { PAYMENT_METHOD } from '@/utils/constants';
import PageLayout from '@/components/layout/PageLayout';
import Spinner from '@/components/common/Spinner';
import toast from 'react-hot-toast';

// ── Address Form ──────────────────────────────────────────────────────────────
function AddressForm({ onSaved, onCancel }) {
  const [form, setForm]     = useState({ label: 'Home', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const save = async () => {
    const errs = validateAddressForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const { data } = await addressService.add(form);
      onSaved(data.data);
      toast.success('Address saved');
    } catch { toast.error('Failed to save address'); }
    finally { setLoading(false); }
  };

  const field = (name, label, placeholder, type = 'text') => (
    <div key={name}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={form[name]} placeholder={placeholder}
        onChange={(e) => { setForm((f) => ({ ...f, [name]: e.target.value })); setErrors((er) => ({ ...er, [name]: '' })); }}
        className={`input-field text-sm py-2.5 ${errors[name] ? 'border-red-400' : ''}`} />
      {errors[name] && <p className="text-xs text-red-500 mt-0.5">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="card p-4 mt-3">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Add new address</h3>
      <div className="flex gap-2 mb-3">
        {['Home', 'Work', 'Other'].map((l) => (
          <button key={l} onClick={() => setForm((f) => ({ ...f, label: l }))}
            className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${form.label === l ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 text-gray-600 hover:border-brand-300'}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {field('addressLine1', 'Address line 1 *', 'Flat/House no., Building, Street')}
        {field('addressLine2', 'Address line 2', 'Area, Colony (optional)')}
        <div className="grid grid-cols-2 gap-2">
          {field('city',    'City *',    'City')}
          {field('state',   'State *',   'State')}
        </div>
        {field('pincode', 'Pincode *', '6-digit pincode', 'tel')}
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={save} disabled={loading} className="btn-primary flex-1 text-sm py-2.5">
          {loading ? <Spinner size="sm" /> : 'Save address'}
        </button>
        <button onClick={onCancel} className="btn-ghost text-sm">Cancel</button>
      </div>
    </div>
  );
}

// ── Checkout Page ─────────────────────────────────────────────────────────────
export default function Checkout() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const items     = useSelector(selectCartItems);
  const totals    = useSelector(selectCartTotals);
  const { coupon, discount } = useSelector(selectCart);

  const [addresses,    setAddresses]    = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [payMethod,    setPayMethod]    = useState(PAYMENT_METHOD.ONLINE);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [couponCode,   setCouponCode]   = useState('');
  const [applying,     setApplying]     = useState(false);
  const [placing,      setPlacing]      = useState(false);
  const [loadingAddr,  setLoadingAddr]  = useState(true);

  useEffect(() => {
    if (!items.length) { navigate('/cart'); return; }
    (async () => {
      try {
        const { data } = await addressService.getAll();
        const list = data.data || [];
        setAddresses(list);
        setSelectedAddr(list.find((a) => a.isDefault)?._id || list[0]?._id || null);
      } catch {}
      finally { setLoadingAddr(false); }
    })();
  }, [items.length, navigate]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplying(true);
    try {
      const { data } = await couponService.validate(couponCode, totals.subtotal);
      dispatch({ type: 'cart/applyCoupon', payload: { coupon: data.data.coupon, discount: data.data.discount } });
      toast.success('Coupon applied!');
      setCouponCode('');
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid coupon'); }
    finally { setApplying(false); }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddr) { toast.error('Select a delivery address'); return; }
    setPlacing(true);
    try {
      const orderPayload = {
        addressId:     selectedAddr,
        paymentMethod: payMethod,
        couponCode:    coupon?.code,
      };
      const result = await dispatch(placeOrder(orderPayload)).unwrap();
      const orderId = result.order?._id || result._id;

      if (payMethod === PAYMENT_METHOD.ONLINE) {
        // Initiate Cashfree payment
        const { data: pData } = await paymentService.initiate(orderId);
        const { payment_session_id } = pData.data;
        // Load Cashfree SDK and open checkout
        if (window.Cashfree) {
          const cf = await window.Cashfree({ mode: import.meta.env.VITE_CF_ENV || 'sandbox' });
          cf.checkout({ paymentSessionId: payment_session_id, returnUrl: `${window.location.origin}/order-success/${orderId}` });
        } else {
          // Fallback: redirect
          navigate(`/order-success/${orderId}`);
        }
      } else {
        dispatch(clearCart());
        navigate(`/order-success/${orderId}`);
      }
    } catch (err) {
      toast.error(err || 'Order placement failed');
    } finally { setPlacing(false); }
  };

  const finalTotal = totals.total - (discount || 0);

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 py-5">
        <h1 className="text-xl font-bold text-gray-900 mb-5">Checkout</h1>
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-4">
            {/* Address */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900">Delivery address</h2>
                {!showAddrForm && (
                  <button onClick={() => setShowAddrForm(true)}
                    className="text-xs text-brand-500 font-medium hover:text-brand-600">+ Add new</button>
                )}
              </div>
              {loadingAddr ? <Spinner size="sm" /> : (
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <label key={addr._id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedAddr === addr._id ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="address" value={addr._id} checked={selectedAddr === addr._id}
                        onChange={() => setSelectedAddr(addr._id)} className="mt-0.5 accent-brand-500" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-700 mb-0.5">{addr.label}</p>
                        <p className="text-xs text-gray-600">{addr.addressLine1}, {addr.addressLine2 ? addr.addressLine2 + ', ' : ''}{addr.city}, {addr.state} – {addr.pincode}</p>
                      </div>
                    </label>
                  ))}
                  {addresses.length === 0 && !showAddrForm && (
                    <p className="text-sm text-gray-500">No saved addresses. Add one to continue.</p>
                  )}
                </div>
              )}
              {showAddrForm && (
                <AddressForm
                  onSaved={(addr) => { setAddresses((a) => [...a, addr]); setSelectedAddr(addr._id); setShowAddrForm(false); }}
                  onCancel={() => setShowAddrForm(false)}
                />
              )}
            </div>

            {/* Payment method */}
            <div className="card p-4">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Payment method</h2>
              <div className="space-y-2">
                {[
                  { value: PAYMENT_METHOD.ONLINE, label: 'Pay online', sub: 'UPI, Cards, Net banking via Cashfree', icon: '💳' },
                  { value: PAYMENT_METHOD.COD,    label: 'Cash on delivery', sub: 'Pay when your order arrives', icon: '💵' },
                ].map((opt) => (
                  <label key={opt.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${payMethod === opt.value ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" value={opt.value} checked={payMethod === opt.value}
                      onChange={() => setPayMethod(opt.value)} className="accent-brand-500" />
                    <span className="text-xl">{opt.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Coupon */}
            {!coupon && (
              <div className="card p-4">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Have a coupon?</h2>
                <div className="flex gap-2">
                  <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                    placeholder="Enter coupon code" className="input-field flex-1 text-sm py-2.5" />
                  <button onClick={applyCoupon} disabled={applying || !couponCode.trim()}
                    className="btn-secondary px-4 text-sm disabled:opacity-50">
                    {applying ? <Spinner size="sm" /> : 'Apply'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="mt-4 lg:mt-0">
            <div className="card p-4 sticky top-20">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Order summary</h2>
              <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-gray-600">
                    <span className="line-clamp-1 flex-1 pr-2">{item.name} × {item.quantity}</span>
                    <span className="flex-shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-3 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon ({coupon?.code})</span><span>−{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className={totals.delivery === 0 ? 'text-green-600' : ''}>
                    {totals.delivery === 0 ? 'FREE' : formatCurrency(totals.delivery)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform fee</span><span>{formatCurrency(totals.platformFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                  <span>Total</span><span>{formatCurrency(finalTotal)}</span>
                </div>
              </div>
              <button onClick={handlePlaceOrder} disabled={placing || !selectedAddr}
                className="btn-primary w-full mt-4 disabled:opacity-50">
                {placing
                  ? <><Spinner size="sm" /> Processing…</>
                  : payMethod === PAYMENT_METHOD.COD
                    ? `Place order · ${formatCurrency(finalTotal)}`
                    : `Pay · ${formatCurrency(finalTotal)}`
                }
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">Secured by Cashfree Payments</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
