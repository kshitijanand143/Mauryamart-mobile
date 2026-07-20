import React, { useEffect, useState, useCallback } from 'react';
import { usersAPI } from '../../api/services';
import { PageLayout } from '../../components/layout';
import { PageLoader, EmptyState, SearchBar, Select, Pagination, ConfirmDialog } from '../../components/common';
import { fmtDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'customer', label: 'Customer' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'delivery_boy', label: 'Delivery Boy' },
  { value: 'admin', label: 'Admin' },
];

export default function Users() {
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [role, setRole]       = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmUser, setConfirmUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await usersAPI.list({ page, limit: 15, search, role });
      setUsers(data.data.users);
      setTotal(data.data.pagination.total);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search, role]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search, role]);

  const handleToggle = async (user) => {
    try {
      await usersAPI.toggleActive(user._id);
      toast.success(`${user.name} ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <PageLayout title="User Management">
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, phone…" className="sm:w-80" />
          <Select value={role} onChange={setRole} options={ROLE_OPTIONS} className="sm:w-48" />
        </div>

        {loading ? <PageLoader /> : users.length === 0 ? (
          <EmptyState icon="👥" title="No users found" />
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Name</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Phone</th>
                  <th className="table-th">Role</th>
                  <th className="table-th">Joined</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="table-td font-medium">{u.name}</td>
                    <td className="table-td text-gray-500">{u.email}</td>
                    <td className="table-td text-gray-500">{u.phone || '—'}</td>
                    <td className="table-td"><span className="badge-blue capitalize">{u.role.replace('_', ' ')}</span></td>
                    <td className="table-td text-gray-400">{fmtDate(u.createdAt)}</td>
                    <td className="table-td">
                      <span className={u.isActive ? 'badge-green' : 'badge-red'}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="table-td text-right">
                      {u.role !== 'admin' && (
                        <button onClick={() => setConfirmUser(u)}
                          className={`text-xs font-medium ${u.isActive ? 'text-red-500 hover:text-red-600' : 'text-green-600 hover:text-green-700'}`}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} total={total} limit={15} onChange={setPage} />
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmUser}
        onClose={() => setConfirmUser(null)}
        onConfirm={() => handleToggle(confirmUser)}
        title={confirmUser?.isActive ? 'Deactivate user?' : 'Activate user?'}
        message={`This will ${confirmUser?.isActive ? 'prevent' : 'allow'} ${confirmUser?.name} from logging in.`}
        danger={confirmUser?.isActive}
      />
    </PageLayout>
  );
}
