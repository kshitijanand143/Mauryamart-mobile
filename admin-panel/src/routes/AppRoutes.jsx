import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn } from '../redux/store';
import { PageLoader } from '../components/common';

const Login      = lazy(() => import('../pages/auth/Login'));
const Dashboard  = lazy(() => import('../pages/dashboard/Dashboard'));
const Users      = lazy(() => import('../pages/users/Users'));
const Vendors    = lazy(() => import('../pages/vendors/Vendors'));
const Delivery   = lazy(() => import('../pages/delivery/Delivery'));
const Products   = lazy(() => import('../pages/products/Products'));
const Categories = lazy(() => import('../pages/categories/Categories'));
const Orders     = lazy(() => import('../pages/orders/Orders'));
const Banners    = lazy(() => import('../pages/banners/Banners'));
const Coupons    = lazy(() => import('../pages/coupons/Coupons'));
const Reports    = lazy(() => import('../pages/reports/Reports'));
const Settings   = lazy(() => import('../pages/settings/Settings'));

function Protected({ children }) {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

export default function AppRoutes() {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><PageLoader /></div>}>
      <Routes>
        <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/dashboard"  element={<Protected><Dashboard /></Protected>} />
        <Route path="/users"      element={<Protected><Users /></Protected>} />
        <Route path="/vendors"    element={<Protected><Vendors /></Protected>} />
        <Route path="/delivery"   element={<Protected><Delivery /></Protected>} />
        <Route path="/products"   element={<Protected><Products /></Protected>} />
        <Route path="/categories" element={<Protected><Categories /></Protected>} />
        <Route path="/orders"     element={<Protected><Orders /></Protected>} />
        <Route path="/banners"    element={<Protected><Banners /></Protected>} />
        <Route path="/coupons"    element={<Protected><Coupons /></Protected>} />
        <Route path="/reports"    element={<Protected><Reports /></Protected>} />
        <Route path="/settings"   element={<Protected><Settings /></Protected>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
