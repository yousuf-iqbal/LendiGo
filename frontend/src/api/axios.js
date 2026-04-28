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
    } catch (err) {
      console.error("Failed to get token:", err);
    }
  }
  return config;
});

// ✅ NEW: Response Interceptor: Handle 401/403 Globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    // If backend says Unauthorized or Forbidden
    if (err.response?.status === 401 || err.response?.status === 403) {
      console.warn("Session expired or invalid. Redirecting to login...");
      localStorage.clear();
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default API;