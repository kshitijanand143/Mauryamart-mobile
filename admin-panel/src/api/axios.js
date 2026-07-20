import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = false;
let queue = [];
const drain = (err, token) => { queue.forEach(p => err ? p.reject(err) : p.resolve(token)); queue = []; };

api.interceptors.response.use(r => r, async (error) => {
  const orig = error.config;
  if (error.response?.status === 401 && !orig._retry) {
    if (refreshing) return new Promise((resolve, reject) => queue.push({ resolve, reject }))
      .then(t => { orig.headers.Authorization = `Bearer ${t}`; return api(orig); });
    orig._retry = true; refreshing = true;
    try {
      const { data } = await axios.post('/api/v1/auth/refresh-token', {}, { withCredentials: true });
      const token = data.data.accessToken;
      localStorage.setItem('admin_access_token', token);
      drain(null, token);
      orig.headers.Authorization = `Bearer ${token}`;
      return api(orig);
    } catch (e) {
      drain(e, null);
      localStorage.removeItem('admin_access_token');
      window.location.href = '/login';
      return Promise.reject(e);
    } finally { refreshing = false; }
  }
  return Promise.reject(error);
});

export default api;
