import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginAdmin, clearError, selectAdmin, selectIsLoggedIn } from '../../redux/store';
import { Spinner } from '../../components/common';
import toast from 'react-hot-toast';

export default function Login() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { loading, error } = useSelector(selectAdmin);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => { if (isLoggedIn) navigate('/dashboard', { replace: true }); }, [isLoggedIn]);
  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('All fields required'); return; }
    await dispatch(loginAdmin(form));
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">K</div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">Kalyani Sweets & Fast Food</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@kalyani.com" autoComplete="email"
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••" autoComplete="current-password"
                className="input-field" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <><Spinner size="sm" /> Signing in…</> : 'Sign in to Admin'}
            </button>
          </form>
        </div>
        <p className="text-center text-gray-500 text-xs mt-4">Restricted access — authorised personnel only</p>
      </div>
    </div>
  );
}
