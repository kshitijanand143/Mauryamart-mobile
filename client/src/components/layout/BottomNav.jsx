import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn } from '@/redux/slices/authSlice';
import { selectCartCount }  from '@/redux/slices/cartSlice';
import { useDispatch }      from 'react-redux';
import { toggleCart }       from '@/redux/slices/uiSlice';

// ── Footer ────────────────────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-12 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-xs">K</div>
              <span className="text-white font-semibold text-sm">Kalyani</span>
            </div>
            <p className="text-xs leading-relaxed">Delivering joy with every bite. Sweets, fast food &amp; more.</p>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/" className="hover:text-brand-400 transition-colors">About us</Link></li>
              <li><Link to="/" className="hover:text-brand-400 transition-colors">Careers</Link></li>
              <li><Link to="/" className="hover:text-brand-400 transition-colors">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">For partners</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/vendor" className="hover:text-brand-400 transition-colors">Register your store</a></li>
              <li><a href="/rider"  className="hover:text-brand-400 transition-colors">Deliver with us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/" className="hover:text-brand-400 transition-colors">Privacy policy</Link></li>
              <li><Link to="/" className="hover:text-brand-400 transition-colors">Terms of service</Link></li>
              <li><Link to="/" className="hover:text-brand-400 transition-colors">Refund policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-xs text-center">
          © {new Date().getFullYear()} Kalyani Sweets & Fast Food. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// ── BottomNav (mobile only) ───────────────────────────────────────────────────
export function BottomNav() {
  const { pathname } = useLocation();
  const dispatch     = useDispatch();
  const isLoggedIn   = useSelector(selectIsLoggedIn);
  const cartCount    = useSelector(selectCartCount);

  const nav = [
    { to: '/',       icon: HomeIcon,       label: 'Home' },
    { to: '/search', icon: SearchIcon,     label: 'Search' },
    { cart: true,    icon: CartIcon,       label: 'Cart' },
    { to: isLoggedIn ? '/orders' : '/login',   icon: OrderIcon, label: 'Orders' },
    { to: isLoggedIn ? '/profile' : '/login',  icon: ProfileIcon, label: 'Profile' },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 pb-safe z-40">
      <div className="flex">
        {nav.map((item, i) => {
          const active = item.to && pathname === item.to;
          const Icon   = item.icon;
          if (item.cart) {
            return (
              <button key={i} onClick={() => dispatch(toggleCart())}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative">
                <div className="relative">
                  <Icon active={false} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-500">Cart</span>
              </button>
            );
          }
          return (
            <Link key={i} to={item.to}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 ${active ? 'text-brand-500' : 'text-gray-400'}`}>
              <Icon active={active} />
              <span className={`text-[10px] ${active ? 'text-brand-500 font-medium' : 'text-gray-500'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const HomeIcon    = ({ active }) => <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const SearchIcon  = ({ active }) => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const CartIcon    = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const OrderIcon   = ({ active }) => <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const ProfileIcon = ({ active }) => <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
