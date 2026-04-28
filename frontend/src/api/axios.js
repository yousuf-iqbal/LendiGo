// src/api/axios.js
import axios from 'axios';
import { auth } from '../config/firebase';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Request Interceptor: Attach Token
API.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      // ✅ Only save token if it actually changed (prevents infinite re-renders)
      const existing = localStorage.getItem('token');
      if (existing !== token) {
        localStorage.setItem('token', token);
      }
    } catch (err) {
      console.error("Failed to get token:", err);
    }
  } else {
    // Fallback: use stored token if no currentUser (page refresh scenario)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response Interceptor: Handle 401/403 + auto token refresh
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    // Auto-refresh token if backend says it's expired
    if (err.response?.data?.error === 'token-expired' && auth.currentUser) {
      try {
        const fresh = await auth.currentUser.getIdToken(true);
        localStorage.setItem('token', fresh);
        err.config.headers.Authorization = `Bearer ${fresh}`;
        return axios(err.config); // retry original request
      } catch {
        // If refresh fails, fall through to logout
      }
    }
    
    // Handle unauthorized/forbidden
    if (err.response?.status === 401 || err.response?.status === 403) {
      console.warn("Session expired. Redirecting to login...");
      localStorage.clear();
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default API;