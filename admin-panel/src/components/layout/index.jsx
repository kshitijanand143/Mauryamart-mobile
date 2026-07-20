import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutAdmin, selectAdmin } from '../../redux/store';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/dashboard',  icon: '📊', label: 'Dashboard' },
  { to: '/users',      icon: '👥', label: 'Users' },
  { to: '/vendors',    icon: '🏪', label: 'Vendors' },
  { to: '/delivery',   icon: '🛵', label: 'Delivery Boys' },
  { to: '/products',   icon: '🍱', label: 'Products' },
  { to: '/categories', icon: '🗂️', label: 'Categories' },
  { to: '/orders',     icon: '📦', label: 'Orders' },
  { to: '/banners',    icon: '🖼️', label: 'Banners' },
  { to: '/coupons',    icon: '🎟️', label: 'Coupons' },
  { to: '/reports',    icon: '📈', label: 'Reports' },
  { to: '/settings',   icon: '⚙️', label: 'Settings' },
];

export function Sidebar({ collapsed, setCollapsed }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector(selectAdmin);

  const handleLogout = async () => {
    await dispatch(logoutAdmin());
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-white/10 flex-shrink-0`}>
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">K</div>
        {!collapsed && <span className="ml-3 text-white font-bold text-sm leading-tight">Kalyani<br/><span className="text-brand-400 text-xs font-normal">Admin Panel</span></span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group
               ${isActive ? 'bg-brand-500 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`
            }>
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="font-medium truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-white/10 p-3 flex-shrink-0">
        {!collapsed && user && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.name}</p>
              <p className="text-gray-400 text-xs truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button onClick={handleLogout}
          className={`flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg px-2 py-2 w-full transition-colors`}>
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export function TopBar({ collapsed, onToggle, title }) {
  return (
    <header className={`fixed top-0 right-0 z-30 flex h-16 items-center justify-between bg-white border-b border-gray-200 px-4 transition-all duration-300 ${collapsed ? 'left-16' : 'left-56'}`}>
      <div className="flex items-center gap-3">
        <button onClick={onToggle} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">{new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
        <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center">
          <span className="text-brand-600 text-xs font-bold">A</span>
        </div>
      </div>
    </header>
  );
}

export function PageLayout({ title, children }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-56'}`}>
        <TopBar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} title={title} />
        <main className="pt-16 p-6">{children}</main>
      </div>
    </div>
  );
}
