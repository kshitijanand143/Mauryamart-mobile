import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate }  from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsLoggedIn, selectUser, logout } from '@/redux/slices/authSlice';
import { selectCartCount }  from '@/redux/slices/cartSlice';
import { selectNotifCount } from '@/redux/slices/uiSlice';
import { selectLocation }   from '@/redux/slices/locationSlice';
import { toggleCart }       from '@/redux/slices/uiSlice';
import { authService }      from '@/api/authService';
import { disconnectSocket } from '@/socket/socketClient';
import { getInitials }      from '@/utils/formatters';
import toast                from 'react-hot-toast';

export default function Header() {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const isLoggedIn  = useSelector(selectIsLoggedIn);
  const user        = useSelector(selectUser);
  const cartCount   = useSelector(selectCartCount);
  const notifCount  = useSelector(selectNotifCount);
  const location    = useSelector(selectLocation);

  const [searchQuery, setSearchQuery]  = useState('');
  const [isMenuOpen,  setIsMenuOpen]   = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => { if (!menuRef.current?.contains(e.target)) setIsMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    disconnectSocket();
    dispatch(logout());
    setIsMenuOpen(false);
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center gap-3 h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-sm">K</div>
            <span className="hidden sm:block font-bold text-gray-900 text-base leading-tight">
              Kalyani<br />
              <span className="text-brand-500 text-xs font-medium">Sweets & Food</span>
            </span>
          </Link>

          {/* Location picker */}
          <button
            onClick={() => dispatch({ type: 'ui/openLocationModal' })}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors max-w-[200px]"
          >
            <svg className="w-4 h-4 text-brand-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-gray-700 truncate">{location.address}</span>
            <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for sweets, food, restaurants…"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                {/* Notifications */}
                <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                <button onClick={() => dispatch(toggleCart())} className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* Avatar menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen((v) => !v)}
                    className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center hover:bg-brand-200 transition-colors"
                  >
                    {getInitials(user?.name)}
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 top-10 w-52 bg-white rounded-2xl shadow-modal border border-gray-100 py-1.5 z-50 animate-fade-in">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      {[
                        { to: '/profile',             label: 'My profile' },
                        { to: '/orders',              label: 'My orders' },
                        { to: '/profile/addresses',   label: 'Saved addresses' },
                        { to: '/notifications',       label: 'Notifications' },
                      ].map((item) => (
                        <Link key={item.to} to={item.to} onClick={() => setIsMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          {item.label}
                        </Link>
                      ))}
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"    className="btn-ghost text-sm py-2 px-3">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
