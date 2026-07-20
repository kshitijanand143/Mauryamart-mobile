import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError, selectAuth } from '@/redux/slices/authSlice';
import { validateRegisterForm } from '@/utils/validators';
import toast from 'react-hot-toast';

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="flex gap-2 mt-2">
      {checks.map((c) => (
        <span key={c.label} className={`text-xs flex items-center gap-1 ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>
          <span>{c.ok ? '✓' : '○'}</span>{c.label}
        </span>
      ))}
    </div>
  );
}

export default function Register() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { isLoading, error } = useSelector(selectAuth);

  const [form,   setForm]   = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [show,   setShow]   = useState(false);

  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  useEffect(() => { if (error) toast.error(error); }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateRegisterForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      await dispatch(registerUser(form)).unwrap();
      toast.success('Account created! Welcome 🎉');
      navigate('/');
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-orange-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 shadow-float">K</div>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-sm text-gray-500 mt-1">Join thousands of happy customers</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {[
              { name: 'name',  label: 'Full name',    type: 'text',  placeholder: 'Priya Sharma',         auto: 'name' },
              { name: 'email', label: 'Email',         type: 'email', placeholder: 'you@example.com',      auto: 'email' },
              { name: 'phone', label: 'Mobile number', type: 'tel',   placeholder: '9876543210',            auto: 'tel' },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  autoComplete={field.auto}
                  className={`input-field ${errors[field.name] ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                />
                {errors[field.name] && <p className="mt-1 text-xs text-red-500">{errors[field.name]}</p>}
              </div>
            ))}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  className={`input-field pr-10 ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                />
                <button type="button" onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={show ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18'
                             : 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'} />
                  </svg>
                </button>
              </div>
              <PasswordStrength password={form.password} />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <p className="text-xs text-gray-500">
              By registering, you agree to our{' '}
              <Link to="/" className="text-brand-500 hover:underline">Terms of Service</Link> and{' '}
              <Link to="/" className="text-brand-500 hover:underline">Privacy Policy</Link>.
            </p>

            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading
                ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating account…</>
                : 'Create account'
              }
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-500 font-semibold hover:text-brand-600">Login</Link>
        </p>
      </div>
    </div>
  );
}
