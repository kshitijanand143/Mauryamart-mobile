import api from './axios';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:  (d) => api.post('/auth/login', d),
  logout: ()  => api.post('/auth/logout'),
  me:     ()  => api.get('/auth/me'),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  dashboard:        ()    => api.get('/admin/dashboard'),
  revenueAnalytics: (d)   => api.get('/admin/analytics/revenue', { params: { days: d } }),
  orderStats:       ()    => api.get('/admin/analytics/orders'),
  settings:         ()    => api.get('/admin/settings'),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersAPI = {
  list:         (p)  => api.get('/admin/users', { params: p }),
  getById:      (id) => api.get(`/admin/users/${id}`),
  toggleActive: (id) => api.patch(`/admin/users/${id}/toggle-active`),
};

// ── Vendors ───────────────────────────────────────────────────────────────────
export const vendorsAPI = {
  // All vendors — status param se filter hota hai
  list:    (p)        => api.get('/vendors', { params: { storeType: 'all', ...p } }),
  // Pending vendors separately
  pending: ()         => api.get('/vendors/admin/pending'),
  // Approve / reject / suspend
  approve: (id, body) => api.patch(`/vendors/${id}/approve`, body),
  // Commission update
  commission: (id, pct) => api.patch(`/admin/vendors/${id}/commission`, { commissionPercent: pct }),
  getById: (id)       => api.get(`/vendors/${id}`),
};

// ── Delivery Boys ─────────────────────────────────────────────────────────────
export const deliveryAPI = {
  list:    (p)        => api.get('/delivery/admin/all', { params: p }),
  pending: ()         => api.get('/delivery/admin/pending'),
  approve: (id, body) => api.patch(`/delivery/${id}/approve`, body),
  getById: (id)       => api.get(`/delivery/${id}`),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsAPI = {
  list:        (p)     => api.get('/products', { params: p }),
  create:      (form)  => api.post('/products', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:      (id, f) => api.put(`/products/${id}`, f, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:      (id)    => api.delete(`/products/${id}`),
  toggleStock: (id)    => api.patch(`/products/${id}/toggle-stock`),
};

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesAPI = {
  list:   (p)     => api.get('/categories', { params: p }),
  create: (form)  => api.post('/categories', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, f) => api.put(`/categories/${id}`, f, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id)    => api.delete(`/categories/${id}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersAPI = {
  list:            (p)         => api.get('/orders/admin', { params: p }),
  getById:         (id)        => api.get(`/orders/${id}`),
  updateStatus:    (id, s)     => api.patch(`/orders/${id}/status`, { status: s }),
  assignRider:     (id, rider) => api.patch(`/orders/${id}/assign-rider`, { deliveryBoyId: rider }),
  availableRiders: ()          => api.get('/delivery/available'),
};

// ── Banners ───────────────────────────────────────────────────────────────────
export const bannersAPI = {
  list:   ()       => api.get('/banners/admin'),
  create: (form)   => api.post('/banners', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, f)  => api.put(`/banners/${id}`, f, { headers: { 'Content-Type': 'multipart/form-data' } }),
  toggle: (id)     => api.patch(`/banners/${id}/toggle`),
  delete: (id)     => api.delete(`/banners/${id}`),
};

// ── Coupons ───────────────────────────────────────────────────────────────────
export const couponsAPI = {
  list:   (p)     => api.get('/coupons', { params: p }),
  create: (body)  => api.post('/coupons', body),
  update: (id, b) => api.put(`/coupons/${id}`, b),
  delete: (id)    => api.delete(`/coupons/${id}`),
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewsAPI = {
  list:   (p) => api.get('/reviews', { params: p }),
  delete: (id) => api.delete(`/reviews/${id}`),
};
