import React, { useEffect, useState, useCallback } from 'react';
import { deliveryAPI } from '../../api/services';
import { PageLayout } from '../../components/layout';
import { PageLoader, EmptyState, Select, Pagination, Modal, StatusBadge } from '../../components/common';
import { fmtDate, fmtNum } from '../../utils/helpers';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '',           label: 'All statuses' },
  { value: 'pending',    label: 'Pending' },
  { value: 'approved',   label: 'Approved' },
  { value: 'rejected',   label: 'Rejected' },
  { value: 'suspended',  label: 'Suspended' },
];

function RiderModal({ rider, onClose, onDone }) {
  const [reason,  setReason]  = useState('');
  const [loading, setLoading] = useState(false);

  const act = async (status) => {
    if (status === 'rejected' && !reason.trim()) {
      toast.error('Provide a rejection reason');
      return;
    }
    setLoading(true);
    try {
      await deliveryAPI.approve(rider._id, { status, rejectionReason: reason });
      toast.success(`Rider ${status}`);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={!!rider} onClose={onClose} title="Delivery Partner Details" size="lg">
      {rider && (
        <div className="space-y-4">
          {/* Basic info */}
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{rider.userId?.name}</h3>
            <p className="text-sm text-gray-500">{rider.userId?.email}</p>
            <p className="text-sm text-gray-500">{rider.userId?.phone}</p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded-xl p-3">
            <div>
              <span className="text-gray-400 text-xs">Vehicle Type</span>
              <p className="font-semibold capitalize">{rider.vehicle?.type || '—'}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Vehicle Number</span>
              <p className="font-semibold">{rider.vehicle?.number || '—'}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Vehicle Model</span>
              <p className="font-semibold">{rider.vehicle?.model || '—'}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Aadhaar</span>
              <p className="font-semibold">{rider.aadhaarNumber ? `****${rider.aadhaarNumber.slice(-4)}` : '—'}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">License</span>
              <p className="font-semibold">{rider.licenseNumber || '—'}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Registered</span>
              <p className="font-semibold">{fmtDate(rider.createdAt)}</p>
            </div>
          </div>

          {/* Documents */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Documents</p>
            <div className="flex flex-wrap gap-2">
              {rider.aadhaarDoc && (
                <a href={rider.aadhaarDoc} target="_blank" rel="noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-brand-600">
                  📄 Aadhaar
                </a>
              )}
              {rider.licenseDoc && (
                <a href={rider.licenseDoc} target="_blank" rel="noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-brand-600">
                  📄 License
                </a>
              )}
              {rider.vehicle?.doc && (
                <a href={rider.vehicle.doc} target="_blank" rel="noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-brand-600">
                  📄 Vehicle RC
                </a>
              )}
              {!rider.aadhaarDoc && !rider.licenseDoc && !rider.vehicle?.doc && (
                <p className="text-xs text-gray-400">No documents uploaded yet</p>
              )}
            </div>
          </div>

          {/* Rejection reason input */}
          {(rider.approvalStatus === 'pending' || rider.approvalStatus === 'approved') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Rejection reason (required if rejecting)
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={2}
                className="input-field resize-none"
                placeholder="Required only if rejecting"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            {rider.approvalStatus === 'pending' ? (
              <>
                <button
                  onClick={() => act('rejected')}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
                  Reject
                </button>
                <button
                  onClick={() => act('approved')}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50">
                  {loading ? 'Processing...' : 'Approve ✓'}
                </button>
              </>
            ) : rider.approvalStatus === 'approved' ? (
              <button
                onClick={() => act('suspended')}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
                Suspend
              </button>
            ) : (
              <button
                onClick={() => act('approved')}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50">
                Re-approve
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Delivery() {
  const [riders,  setRiders]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [status,  setStatus]  = useState('');
  const [loading, setLoading] = useState(true);
  const [detail,  setDetail]  = useState(null);

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    try {
      // Pending riders fetch karo
      const pendingRes = await deliveryAPI.pending().catch(() => ({ data: { data: [] } }));
      const pendingList = (pendingRes.data?.data || []).map(r => ({ ...r, approvalStatus: 'pending' }));

      // All riders fetch karo
      const allRes = await deliveryAPI.list({ page, limit: 20, status }).catch(() => ({ data: { data: { riders: [] } } }));
      const allList = allRes.data?.data?.riders || [];

      // Merge — pending pehle, baaki baad mein
      const pendingIds = new Set(pendingList.map(r => r._id));
      const otherList  = allList.filter(r => !pendingIds.has(r._id));
      let combined = [...pendingList, ...otherList];

      // Status filter
      if (status) combined = combined.filter(r => r.approvalStatus === status);

      setRiders(combined);
      setTotal(combined.length);
    } catch {
      toast.error('Failed to load delivery partners');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchRiders(); }, [fetchRiders]);

  const pendingCount = riders.filter(r => r.approvalStatus === 'pending').length;

  return (
    <PageLayout title="Delivery Partner Management">

      {/* Pending alert */}
      {pendingCount > 0 && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="font-semibold text-orange-800">
              {pendingCount} rider{pendingCount > 1 ? 's' : ''} awaiting approval
            </p>
            <p className="text-sm text-orange-600">Click "Review" to approve or reject</p>
          </div>
          <button
            onClick={() => setStatus('pending')}
            className="ml-auto text-sm font-semibold text-orange-700 underline">
            Show pending
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-end">
          <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} className="sm:w-48" />
        </div>

        {loading ? <PageLoader /> : riders.length === 0 ? (
          <EmptyState
            icon="🛵"
            title="No delivery partners found"
            subtitle={status ? `No riders with status "${status}"` : 'No riders registered yet'}
          />
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Name</th>
                  <th className="table-th">Phone</th>
                  <th className="table-th">Vehicle</th>
                  <th className="table-th">Deliveries</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {riders.map(r => (
                  <tr key={r._id} className={`hover:bg-gray-50 ${r.approvalStatus === 'pending' ? 'bg-orange-50/40' : ''}`}>
                    <td className="table-td font-medium">{r.userId?.name || '—'}</td>
                    <td className="table-td text-gray-500">{r.userId?.phone || '—'}</td>
                    <td className="table-td capitalize">{r.vehicle?.type || '—'} {r.vehicle?.number ? `· ${r.vehicle.number}` : ''}</td>
                    <td className="table-td">{fmtNum(r.totalDeliveries)}</td>
                    <td className="table-td"><StatusBadge status={r.approvalStatus} /></td>
                    <td className="table-td text-right">
                      <button
                        onClick={() => setDetail(r)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          r.approvalStatus === 'pending'
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            : 'text-brand-500 hover:text-brand-600'
                        }`}>
                        {r.approvalStatus === 'pending' ? 'Review →' : 'View →'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              {total} delivery partner{total !== 1 ? 's' : ''} total
            </div>
          </>
        )}
      </div>

      <RiderModal
        rider={detail}
        onClose={() => setDetail(null)}
        onDone={() => { setDetail(null); fetchRiders(); }}
      />
    </PageLayout>
  );
}
