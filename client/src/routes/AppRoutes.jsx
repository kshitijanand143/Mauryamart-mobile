import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn } from '@/redux/slices/authSlice';
import Spinner from '@/components/common/Spinner';

// ── Lazy pages ────────────────────────────────────────────────────────────────
const Home           = lazy(() => import('@/pages/Home'));
const Login          = lazy(() => import('@/pages/auth/Login'));
const Register       = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const Search         = lazy(() => import('@/pages/Search'));
const CategoryPage   = lazy(() => import('@/pages/CategoryPage'));
const VendorPage     = lazy(() => import('@/pages/VendorPage'));
const ProductDetail  = lazy(() => import('@/pages/ProductDetail'));
const Cart           = lazy(() => import('@/pages/Cart'));
const Checkout       = lazy(() => import('@/pages/Checkout'));
const OrderSuccess   = lazy(() => import('@/pages/OrderSuccess'));
const OrderHistory   = lazy(() => import('@/pages/OrderHistory'));
const OrderDetail    = lazy(() => import('@/pages/OrderDetail'));
const TrackOrder     = lazy(() => import('@/pages/TrackOrder'));
const Notifications  = lazy(() => import('@/pages/Notifications'));
const Profile        = lazy(() => import('@/pages/profile/Profile'));
const EditProfile    = lazy(() => import('@/pages/profile/EditProfile'));
const Addresses      = lazy(() => import('@/pages/profile/Addresses'));
const NotFound       = lazy(() => import('@/pages/NotFound'));

// ── Guards ────────────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const location   = useLocation();
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  if (isLoggedIn) return <Navigate to="/" replace />;
  return children;
};

// ── App Routes ────────────────────────────────────────────────────────────────
export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>}>
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Home />} />
        <Route path="/search"   element={<Search />} />
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/vendor/:id"   element={<VendorPage />} />
        <Route path="/product/:id"  element={<ProductDetail />} />

        {/* Auth (only when not logged in) */}
        <Route path="/login"    element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />

        {/* Protected */}
        <Route path="/cart"     element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
        <Route path="/orders"   element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/track/:id"  element={<ProtectedRoute><TrackOrder /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/edit"  element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/profile/addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
