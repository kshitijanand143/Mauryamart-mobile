import React, { useEffect, useState, useCallback } from 'react';
import { couponsAPI } from '../../api/services';
import { PageLayout } from '../../components/layout';
import { PageLoader, EmptyState, Modal, ConfirmDialog, Select, Pagination } from '../../components/common';
import { fmt, fmtDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const emptyForm = {
  code: '', description: '', discountType: 'percentage', discountValue: '',
  maxDiscount: '', minOrderAmount: '', usageLimit: '', usagePerUser: 1, expiryDate: '',
};

function CouponForm({ coupon, onClose, onSaved }) {
  const [form, setForm] = useState(coupon ? {
    code: coupon.code, description: coupon.description || '', discountType: coupon.discountType,
    discountValue: coupon.discountValue, maxDiscount: coupon.maxDiscount || '',
    minOrderAmount: coupon.minOrderAmount || '', usageLimit: coupon.usageLimit || '',
    usagePerUser: coupon.usagePerUser || 1, expiryDate: coupon.expiryDate?.slice(0, 10) || '',
  } : emptyForm);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discountValue || !form.expiryDate) { toast.error('Code, discount value, and expiry are required'); return; }
    setLoading(true);
    try {
      const payload = { ...form, code: form.code.toUpperCase() };
      if (coupon) await couponsAPI.update(coupon._id, payload);
      else        await couponsAPI.create(payload);
      toast.success(coupon ? 'Coupon updated' : 'Coupon created');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Coupon code *</label>
        <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
          placeholder="WELCOME50" className="input-field uppercase" required disabled={!!coupon} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Discount type" value={form.discountType} onChange={v => setForm(f => ({ ...f, discountType: v }))}
          options={[{ value: 'percentage', label: 'Percentage' }, { value: 'flat', label: 'Flat amount' }]} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount value *</label>
          <input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} className="input-field" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Max discount (₹)</label>
          <input type="number" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} className="input-field" placeholder="No cap" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Min order (₹)</label>
          <input type="number" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} className="input-field" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Total usage limit</label>
          <input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} className="input-field" placeholder="Unlimited" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Uses per customer</label>
          <input type="number" value={form.usagePerUser} onChange={e => setForm(f => ({ ...f, usagePerUser: e.target.value }))} className="input-field" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry date *</label>
        <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} className="input-field" required />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving…' : 'Save coupon'}</button>
      </div>
    </form>
  );
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [formCoupon, setFormCoupon] = useState(undefined);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await couponsAPI.list({ page, limit: 12 });
      setCoupons(data.data.coupons);
      setTotal(data.data.pagination.total);
    } catch { toast.error('Failed to load coupons'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleDelete = async () => {
    try { await couponsAPI.delete(deleteTarget._id); toast.success('Coupon deleted'); fetchCoupons(); }
    catch { toast.error('Failed to delete'); }
  };

  const isExpired = (d) => new Date(d) < new Date();

  return (
    <PageLayout title="Coupon Management">
      <div className="flex justify-end mb-4">
        <button onClick={() => setFormCoupon(null)} className="btn-primary">+ Add Coupon</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? <PageLoader /> : coupons.length === 0 ? (
          <EmptyState icon="🎟️" title="No coupons yet" />
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Code</th>
                  <th className="table-th">Discount</th>
                  <th className="table-th">Min Order</th>
                  <th className="table-th">Usage</th>
                  <th className="table-th">Expires</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="table-td font-mono font-semibold">{c.code}</td>
                    <td className="table-td">{c.discountType === 'percentage' ? `${c.discountValue}%` : fmt(c.discountValue)}</td>
                    <td className="table-td">{fmt(c.minOrderAmount)}</td>
                    <td className="table-td">{c.totalUsed} / {c.usageLimit || '∞'}</td>
                    <td className="table-td text-gray-400">{fmtDate(c.expiryDate)}</td>
                    <td className="table-td">
                      <span className={!c.isActive ? 'badge-gray' : isExpired(c.expiryDate) ? 'badge-red' : 'badge-green'}>
                        {!c.isActive ? 'Inactive' : isExpired(c.expiryDate) ? 'Expired' : 'Active'}
                      </span>
                    </td>
                    <td className="table-td text-right space-x-3">
                      <button onClick={() => setFormCoupon(c)} className="text-xs font-medium text-brand-500 hover:text-brand-600">Edit</button>
                      <button onClick={() => setDeleteTarget(c)} className="text-xs font-medium text-red-500 hover:text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} total={total} limit={12} onChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={formCoupon !== undefined} onClose={() => setFormCoupon(undefined)} title={formCoupon ? 'Edit coupon' : 'Add coupon'} size="sm">
        {formCoupon !== undefined && (
          <CouponForm coupon={formCoupon} onClose={() => setFormCoupon(undefined)} onSaved={() => { setFormCoupon(undefined); fetchCoupons(); }} />
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete coupon?" message={`Delete "${deleteTarget?.code}"?`} danger />
    </PageLayout>
  );
}
