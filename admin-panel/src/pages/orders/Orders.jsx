import React, { useEffect, useState, useCallback } from 'react';
import { ordersAPI } from '../../api/services';
import { PageLayout } from '../../components/layout';
import { PageLoader, EmptyState, Select, Pagination, Modal, StatusBadge } from '../../components/common';
import { fmt, fmtDate, STATUS_LABELS } from '../../utils/helpers';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...['placed','accepted','preparing','ready','picked_up','out_for_delivery','delivered','cancelled']
    .map(s => ({ value: s, label: STATUS_LABELS[s] })),
];

function OrderDetailModal({ order, onClose, onUpdated }) {
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order && ['accepted','preparing','ready'].includes(order.status)) {
      ordersAPI.availableRiders().then(r => setRiders(r.data.data)).catch(() => {});
    }
  }, [order]);

  const assign = async () => {
    if (!selectedRider) { toast.error('Select a rider'); return; }
    setLoading(true);
    try { await ordersAPI.assignRider(order._id, selectedRider); toast.success('Rider assigned'); onUpdated(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const cancelOrder = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setLoading(true);
    try { await ordersAPI.updateStatus(order._id, 'cancelled'); toast.success('Order cancelled'); onUpdated(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={!!order} onClose={onClose} title={`Order #${order?.orderNumber}`} size="lg">
      {order && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{order.customerId?.name} · {order.customerId?.phone}</p>
              <p className="text-sm text-gray-500">{order.vendorId?.storeName}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="border border-gray-100 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-2">ITEMS</p>
            {order.items?.map(it => (
              <div key={it._id} className="flex justify-between text-sm py-1">
                <span>{it.name} × {it.quantity}</span>
                <span className="font-medium">{fmt(it.price * it.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between font-bold text-sm">
              <span>Total</span><span>{fmt(order.totalAmount)}</span>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-1">Delivery address</p>
            {order.address?.addressLine1}, {order.address?.city}, {order.address?.state} – {order.address?.pincode}
          </div>

          {order.deliveryBoyId && (
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">Delivery partner</p>
              {order.deliveryBoyId.userId?.name} · {order.deliveryBoyId.userId?.phone}
            </div>
          )}

          {!order.deliveryBoyId && ['accepted','preparing','ready'].includes(order.status) && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Assign delivery partner</p>
              <div className="flex gap-2">
                <select value={selectedRider} onChange={e => setSelectedRider(e.target.value)} className="input-field flex-1">
                  <option value="">Select rider…</option>
                  {riders.map(r => <option key={r._id} value={r._id}>{r.userId?.name} ({r.vehicle?.type})</option>)}
                </select>
                <button onClick={assign} disabled={loading} className="btn-primary whitespace-nowrap">Assign</button>
              </div>
              {riders.length === 0 && <p className="text-xs text-gray-400 mt-1">No riders currently available</p>}
            </div>
          )}

          {['placed','accepted'].includes(order.status) && (
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button onClick={cancelOrder} disabled={loading} className="btn-danger">Cancel order</button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function Orders() {
  const [orders, setOrders]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [status, setStatus]   = useState('');
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail]   = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await ordersAPI.list({ page, limit: 15, status });
      setOrders(data.data.orders);
      setTotal(data.data.pagination.total);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!detailId) { setDetail(null); return; }
    ordersAPI.getById(detailId).then(r => setDetail(r.data.data)).catch(() => toast.error('Failed to load order'));
  }, [detailId]);

  return (
    <PageLayout title="Order Management">
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-end">
          <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} className="sm:w-56" />
        </div>

        {loading ? <PageLoader /> : orders.length === 0 ? (
          <EmptyState icon="📦" title="No orders found" />
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Order #</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Vendor</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Payment</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Date</th>
                  <th className="table-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(o => (
                  <tr key={o._id} className="hover:bg-gray-50">
                    <td className="table-td font-medium">#{o.orderNumber}</td>
                    <td className="table-td">{o.customerId?.name}</td>
                    <td className="table-td">{o.vendorId?.storeName}</td>
                    <td className="table-td font-semibold">{fmt(o.totalAmount)}</td>
                    <td className="table-td"><StatusBadge status={o.paymentStatus} /></td>
                    <td className="table-td"><StatusBadge status={o.status} /></td>
                    <td className="table-td text-gray-400">{fmtDate(o.createdAt)}</td>
                    <td className="table-td text-right">
                      <button onClick={() => setDetailId(o._id)} className="text-xs font-medium text-brand-500 hover:text-brand-600">View →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} total={total} limit={15} onChange={setPage} />
          </>
        )}
      </div>

      <OrderDetailModal order={detail} onClose={() => setDetailId(null)} onUpdated={() => { setDetailId(null); fetchOrders(); }} />
    </PageLayout>
  );
}
