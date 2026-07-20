import React, { useEffect, useState, useCallback } from 'react';
import { vendorsAPI } from '../../api/services';
import { PageLayout } from '../../components/layout';
import { PageLoader, EmptyState, SearchBar, Select, Pagination, Modal, StatusBadge } from '../../components/common';
import { fmtDate, fmtNum } from '../../utils/helpers';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
];

function ApprovalModal({ vendor, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const act = async (status) => {
    if (status === 'rejected' && !reason.trim()) {
      toast.error('Provide a rejection reason');
      return;
    }
    setLoading(true);
    try {
      await vendorsAPI.approve(vendor._id, { status, rejectionReason: reason });
      toast.success(`Vendor ${status}`);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={!!vendor} onClose={onClose} title="Vendor details" size="lg">
      {vendor && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-600">
              {vendor.storeName?.[0]?.toUpperCase() || 'V'}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{vendor.storeName}</h3>
              <p className="text-sm text-gray-500">{vendor.userId?.name} · {vendor.userId?.email}</p>
              <p className="text-sm text-gray-500">{vendor.userId?.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Store type:</span> <span className="font-medium capitalize">{vendor.storeType}</span></div>
            <div><span className="text-gray-500">Status:</span> <StatusBadge status={vendor.approvalStatus} /></div>
            <div><span className="text-gray-500">Registered:</span> <span className="font-medium">{fmtDate(vendor.createdAt)}</span></div>
            <div><span className="text-gray-500">Orders:</span> <span className="font-medium">{fmtNum(vendor.totalOrders)}</span></div>
          </div>

          {vendor.description && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
              <p className="text-sm text-gray-500">{vendor.description}</p>
            </div>
          )}

          {vendor.documents?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Documents</p>
              <div className="flex flex-wrap gap-2">
                {vendor.documents.map((d, i) => (
                  <a key={i} href={d.url} target="_blank" rel="noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                    📄 {d.type?.toUpperCase()}
                  </a>
                ))}
              </div>
            </div>
          )}

          {vendor.approvalStatus === 'pending' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Rejection reason (required if rejecting)
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={2}
                className="input-field resize-none"
                placeholder="Optional for approval, required for rejection"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            {vendor.approvalStatus === 'pending' ? (
              <>
                <button onClick={() => act('rejected')} disabled={loading} className="btn-danger" style={{ width: 'auto', padding: '8px 16px' }}>
                  Reject
                </button>
                <button onClick={() => act('approved')} disabled={loading} className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }}>
                  {loading ? 'Processing...' : 'Approve ✓'}
                </button>
              </>
            ) : vendor.approvalStatus === 'approved' ? (
              <button onClick={() => act('suspended')} disabled={loading} className="btn-danger" style={{ width: 'auto', padding: '8px 16px' }}>
                Suspend store
              </button>
            ) : (
              <button onClick={() => act('approved')} disabled={loading} className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }}>
                Re-approve
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Vendors() {
  const [vendors, setVendors]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [detailVendor, setDetailVendor] = useState(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      // Pending vendors fetch karo
      const pendingRes = await vendorsAPI.pending().catch(() => ({ data: { data: [] } }));
      const pendingList = (pendingRes.data?.data || []).map(v => ({
        ...v,
        approvalStatus: v.approvalStatus || 'pending',
      }));

      // All other vendors fetch karo
      const allRes = await vendorsAPI.list({ page, limit: 20, search }).catch(() => ({ data: { data: { vendors: [] } } }));
      const allList = allRes.data?.data?.vendors || allRes.data?.data || [];

      // Merge — pending pehle, phir baaki (duplicates remove karo)
      const pendingIds = new Set(pendingList.map(v => v._id));
      const otherList  = allList.filter(v => !pendingIds.has(v._id));
      let combined = [...pendingList, ...otherList];

      // Status filter
      if (status) combined = combined.filter(v => v.approvalStatus === status);

      // Search filter (client side)
      if (search) {
        combined = combined.filter(v =>
          v.storeName?.toLowerCase().includes(search.toLowerCase()) ||
          v.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
          v.userId?.email?.toLowerCase().includes(search.toLowerCase())
        );
      }

      setVendors(combined);
      setTotal(combined.length);
    } catch (err) {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);
  useEffect(() => { setPage(1); }, [search, status]);

  const pendingCount = vendors.filter(v => v.approvalStatus === 'pending').length;

  return (
    <PageLayout title="Vendor Management">

      {/* Pending alert */}
      {pendingCount > 0 && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="font-semibold text-orange-800">{pendingCount} vendor{pendingCount > 1 ? 's' : ''} awaiting approval</p>
            <p className="text-sm text-orange-600">Click "View" to approve or reject</p>
          </div>
          <button onClick={() => setStatus('pending')} className="ml-auto text-sm font-semibold text-orange-700 hover:text-orange-900 underline">
            Show pending
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <SearchBar value={search} onChange={setSearch} placeholder="Search store name, email…" className="sm:w-80" />
          <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} className="sm:w-48" />
        </div>

        {loading ? <PageLoader /> : vendors.length === 0 ? (
          <EmptyState icon="🏪" title="No vendors found" subtitle={status ? `No vendors with status "${status}"` : 'No vendors registered yet'} />
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Store</th>
                  <th className="table-th">Owner</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Orders</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Registered</th>
                  <th className="table-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendors.map(v => (
                  <tr key={v._id} className={`hover:bg-gray-50 ${v.approvalStatus === 'pending' ? 'bg-orange-50/40' : ''}`}>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm flex-shrink-0">
                          {v.storeName?.[0]?.toUpperCase() || 'V'}
                        </div>
                        <span className="font-medium">{v.storeName || '—'}</span>
                      </div>
                    </td>
                    <td className="table-td text-gray-500">{v.userId?.name || '—'}</td>
                    <td className="table-td capitalize">{v.storeType || '—'}</td>
                    <td className="table-td">{fmtNum(v.totalOrders)}</td>
                    <td className="table-td"><StatusBadge status={v.approvalStatus} /></td>
                    <td className="table-td text-gray-400">{fmtDate(v.createdAt)}</td>
                    <td className="table-td text-right">
                      <button
                        onClick={() => setDetailVendor(v)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          v.approvalStatus === 'pending'
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            : 'text-brand-500 hover:text-brand-600'
                        }`}>
                        {v.approvalStatus === 'pending' ? 'Review →' : 'View →'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              {total} vendor{total !== 1 ? 's' : ''} total
            </div>
          </>
        )}
      </div>

      <ApprovalModal
        vendor={detailVendor}
        onClose={() => setDetailVendor(null)}
        onDone={() => { setDetailVendor(null); fetchVendors(); }}
      />
    </PageLayout>
  );
}
