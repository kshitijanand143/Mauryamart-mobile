import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/api/authService';
import { isValidEmail } from '@/utils/validators';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email,    setEmail]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) { setError('Enter a valid email address'); return; }
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 shadow-float">K</div>
          {sent
            ? <><h1 className="text-2xl font-bold text-gray-900">Check your inbox</h1>
                <p className="text-sm text-gray-500 mt-1">We've sent a reset link to <strong>{email}</strong></p></>
            : <><h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1>
                <p className="text-sm text-gray-500 mt-1">We'll send you a reset link</p></>
          }
        </div>

        <div className="card p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 mb-4">Didn't receive it? Check your spam folder or try again.</p>
              <button onClick={() => setSent(false)} className="btn-secondary w-full">Try again</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`input-field ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                />
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading
                  ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
                  : 'Send reset link'
                }
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-600 mt-5">
          Remembered it?{' '}
          <Link to="/login" className="text-brand-500 font-semibold hover:text-brand-600">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
