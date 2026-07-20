import axiosInstance from './axiosInstance';

// ── Products ─────────────────────────────────────────────────────────────────
export const productService = {
  getAll: (params) => axiosInstance.get('/products', { params }),
  getById: (id)    => axiosInstance.get(`/products/${id}`),
  search: (q)      => axiosInstance.get('/products/search', { params: { q } }),
  getFeatured: ()  => axiosInstance.get('/products/featured'),
  getByCategory: (categoryId, params) =>
    axiosInstance.get(`/products/category/${categoryId}`, { params }),
  getByVendor: (vendorId, params) =>
    axiosInstance.get(`/products/vendor/${vendorId}`, { params }),
};

// ── Categories ────────────────────────────────────────────────────────────────
export const categoryService = {
  getAll:  () => axiosInstance.get('/categories'),
  getById: (id) => axiosInstance.get(`/categories/${id}`),
};

// ── Vendors ───────────────────────────────────────────────────────────────────
export const vendorService = {
  getAll:  (params) => axiosInstance.get('/vendors', { params }),
  getById: (id)     => axiosInstance.get(`/vendors/${id}`),
  getNearby: (lat, lng, radius = 5000) =>
    axiosInstance.get('/vendors/nearby', { params: { lat, lng, radius } }),
  getFeatured: () => axiosInstance.get('/vendors/featured'),
};

// ── Cart ──────────────────────────────────────────────────────────────────────
export const cartService = {
  get:    ()                      => axiosInstance.get('/cart'),
  add:    (productId, quantity)   => axiosInstance.post('/cart/add', { productId, quantity }),
  update: (productId, quantity)   => axiosInstance.put('/cart/update', { productId, quantity }),
  remove: (productId)             => axiosInstance.delete(`/cart/remove/${productId}`),
  clear:  ()                      => axiosInstance.delete('/cart/clear'),
};

// ── Coupons ───────────────────────────────────────────────────────────────────
export const couponService = {
  validate: (code, cartTotal) =>
    axiosInstance.post('/coupons/validate', { code, cartTotal }),
  getAvailable: () => axiosInstance.get('/coupons/available'),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const orderService = {
  place:      (data)  => axiosInstance.post('/orders', data),
  getAll:     (params)=> axiosInstance.get('/orders/my', { params }),
  getById:    (id)    => axiosInstance.get(`/orders/${id}`),
  cancel:     (id, reason) => axiosInstance.patch(`/orders/${id}/cancel`, { reason }),
  getTracking:(id)    => axiosInstance.get(`/orders/${id}/tracking`),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentService = {
  initiate:  (orderId) => axiosInstance.post('/payments/initiate', { orderId }),
  verify:    (data)    => axiosInstance.post('/payments/verify', data),
  getStatus: (orderId) => axiosInstance.get(`/payments/status/${orderId}`),
};

// ── Addresses ─────────────────────────────────────────────────────────────────
export const addressService = {
  getAll:  ()       => axiosInstance.get('/addresses'),
  add:     (data)   => axiosInstance.post('/addresses', data),
  update:  (id, d)  => axiosInstance.put(`/addresses/${id}`, d),
  delete:  (id)     => axiosInstance.delete(`/addresses/${id}`),
  setDefault: (id)  => axiosInstance.patch(`/addresses/${id}/default`),
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewService = {
  add:         (data) => axiosInstance.post('/reviews', data),
  getByProduct:(id)   => axiosInstance.get(`/reviews/product/${id}`),
  getByVendor: (id)   => axiosInstance.get(`/reviews/vendor/${id}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationService = {
  getAll:    (params) => axiosInstance.get('/notifications', { params }),
  markRead:  (id)     => axiosInstance.patch(`/notifications/${id}/read`),
  markAllRead: ()     => axiosInstance.patch('/notifications/read-all'),
  saveFCMToken:(token)=> axiosInstance.post('/notifications/fcm-token', { token }),
};

// ── User / Profile ────────────────────────────────────────────────────────────
export const userService = {
  getProfile:    ()     => axiosInstance.get('/users/profile'),
  updateProfile: (data) => axiosInstance.put('/users/profile', data),
  changePassword:(data) => axiosInstance.put('/users/change-password', data),
  uploadAvatar:  (form) =>
    axiosInstance.post('/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ── Banners ───────────────────────────────────────────────────────────────────
export const bannerService = {
  getActive: () => axiosInstance.get('/banners/active'),
};
