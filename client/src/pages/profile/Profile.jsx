import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser, logout } from '@/redux/slices/authSlice';
import { userService, addressService } from '@/api/services';
import { authService } from '@/api/authService';
import { disconnectSocket } from '@/socket/socketClient';
import { validateAddressForm } from '@/utils/validators';
import { getInitials, formatDate } from '@/utils/formatters';
import { EmptyState } from '@/components/common';
import Spinner from '@/components/common/Spinner';
import PageLayout from '@/components/layout/PageLayout';
import toast from 'react-hot-toast';

// ── Profile ───────────────────────────────────────────────────────────────────
export function Profile() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const user      = useSelector(selectUser);

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    disconnectSocket();
    dispatch(logout());
    toast.success('Logged out');
    navigate('/');
  };

  const sections = [
    { icon: '📦', label: 'My orders',         to: '/orders' },
    { icon: '📍', label: 'Saved addresses',    to: '/profile/addresses' },
    { icon: '✏️', label: 'Edit profile',       to: '/profile/edit' },
    { icon: '🔔', label: 'Notifications',      to: '/notifications' },
  ];

  return (
    <PageLayout>
      <div className="max-w-lg mx-auto px-4 py-5">
        {/* Avatar card */}
        <div className="card p-5 flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 text-xl font-bold flex items-center justify-center flex-shrink-0">
            {getInitials(user?.name || 'U')}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{user?.name}</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {user?.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
          </div>
        </div>

        {/* Links */}
        <div className="card overflow-hidden mb-4">
          {sections.map((s, i) => (
            <Link key={s.to} to={s.to}
              className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${i < sections.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{s.icon}</span>
                <span className="text-sm font-medium text-gray-800">{s.label}</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        <button onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors">
          Log out
        </button>
      </div>
    </PageLayout>
  );
}

// ── Edit Profile ──────────────────────────────────────────────────────────────
export function EditProfile() {
  const user      = useSelector(selectUser);
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await userService.updateProfile(form);
      toast.success('Profile updated');
      navigate('/profile');
    } catch { toast.error('Failed to update profile'); }
    finally { setLoading(false); }
  };

  return (
    <PageLayout>
      <div className="max-w-lg mx-auto px-4 py-5">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Edit profile</h1>
        </div>

        <div className="card p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={`input-field ${errors.name ? 'border-red-400' : ''}`} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile number</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="10-digit mobile number" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={user?.email} disabled className="input-field opacity-60 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner size="sm" /> : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}

// ── Addresses ─────────────────────────────────────────────────────────────────
export function Addresses() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form,      setForm]      = useState({ label: 'Home', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });
  const [errors,    setErrors]    = useState({});
  const [saving,    setSaving]    = useState(false);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const { data } = await addressService.getAll();
      setAddresses(data.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAddresses(); }, []);

  const startEdit = (addr) => {
    setForm({ label: addr.label, addressLine1: addr.addressLine1, addressLine2: addr.addressLine2 || '', city: addr.city, state: addr.state, pincode: addr.pincode });
    setEditingId(addr._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ label: 'Home', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  const handleSave = async () => {
    const errs = validateAddressForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      if (editingId) await addressService.update(editingId, form);
      else           await addressService.add(form);
      toast.success(editingId ? 'Address updated' : 'Address saved');
      resetForm();
      fetchAddresses();
    } catch { toast.error('Failed to save address'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await addressService.delete(id);
      setAddresses((a) => a.filter((x) => x._id !== id));
      toast.success('Address deleted');
    } catch { toast.error('Could not delete'); }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressService.setDefault(id);
      setAddresses((a) => a.map((x) => ({ ...x, isDefault: x._id === id })));
    } catch {}
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
    <PageLayout>
      <div className="max-w-lg mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="btn-ghost p-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Saved addresses</h1>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4 py-2">+ Add</button>
          )}
        </div>

        {/* Address form */}
        {showForm && (
          <div className="card p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">{editingId ? 'Edit address' : 'New address'}</h2>
            <div className="flex gap-2 mb-3">
              {['Home', 'Work', 'Other'].map((l) => (
                <button key={l} onClick={() => setForm((f) => ({ ...f, label: l }))}
                  className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${form.label === l ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 text-gray-600'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {field('addressLine1', 'Address line 1 *', 'Flat/House no., Building, Street')}
              {field('addressLine2', 'Address line 2', 'Area, Colony (optional)')}
              <div className="grid grid-cols-2 gap-2">
                {field('city',  'City *',  'City')}
                {field('state', 'State *', 'State')}
              </div>
              {field('pincode', 'Pincode *', '6-digit pincode', 'tel')}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm py-2.5">
                {saving ? <Spinner size="sm" /> : editingId ? 'Update' : 'Save'}
              </button>
              <button onClick={resetForm} className="btn-ghost text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : addresses.length === 0 ? (
          <EmptyState icon="📍" title="No saved addresses" subtitle="Add an address to make checkout faster." />
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr._id} className={`card p-4 ${addr.isDefault ? 'border border-brand-200' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{addr.label}</span>
                    {addr.isDefault && <span className="text-xs font-semibold bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full">Default</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {!addr.isDefault && (
                      <button onClick={() => handleSetDefault(addr._id)} className="text-xs text-brand-500 hover:underline">Set default</button>
                    )}
                    <button onClick={() => startEdit(addr)} className="text-xs text-gray-500 hover:text-gray-700">Edit</button>
                    <button onClick={() => handleDelete(addr._id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-2">
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                  , {addr.city}, {addr.state} – {addr.pincode}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default Profile;
