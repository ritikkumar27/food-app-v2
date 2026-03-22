import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use your machine's local IP when testing on a physical device
// Use 10.0.2.2 for Android emulator, localhost for iOS simulator
const BASE_URL = 'http://192.168.29.104:5000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // SecureStore may not be available in some environments
      console.warn('SecureStore not available:', error.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear stored token
      try {
        await SecureStore.deleteItemAsync('authToken');
      } catch (e) {
        // ignore
      }
    }
    return Promise.reject(error);
  }
);

// ─── API Methods ─────────────────────────────────────────────────────

export const authAPI = {
  signup: (email, password) => api.post('/auth/signup', { email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
};

export const foodAPI = {
  getByBarcode: (barcode) => api.get(`/food/barcode/${barcode}`),
  search: (query, page = 1) => api.get('/food/search', { params: { q: query, page } }),
};

export const analysisAPI = {
  analyze: (barcode) => api.post('/analyze', { barcode }),
  getHistory: (page = 1, limit = 20) => api.get('/analyze/history', { params: { page, limit } }),
};

export default api;
