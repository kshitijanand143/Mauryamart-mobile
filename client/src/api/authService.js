import axiosInstance from './axiosInstance';

export const authService = {
  register: (data) =>
    axiosInstance.post('/auth/register', data),

  login: (data) =>
    axiosInstance.post('/auth/login', data),

  logout: () =>
    axiosInstance.post('/auth/logout'),

  forgotPassword: (email) =>
    axiosInstance.post('/auth/forgot-password', { email }),

  resetPassword: ({ token, password }) =>
    axiosInstance.post(`/auth/reset-password/${token}`, { password }),

  getMe: () =>
    axiosInstance.get('/auth/me'),
};
